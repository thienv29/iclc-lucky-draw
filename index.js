require('dotenv').config()

const express = require('express')
const path = require('path')
const mysql = require('mysql2')
const XLSX = require('xlsx')
const multer = require('multer')

const app = express()
const PORT = process.env.PORT || 3111

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is Excel
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only Excel files are allowed'))
    }
  }
})

// MySQL connection - Load from environment variables
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
})

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err)
    return
  }
  console.log('Connected to MySQL database')
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
  const token = req.headers.authorization?.replace('Bearer ', '') ||
                req.query.token ||
                req.body.token

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' })
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
      token: token
    })
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid password'
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
  const getCustomerQuery = 'SELECT name, department FROM checkin_iclc_2026 WHERE id = ?'

  db.query(getCustomerQuery, [customerId], (err, customerResults) => {
    if (err) {
      console.error('Error fetching customer:', err)
      return res.status(500).json({ success: false, message: 'Database error' })
    }

    if (customerResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' })
    }

    // Update checked status, note if provided, and checkin_at timestamp
    let updateQuery
    let updateParams

    if (note && note.trim()) {
      updateQuery = 'UPDATE checkin_iclc_2026 SET checked = 1, note = ?, checkin_at = CONVERT_TZ(NOW(), \'UTC\', \'Asia/Ho_Chi_Minh\') WHERE id = ?'
      updateParams = [note, customerId]
    } else {
      updateQuery = 'UPDATE checkin_iclc_2026 SET checked = 1, checkin_at = CONVERT_TZ(NOW(), \'UTC\', \'Asia/Ho_Chi_Minh\') WHERE id = ?'
      updateParams = [customerId]
    }

    db.query(updateQuery, updateParams, (err, updateResult) => {
      if (err) {
        console.error('Error updating customer:', err)
        return res.status(500).json({ success: false, message: 'Database error' })
      }

      console.log('Check-in successful for customer:', customerResults[0].name, note && note.trim() ? '- Note updated' : '')
      res.json({
        success: true,
        message: 'Check-in successful!',
        luckyNumber: customerId
      })
    })
  })
})

// API endpoint to get check-in data
app.get('/api/checkins', (req, res) => {
  const query = 'SELECT id, name, department, note, checkin_at FROM checkin_iclc_2026 ORDER BY id ASC'

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
  const query = 'SELECT id, name, department FROM checkin_iclc_2026 WHERE checked = 0 ORDER BY name ASC'

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching customers:', err)
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

// API endpoint to export check-in data to Excel
app.get('/api/export-checkins', (req, res) => {
  const query = 'SELECT id, name, department, note, checkin_at FROM checkin_iclc_2026 ORDER BY id ASC'

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching data for export:', err)
      return res.status(500).json({ success: false, message: 'Database error' })
    }

    // Prepare data for Excel
    const excelData = results.map(item => ({
      'Lucky Number': item.id,
      'Name': item.name,
      'Department': item.department,
      'Note': item.note || '',
      'Check-in Time': item.checkin_at ? new Date(item.checkin_at).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) : ''
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
      { wch: 20 }  // Check-in Time
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Check-in List')

    // Generate filename with current date
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0] // YYYY-MM-DD format
    const filename = `checkin_list_${dateStr}.xlsx`

    // Send file as response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`)

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    res.send(buffer)
  })
})

