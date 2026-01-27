require('dotenv').config()

const express = require('express')
const path = require('path')
const mysql = require('mysql2')
const XLSX = require('xlsx')

const app = express()
const PORT = process.env.PORT || 3111

// MySQL connection pool - Load from environment variables
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err)
    return
  }
  console.log('Connected to MySQL database pool')
  connection.release()
})

// Middleware to parse JSON and URL-encoded data
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files
app.use(express.static(path.join(__dirname, 'public')))

// Serve the client HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/index.html'))
})

// Serve the remote HTML file
app.get('/remote', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/remote.html'))
})

// Serve the form HTML file
app.get('/checkin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/form.html'))
})

// Serve the check-in list HTML file
app.get('/checkin-list', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/checkin-list.html'))
})

// Middleware to check admin authentication
function requireAdminAuth(req, res, next) {
  const token =
    req.headers.authorization?.replace('Bearer ', '') ||
    req.query.token ||
    req.body.token

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'Authentication required' })
  }

  // Simple token validation (in production, use JWT or more secure method)
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  const expectedToken = Buffer.from(adminPassword + 'salt').toString('base64')

  if (token !== expectedToken) {
    return res.status(401).json({ success: false, message: 'Invalid token' })
  }

  next()
}

// Serve the login HTML file
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/login.html'))
})

// Admin login API
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

  if (password === adminPassword) {
    // Generate simple token (in production, use JWT)
    const token = Buffer.from(adminPassword + 'salt').toString('base64')

    res.json({
      success: true,
      message: 'Login successful',
      token: token,
    })
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid password',
    })
  }
})

// Serve the admin HTML file (authentication handled in frontend)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/admin.html'))
})

// Handle form submission
app.post('/checkin', (req, res) => {
  const { customerId, note } = req.body

  // First verify customer exists
  const getCustomerQuery =
    'SELECT name, department FROM checkin_iclc_2026 WHERE id = ?'

  db.query(getCustomerQuery, [customerId], (err, customerResults) => {
    if (err) {
      console.error('Error fetching customer:', err)
      return res.status(500).json({ success: false, message: 'Database error' })
    }

    if (customerResults.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Customer not found' })
    }

    // Update checked status, note if provided, and checkin_at timestamp
    let updateQuery
    let updateParams

    if (note && note.trim()) {
      updateQuery =
        "UPDATE checkin_iclc_2026 SET checked = 1, note = ?, checkin_at = CONVERT_TZ(NOW(), 'UTC', 'Asia/Ho_Chi_Minh') WHERE id = ?"
      updateParams = [note, customerId]
    } else {
      updateQuery =
        "UPDATE checkin_iclc_2026 SET checked = 1, checkin_at = CONVERT_TZ(NOW(), 'UTC', 'Asia/Ho_Chi_Minh') WHERE id = ?"
      updateParams = [customerId]
    }

    db.query(updateQuery, updateParams, (err, updateResult) => {
      if (err) {
        console.error('Error updating customer:', err)
        return res
          .status(500)
          .json({ success: false, message: 'Database error' })
      }

      console.log(
        'Check-in successful for customer:',
        customerResults[0].name,
        note && note.trim() ? '- Note updated' : ''
      )
      res.json({
        success: true,
        message: 'Check-in successful!',
        luckyNumber: customerId,
      })
    })
  })
})

// API endpoint to get check-in data
app.get('/api/checkins', (req, res) => {
  const query =
    'SELECT id, name, department, note, checkin_at FROM checkin_iclc_2026 ORDER BY id ASC'

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err)
      return res.status(500).json({ success: false, message: 'Database error' })
    }

    res.json(results)
  })
})

// API endpoint to get list of customers
app.get('/api/customers', (req, res) => {
  const query =
    'SELECT id, name, department FROM checkin_iclc_2026 WHERE checked = 0 ORDER BY name ASC'

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching customers:', err)
      return res.status(500).json({ success: false, message: 'Database error' })
    }

    res.json(results)
  })
})

// API endpoint to get departments (fixed 4 categories)
app.get('/api/departments', (req, res) => {
  // Fixed 4 categories in English as requested
  const categories = [
    'Employee', // Nhân viên
    'Foreign Teacher', // Giáo viên nước ngoài
    'Teaching Assistant - Vietnamese Teacher', // Trợ giảng - Giáo viên Việt Nam
    'Guest', // Khách mời
  ]

  res.json(categories)
})

