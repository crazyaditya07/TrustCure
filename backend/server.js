require('dotenv').config({ path: '../.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const eventListenerService = require('./services/eventListener');
const TransferWorker = require('./services/transferWorker');

const app = express();
const server = http.createServer(app);
const allowedOrigins = [process.env.FRONTEND_URL || "http://localhost:5173", "http://localhost:5174"];

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST"]
}));
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tracex_db';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err);
    });

// Make io accessible to routes
app.set('io', io);

// API Routes
app.use('/api/auth', authRoutes); // Auth routes for email/password login
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Join room based on wallet address
    socket.on('join', (walletAddress) => {
        if (walletAddress) {
            socket.join(walletAddress.toLowerCase());
            console.log(`📍 ${socket.id} joined room: ${walletAddress}`);
        }
    });

    // Subscribe to product updates
    socket.on('subscribeProduct', (productId) => {
        if (productId) {
            socket.join(`product:${productId}`);
            console.log(`📍 ${socket.id} subscribed to product: ${productId}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

// Export io for use in other modules
module.exports.io = io;

// Start blockchain event listener
eventListenerService.startListening(io);

// Start transfer worker
const transferWorker = new TransferWorker(io);
transferWorker.start();

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
});
