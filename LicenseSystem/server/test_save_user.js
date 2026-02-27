require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected');
        try {
            const user = new User({ username: 'testuser', password: 'password123' });
            console.log('Attempting save...');
            await user.save();
            console.log('User saved successfully');
            process.exit(0);
        } catch (err) {
            console.error('SAVE FAILED:', err);
            console.error('Stack:', err.stack);
            process.exit(1);
        }
    })
    .catch(console.error);