// API endpoint to get customers by department
app.get('/api/customers-by-department', (req, res) => {
  const department = req.query.department

  if (!department) {
    return res
      .status(400)
      .json({ success: false, message: 'Department parameter is required' })
  }

  let query
  let params

  if (department === 'Guest') {
    // For Guests, get customers with no department, empty department, or guest-related departments
    query =
      'SELECT id, name, department FROM checkin_iclc_2026 WHERE (department IS NULL OR department = "" OR department IN ("Guest", "Khách mời")) AND checked = 0 ORDER BY name ASC'
    params = []
  } else if (department === 'Foreign Teacher') {
    // For Foreign Teachers, match exact department name
    query =
      'SELECT id, name, department FROM checkin_iclc_2026 WHERE department = ? AND checked = 0 ORDER BY name ASC'
    params = [department]
  } else if (department === 'Teaching Assistant - Vietnamese Teacher') {
    // For Teaching Assistants - Vietnamese Teachers, match exact department name
    query =
      'SELECT id, name, department FROM checkin_iclc_2026 WHERE department = ? AND checked = 0 ORDER BY name ASC'
    params = [department]
  } else if (department === 'Employee') {
    // For Employee, get all except the other 3 categories and all guest-related entries
    // This includes all departments that are not "Foreign Teacher", "Teaching Assistant - Vietnamese Teacher",
    // and not guest-related (null/empty, "Guest", "Khách mời", "Khch mi")
    query =
      'SELECT id, name, department FROM checkin_iclc_2026 WHERE department IS NOT NULL AND department != "" AND department NOT IN (?, ?, "Guest", "Khách mời") AND checked = 0 ORDER BY name ASC'
    params = ['Foreign Teacher', 'Teaching Assistant - Vietnamese Teacher']
  } else {
    // Fallback for any other department
    query =
      'SELECT id, name, department FROM checkin_iclc_2026 WHERE department = ? AND checked = 0 ORDER BY name ASC'
    params = [department]
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching customers by department:', err)
      return res.status(500).json({ success: false, message: 'Database error' })
    }

    res.json(results)
  })
})

// API endpoint to get max ID (total members)
app.get('/api/total-members', (req, res) => {
  const query = 'SELECT MAX(id) as maxId FROM checkin_iclc_2026'

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching max ID:', err)
      return res.status(500).json({ success: false, message: 'Database error' })
    }

    const maxId = results[0].maxId || 0
    res.json({ totalMembers: maxId })
  })
})

// API endpoint to get list of checked-in IDs for lucky draw
app.get('/api/checked-in-ids', (req, res) => {
  const query =
    'SELECT id FROM checkin_iclc_2026 WHERE checked = 1 ORDER BY id ASC'

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching checked-in IDs:', err)
      return res.status(500).json({ success: false, message: 'Database error' })
    }

    const ids = results.map((item) => item.id)
    res.json({
      totalMembers: ids.length,
      ids: ids,
    })
  })
})

// API endpoint to get customer details by IDs (for displaying in prize results)
app.get('/api/customers-by-ids', (req, res) => {
  const ids = req.query.ids ? req.query.ids.split(',').map(Number) : []

  if (ids.length === 0) {
    return res.json({})
  }

  const placeholders = ids.map(() => '?').join(',')
  const query = `SELECT id, name, department FROM checkin_iclc_2026 WHERE id IN (${placeholders})`

  db.query(query, ids, (err, results) => {
    if (err) {
      console.error('Error fetching customer details:', err)
      return res.status(500).json({ success: false, message: 'Database error' })
    }

    // Convert to object with id as key for easy lookup
    const customerMap = {}
    results.forEach((item) => {
      customerMap[item.id] = item
    })

    res.json(customerMap)
  })
})

