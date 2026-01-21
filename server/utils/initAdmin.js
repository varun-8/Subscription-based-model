const Admin = require('../models/Admin');

const initAdmin = async () => {
    try {
        const targetUsername = 'AACHI';
        const targetPassword = 'AACHI';
        const actionPassword = process.env.ADMIN_ACTION_PASSWORD || 'Aachi2026';

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ username: targetUsername });

        if (existingAdmin) {
            console.log('Admin user already exists.');
            return;
        }

        // Check if admin table is empty
        const adminCount = await Admin.countDocuments();
        if (adminCount > 0) {
            console.log('Admin table is not empty. Skipping admin creation.');
            return;
        }

        console.log(`Creating new admin "${targetUsername}"...`);
        const admin = new Admin({
            name: 'Aachi Admin',
            username: targetUsername,
            password: targetPassword,
            actionPassword: actionPassword
        });

        await admin.save();
        console.log('New admin created successfully.');

        console.log('---------------------------------------------------');
        console.log('Admin Login Credentials:');
        console.log('Username: ' + targetUsername);
        console.log('Password: ' + targetPassword);
        console.log('Action Password: ' + actionPassword);
        console.log('---------------------------------------------------');

    } catch (error) {
        console.error('Error creating admin:', error);
    }
};

module.exports = initAdmin;
