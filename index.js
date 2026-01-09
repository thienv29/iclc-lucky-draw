require('dotenv').config()

const express = require('express')
const path = require('path')
const mysql = require('mysql2')

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
  const { name, department, note } = req.body

  const query = 'INSERT INTO checkin_iclc_2026 (name, department, note, created_at) VALUES (N?, N?, N?, CONVERT_TZ(NOW(), \'UTC\', \'Asia/Ho_Chi_Minh\'))'

  db.query(query, [name, department, note], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err)
      return res.status(500).json({ success: false, message: 'Database error' })
    }

    console.log('Data inserted successfully:', result)
    res.json({
      success: true,
      message: 'Check-in successful!',
      luckyNumber: result.insertId
    })
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`)
})
// Create HTTP server
