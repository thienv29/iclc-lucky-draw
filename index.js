const express = require('express');
const path = require('path');

const app = express();
const PORT = 3111;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the client HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

// Serve the remote HTML file
app.get('/remote', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/remote.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
// Create HTTP server
