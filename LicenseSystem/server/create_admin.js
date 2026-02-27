require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        await User.deleteOne({ username: 'admin' });
        console.log('Deleted existing admin user (if any)');

        const user = new User({ username: 'admin', password: 'password123' });
        await user.save();
        console.log('Admin user created successfully');

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

resetAdmin();
