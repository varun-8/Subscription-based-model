const router = require('express').Router();
const User = require('../models/User');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth');

// Register (Admin only or initial setup)
router.post('/register', async (req, res) => {
    try {
        const { name, username, password, role } = req.body;
        const newUser = new User({ name, username, password, role });
        const savedUser = await newUser.save();
        res.json({
            _id: savedUser._id,
            name: savedUser.name,
            username: savedUser.username,
            role: savedUser.role
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'Server configuration error. Please contact administrator.' });
        }

        // First try to find admin
        let admin = await Admin.findOne({ username: username.trim() });
        let user = null;

        if (admin) {
            // Admin login
            const validPass = await admin.comparePassword(password);
            if (!validPass) return res.status(400).json({ message: 'Invalid username or password' });

            const token = jwt.sign({ _id: admin._id, role: 'admin', isAdmin: true }, process.env.JWT_SECRET, { expiresIn: '1d' });

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000 // 1 day
            });

            return res.json({ role: 'admin', name: admin.name });
        } else {
            // Check if customer
            user = await User.findOne({ username: username.trim() });
            if (user && user.role === 'customer') {
                const validPass = await user.comparePassword(password);
                if (!validPass) return res.status(400).json({ message: 'Invalid username or password' });

                const token = jwt.sign({ _id: user._id, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: '1d' });

                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 24 * 60 * 60 * 1000 // 1 day
                });

                return res.json({ role: 'customer', name: user.name });
            }
        }

        return res.status(400).json({ message: 'Invalid username or password' });
    } catch (err) {
        res.status(500).json({ message: err.message || 'An error occurred during login' });
    }
});

// Create Admin (only when admin table is empty)
router.post('/create-admin', async (req, res) => {
    try {
        const { username, password, providedActionPassword } = req.body;
        const normalizedUsername = typeof username === 'string' ? username.trim() : '';

        // Verify ADMIN_ACTION_PASSWORD
        const requiredActionPassword = process.env.ADMIN_ACTION_PASSWORD;
        if (!requiredActionPassword || providedActionPassword !== requiredActionPassword) {
            return res.status(403).json({ message: 'Invalid admin action password' });
        }

        if (!normalizedUsername || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        if (password.length < 4) {
            return res.status(400).json({ message: 'Password must be at least 4 characters long' });
        }

        // Check if admin table is empty
        const adminCount = await Admin.countDocuments();
        if (adminCount > 0) {
            return res.status(400).json({ message: 'Admin already exists. Cannot create additional admin accounts.' });
        }

        // Create admin
        const admin = new Admin({
            name: 'Administrator',
            username: normalizedUsername,
            password: password,
            actionPassword: requiredActionPassword
        });

        await admin.save();

        res.json({ message: 'Admin account created successfully' });
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).json({ message: 'Username already exists' });
        } else {
            res.status(500).json({ message: err.message });
        }
    }
});

// Check if admin table is empty (for UI display)
router.get('/admin-status', async (req, res) => {
    try {
        const adminCount = await Admin.countDocuments();
        res.json({ hasAdmin: adminCount > 0 });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
});

// Get Current User (for session check)
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
