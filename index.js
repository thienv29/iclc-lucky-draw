const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3111;

// Middleware CORS (cho phép tất cả origin)
app.use(cors({
    origin: '*', // Cho phép tất cả origin
    methods: ['GET', 'POST'], // Phương thức được phép
    allowedHeaders: ['Content-Type', 'Authorization'], // Các header được phép
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO với CORS *
const io = new Server(server, {
    cors: {
        origin: '*', // Cho phép tất cả origin
        methods: ["GET", "POST"], // Các phương thức được phép
    }
});

// Socket.IO logic
io.on('connection', (socket) => {
    console.log('Client connected');

    // Listen for JSON messages from the client
    socket.on('message', (data) => {
        try {
            // Parse the received JSON message
            const message = JSON.parse(data);
            console.log('Received JSON:', message);

            // Respond to the sender with a JSON message
            const response = { status: 'success', received: message };
            socket.send(JSON.stringify(response));

            // Broadcast the JSON message to all connected clients
            io.emit('broadcast', {
                event: 'broadcast',
                message: message,
            });
        } catch (error) {
            console.error('Invalid JSON received:', data);
            socket.send(JSON.stringify({ status: 'error', error: 'Invalid JSON format' }));
        }
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Serve the client HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/remote', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/remote.html'));
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});