// Import customers from Excel (needs to be before auth middleware for multipart handling)
app.post('/api/admin/import-customers', upload.single('excelFile'), (req, res) => {
  // Manual auth check for multipart request
  const token = req.headers.authorization?.replace('Bearer ', '') ||
                req.query.token ||
                req.body.token

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' })
  }

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  const expectedToken = Buffer.from(adminPassword + 'salt').toString('base64')

  if (token !== expectedToken) {
    return res.status(401).json({ success: false, message: 'Invalid token' })
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' })
  }

  try {
    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert to JSON, skip first row (headers)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    // Remove header row
    jsonData.shift()

    if (jsonData.length === 0) {
      return res.status(400).json({ success: false, message: 'No data found in Excel file' })
    }

    // Process data
    const customers = []
    const errors = []
    const processedIds = new Set()

    jsonData.forEach((row, index) => {
      const rowNum = index + 2 // +2 because we removed header and arrays are 0-indexed
      const [luckyNumber, name, department] = row

      // Validate required fields
      if (!luckyNumber || !name) {
        errors.push(`Row ${rowNum}: Missing lucky_number or name`)
        return
      }

      // Check for duplicate lucky numbers in the file
      if (processedIds.has(luckyNumber)) {
        errors.push(`Row ${rowNum}: Duplicate lucky_number ${luckyNumber}`)
        return
      }

      processedIds.add(luckyNumber)

      customers.push({
        id: parseInt(luckyNumber),
        name: String(name).trim(),
        department: department ? String(department).trim() : null
      })
    })

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Import failed due to validation errors: ${errors.join('; ')}`
      })
    }

    if (customers.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid customers to import' })
    }

    // Check for existing IDs and prepare insert/update queries
    const existingIds = []
    const newCustomers = []

    // Check which IDs already exist
    const checkPromises = customers.map(customer => {
      return new Promise((resolve) => {
        db.query('SELECT id FROM checkin_iclc_2026 WHERE id = ?', [customer.id], (err, results) => {
          if (err) {
            console.error('Error checking existing ID:', err)
            resolve(null)
          } else {
            resolve(results.length > 0 ? customer.id : null)
          }
        })
      })
    })

    Promise.all(checkPromises).then(results => {
      existingIds.push(...results.filter(id => id !== null))
      newCustomers.push(...customers.filter(customer => !existingIds.includes(customer.id)))

      // Insert new customers
      if (newCustomers.length > 0) {
        const insertPromises = newCustomers.map(customer => {
          return new Promise((resolve, reject) => {
            const query = 'INSERT INTO checkin_iclc_2026 (id, name, department, checked, created_at) VALUES (?, ?, ?, 0, CONVERT_TZ(NOW(), \'UTC\', \'Asia/Ho_Chi_Minh\'))'
            db.query(query, [customer.id, customer.name, customer.department], (err, result) => {
              if (err) {
                console.error('Error inserting customer:', err)
                reject(err)
              } else {
                resolve(result)
              }
            })
          })
        })

        Promise.all(insertPromises)
          .then(() => {
            const message = `Import completed! ${newCustomers.length} customers imported. ${existingIds.length > 0 ? `${existingIds.length} customers already existed and were skipped.` : ''}`
            res.json({
              success: true,
              message: message,
              imported: newCustomers.length,
              skipped: existingIds.length
            })
          })
          .catch(error => {
            console.error('Import error:', error)
            res.status(500).json({ success: false, message: 'Import failed during database insertion' })
          })
      } else {
        res.json({
          success: true,
          message: `All ${customers.length} customers already exist in the database.`,
          imported: 0,
          skipped: customers.length
        })
      }
    }).catch(error => {
      console.error('Error checking existing IDs:', error)
      res.status(500).json({ success: false, message: 'Import failed during validation' })
    })

  } catch (error) {
    console.error('Excel parsing error:', error)
    res.status(400).json({ success: false, message: 'Invalid Excel file format' })
  }
})

// Admin API endpoints (protected)
app.use('/api/admin', requireAdminAuth)

// Get all customers for admin (including checked status)
app.get('/api/admin/customers', (req, res) => {
  const query = 'SELECT id, name, department, note, checked, checkin_at FROM checkin_iclc_2026 ORDER BY id ASC'

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

  const query = 'INSERT INTO checkin_iclc_2026 (name, department, note, checked, created_at) VALUES (?, ?, ?, ?, CONVERT_TZ(NOW(), \'UTC\', \'Asia/Ho_Chi_Minh\'))'

  db.query(query, [name.trim(), department ? department.trim() : null, note ? note.trim() : null, checked || 0], (err, result) => {
    if (err) {
      console.error('Error adding customer:', err)
      return res.status(500).json({ success: false, message: 'Database error' })
    }

    console.log('Customer added successfully:', result.insertId)
    res.json({
      success: true,
      message: 'Customer added successfully',
      customerId: result.insertId
    })
  })
})

// Update customer
app.put('/api/admin/customers/:id', (req, res) => {
  const id = req.params.id
  const { name, department, note, checked } = req.body

  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Name is required' })
  }

  const query = 'UPDATE checkin_iclc_2026 SET name = ?, department = ?, note = ?, checked = ? WHERE id = ?'

  db.query(query, [name.trim(), department ? department.trim() : null, note ? note.trim() : null, checked || 0, id], (err, result) => {
    if (err) {
      console.error('Error updating customer:', err)
      return res.status(500).json({ success: false, message: 'Database error' })
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' })
    }

    console.log('Customer updated successfully:', id)
    res.json({
      success: true,
      message: 'Customer updated successfully'
    })
  })
})

// Reset customer check-in status
app.put('/api/admin/customers/:id/reset', (req, res) => {
  const id = req.params.id

  const query = 'UPDATE checkin_iclc_2026 SET checked = 0, checkin_at = NULL WHERE id = ?'

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error resetting customer:', err)
      return res.status(500).json({ success: false, message: 'Database error' })
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' })
    }

    console.log('Customer check-in reset successfully:', id)
    res.json({
      success: true,
      message: 'Customer check-in status reset successfully'
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
      return res.status(404).json({ success: false, message: 'Customer not found' })
    }

    console.log('Customer deleted successfully:', id)
    res.json({
      success: true,
      message: 'Customer deleted successfully'
    })
  })
})



// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`)
})

