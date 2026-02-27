require('dotenv').config();
console.log('Dotenv loaded');

try {
    const mongoose = require('mongoose');
    console.log('Mongoose loaded');
    const bcrypt = require('bcryptjs');
    console.log('Bcrypt loaded');
    const User = require('./models/User');
    console.log('User model loaded');

    mongoose.connect(process.env.MONGODB_URI)
        .then(() => {
            console.log('Connected to DB');
            const user = new User({ username: 'admin', password: 'password123' });
            console.log('User instance created');
            // Try simple save without delete first, just to see if it works (might duplicate key error but that confirms DB access)
            user.save()
                .then(() => {
                    console.log('User saved');
                    process.exit(0);
                })
                .catch(err => {
                    console.error('Save Error:', err.message);
                    process.exit(1);
                });
        })
        .catch(err => {
            console.error('Connect Error:', err.message);
            process.exit(1);
        });

} catch (e) {
    console.error('Import Error:', e.message);
}
