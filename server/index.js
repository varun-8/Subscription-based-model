const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const LocalLicense = require('./models/LocalLicense'); // Import new model

const app = express();
const PORT = Number(process.env.PORT || process.env.SERVER_PORT || 5055);
const effectiveMongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/magazine_erp';
const effectiveJwtSecret = process.env.JWT_SECRET || '9f3c6f8c97e4a2d1b5f0e9c7a4b2d8f61c0e7a9b3f4d2e8c6a5b9d1f7e0c4a2';
const effectiveAdminActionPassword = process.env.ADMIN_ACTION_PASSWORD || 'AACHI@123';
const DB_RETRY_DELAY_MS = 3000;

process.env.MONGODB_URI = effectiveMongoUri;
process.env.JWT_SECRET = effectiveJwtSecret;
process.env.ADMIN_ACTION_PASSWORD = effectiveAdminActionPassword;

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
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());

// --- New Endpoint: Sync License ---
app.post('/api/settings/license', async (req, res) => {
    try {
        const { key, clientName, plan, expiryDate, status, hardwareId } = req.body;

        // Upsert: Update if exists, otherwise create
        const license = await LocalLicense.findOneAndUpdate(
            { key }, // Filter by key
            {
                key,
                clientName,
                plan,
                expiryDate,
                status,
                hardwareId,
                lastSynced: new Date()
            },
            { new: true, upsert: true } // Options
        );

        console.log(`[Sync] License verified and synced locally: ${key} (${clientName})`);
        res.json({ success: true, license });
    } catch (err) {
        console.error("Failed to sync license locally:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});


const initAdmin = require('./utils/initAdmin');
let isDbConnectInProgress = false;
let dbRetryTimer = null;
let hasInitializedAdmin = false;

console.log(`[Database] Attempting to connect to: ${process.env.MONGODB_URI?.split('@').pop()}`);

function scheduleReconnect() {
    if (dbRetryTimer) {
        return;
    }

    dbRetryTimer = setTimeout(() => {
        dbRetryTimer = null;
        connectToMongoDB();
    }, DB_RETRY_DELAY_MS);
}

async function connectToMongoDB() {
    if (isDbConnectInProgress || mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
        return;
    }

    isDbConnectInProgress = true;

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });

        console.log('Connected to MongoDB');

        if (!hasInitializedAdmin) {
            hasInitializedAdmin = true;
            await initAdmin();
        }
    } catch (err) {
        console.error('MongoDB connection error:', err.message || err);
        console.error(`Retrying database connection in ${DB_RETRY_DELAY_MS / 1000} seconds...`);
        scheduleReconnect();
    } finally {
        isDbConnectInProgress = false;
    }
}

connectToMongoDB();

mongoose.connection.on('error', err => {
    console.error('MongoDB runtime error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Retrying connection...');
    scheduleReconnect();
});

// Routes

const customerRoutes = require('./routes/customer');
const adminRoutes = require('./routes/admin');

const fs = require('fs');

// Database Connection Check Middleware
app.use('/api', (req, res, next) => {
    if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
        return res.status(503).json({
            success: false,
            message: "Database connection failed! Please ensure MongoDB is running locally on port 27017."
        });
    }
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/admin', adminRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' :
        mongoose.connection.readyState === 2 ? 'Connecting' :
            mongoose.connection.readyState === 3 ? 'Disconnecting' : 'Disconnected';

    res.json({
        status: 'UP',
        database: dbStatus,
        timestamp: new Date()
    });
});

// Serve static assets in production
const clientDistPath = path.join(__dirname, '../client/dist');
const clientAssetsPath = path.join(clientDistPath, 'assets');

if (fs.existsSync(clientDistPath)) {
    if (fs.existsSync(clientAssetsPath)) {
        app.use('/assets', express.static(clientAssetsPath, {
            immutable: true,
            maxAge: '1y',
            etag: true,
            lastModified: true
        }));
    }

    app.use(express.static(clientDistPath, {
        index: false,
        etag: true,
        lastModified: true,
        maxAge: 0,
        setHeaders: (res, filePath) => {
            if (filePath.endsWith('index.html')) {
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
            }
        }
    }));

    app.get(/.*/, (req, res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.sendFile(path.join(clientDistPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('Magazine ERP API is running');
    });
}

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
