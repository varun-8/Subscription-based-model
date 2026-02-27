require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected');
        try {
            const users = await User.find({});
            console.log('Users found:', users.length);
            users.forEach(u => console.log(`- ${u.username} (${u.role})`));
            process.exit(0);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    })
    .catch(console.error);
