const Admin = require('../models/Admin');

const initAdmin = async () => {
    try {
        const adminCount = await Admin.countDocuments();
        if (adminCount > 0) {
            console.log(`Admin bootstrap check complete. ${adminCount} admin account(s) found.`);
            return true;
        }

        console.log('No admin account found. Waiting for manual initialization from the login screen.');
        return false;

    } catch (error) {
        console.error('Error checking admin bootstrap state:', error);
        return false;
    }
};

module.exports = initAdmin;