// API endpoint to export check-in data to Excel
app.get('/api/export-checkins', (req, res) => {
  const query =
    'SELECT id, name, department, note, checkin_at FROM checkin_iclc_2026 ORDER BY id ASC'

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data for export:', err)
      return res.status(500).json({ success: false, message: 'Database error' })
    }

    // Prepare data for Excel
    const excelData = results.map((item) => ({
      'Lucky Number': item.id,
      Name: item.name,
      Department: item.department,
      Note: item.note || '',
      'Check-in Time': item.checkin_at
        ? new Date(item.checkin_at).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        : '',
    }))

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 }, // Lucky Number
      { wch: 30 }, // Name
      { wch: 20 }, // Department
      { wch: 40 }, // Note
      { wch: 20 }, // Check-in Time
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Check-in List')

    // Generate filename with current date
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD format
    const filename = `checkin_list_${dateStr}.xlsx`

    // Send file as response
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`)

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    res.send(buffer)
  })
})

// Admin API endpoints (protected)
app.use('/api/admin', requireAdminAuth)

// Get all customers for admin (including checked status)
app.get('/api/admin/customers', (req, res) => {
  const query =
    'SELECT id, name, department, note, checked, checkin_at FROM checkin_iclc_2026 ORDER BY id ASC'

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching admin customers:', err)
      return res.status(500).json({ success: false, message: 'Database error' })
    }

    res.json(results)
  })
})

// Add new customer
app.post('/api/admin/customers', (req, res) => {
  const { name, department, note, checked } = req.body

  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Name is required' })
  }

  const query =
    "INSERT INTO checkin_iclc_2026 (name, department, note, checked, created_at) VALUES (?, ?, ?, ?, CONVERT_TZ(NOW(), 'UTC', 'Asia/Ho_Chi_Minh'))"

  db.query(
    query,
    [
      name.trim(),
      department ? department.trim() : null,
      note ? note.trim() : null,
      checked || 0,
    ],
    (err, result) => {
      if (err) {
        console.error('Error adding customer:', err)
        return res
          .status(500)
          .json({ success: false, message: 'Database error' })
      }

      console.log('Customer added successfully:', result.insertId)
      res.json({
        success: true,
        message: 'Customer added successfully',
        customerId: result.insertId,
      })
    }
  )
})

// Update customer
app.put('/api/admin/customers/:id', (req, res) => {
  const id = req.params.id
  const { name, department, note, checked } = req.body

  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Name is required' })
  }

  // If unchecking (checked = 0), also clear checkin_at timestamp
  const isChecked = checked === 1 ? 1 : 0

  let query
  let params

  if (isChecked === 0) {
    query =
      'UPDATE checkin_iclc_2026 SET name = ?, department = ?, note = ?, checked = 0, checkin_at = NULL WHERE id = ?'
    params = [
      name.trim(),
      department ? department.trim() : null,
      note ? note.trim() : null,
      id,
    ]
  } else {
    query =
      "UPDATE checkin_iclc_2026 SET name = ?, department = ?, note = ?, checked = 1, checkin_at = CONVERT_TZ(NOW(), 'UTC', 'Asia/Ho_Chi_Minh') WHERE id = ?"
    params = [
      name.trim(),
      department ? department.trim() : null,
      note ? note.trim() : null,
      id,
    ]
  }

  db.query(query, params, (err, result) => {
    if (err) {
      console.error('Error updating customer:', err)
      return res.status(500).json({ success: false, message: 'Database error' })
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Customer not found' })
    }

    console.log('Customer updated successfully:', id)
    res.json({
      success: true,
      message: 'Customer updated successfully',
    })
  })
})

// Reset customer check-in status
app.put('/api/admin/customers/:id/reset', (req, res) => {
  const id = req.params.id

  const query =
    'UPDATE checkin_iclc_2026 SET checked = 0, checkin_at = NULL WHERE id = ?'

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error resetting customer:', err)
      return res.status(500).json({ success: false, message: 'Database error' })
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Customer not found' })
    }

    console.log('Customer check-in reset successfully:', id)
    res.json({
      success: true,
      message: 'Customer check-in status reset successfully',
    })
  })
})

// Delete customer
app.delete('/api/admin/customers/:id', (req, res) => {
  const id = req.params.id

  const query = 'DELETE FROM checkin_iclc_2026 WHERE id = ?'

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting customer:', err)
      return res.status(500).json({ success: false, message: 'Database error' })
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Customer not found' })
    }

    console.log('Customer deleted successfully:', id)
    res.json({
      success: true,
      message: 'Customer deleted successfully',
    })
  })
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`)
})
