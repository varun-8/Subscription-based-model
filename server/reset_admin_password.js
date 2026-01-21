const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/';

mongoose.connect(uri)
    .then(async () => {
        console.log('Connected to MongoDB');
        try {
            // Find admin user
            const admin = await mongoose.connection.db.collection('users').findOne({ role: 'admin' });

            if (admin) {
                console.log(`Found admin user: ${admin.username}`);
                // Unset the actionPassword field
                const result = await mongoose.connection.db.collection('users').updateOne(
                    { _id: admin._id },
                    { $unset: { actionPassword: "" } }
                );

                console.log(`Modified count: ${result.modifiedCount}`);
                if (result.modifiedCount > 0) {
                    console.log('Successfully removed existing actionPassword from Database.');
                } else {
                    console.log('No actionPassword field found to remove (or strictly cleaner already).');
                }
            } else {
                console.log('No admin user found.');
            }
        } catch (err) {
            console.error('Error during update:', err);
        } finally {
            await mongoose.disconnect();
            console.log('Disconnected');
        }
    })
    .catch(err => {
        console.error('Connection error:', err);
    });
