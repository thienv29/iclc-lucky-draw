require('dotenv').config()

const express = require('express')
const path = require('path')
const mysql = require('mysql2')
const XLSX = require('xlsx')

const app = express()
const PORT = process.env.PORT || 3111

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

    // Update note if provided
    if (note && note.trim()) {
      const updateQuery = 'UPDATE checkin_iclc_2026 SET note = ? WHERE id = ?'

      db.query(updateQuery, [note, customerId], (err, updateResult) => {
        if (err) {
          console.error('Error updating note:', err)
          return res.status(500).json({ success: false, message: 'Database error' })
        }

        console.log('Check-in successful for customer:', customerResults[0].name, '- Note updated')
        res.json({
          success: true,
          message: 'Check-in successful!',
          luckyNumber: customerId
        })
      })
    } else {
      console.log('Check-in successful for customer:', customerResults[0].name)
      res.json({
        success: true,
        message: 'Check-in successful!',
        luckyNumber: customerId
      })
    }
  })
})

// API endpoint to get check-in data
app.get('/api/checkins', (req, res) => {
  const query = 'SELECT id, name, department, note, created_at FROM checkin_iclc_2026 ORDER BY id ASC'

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
  const query = 'SELECT id, name, department FROM checkin_iclc_2026 ORDER BY name ASC'

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
  const query = 'SELECT id, name, department, note, created_at FROM checkin_iclc_2026 ORDER BY id ASC'

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
      'Check-in Time': new Date(item.created_at).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`)
})
// Create HTTP server

