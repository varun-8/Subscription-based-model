require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts if needed, or refine
            imgSrc: ["'self'", "data:", "blob:"], // Allow images
            connectSrc: ["'self'"]
        }
    }
}));
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());


// MongoDB Connection
// Check for required environment variables
if (!process.env.MONGODB_URI) {
    // console.error('ERROR: MONGODB_URI is not set in environment variables');
    // console.error('Please create a .env file in the server directory with MONGODB_URI');
    process.exit(1);
}

if (!process.env.JWT_SECRET) {
    // console.error('ERROR: JWT_SECRET is not set in environment variables');
    // console.error('Please create a .env file in the server directory with JWT_SECRET');
    process.exit(1);
}

const initAdmin = require('./utils/initAdmin');

mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000 // Fail after 5 seconds if unable to connect
})
    .then(async () => {
        // console.log('Connected to MongoDB')
        await initAdmin();
    })
    .catch(err => {
        // console.error('MongoDB connection error:', err);
        // console.error('Please check your MONGODB_URI in the .env file');
    });

mongoose.connection.on('error', err => {
    // console.error('MongoDB runtime error:', err);
});

// Routes

const customerRoutes = require('./routes/customer');
const adminRoutes = require('./routes/admin');

const path = require('path');
const fs = require('fs');

app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/admin', adminRoutes);

// Serve static assets in production
const clientDistPath = path.join(__dirname, '../client/dist');

if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get(/.*/, (req, res) => {
        res.sendFile(path.join(clientDistPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('Magazine ERP API is running');
    });
}

// Start Server
app.listen(PORT, () => {
    // console.log(`Server running on port ${PORT}`);
});
