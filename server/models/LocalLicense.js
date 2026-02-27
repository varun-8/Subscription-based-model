const mongoose = require('mongoose');

const LocalLicenseSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    clientName: {
        type: String,
        required: true
    },
    plan: {
        type: String, // e.g. 'Yearly', 'Lifetime'
        default: 'Trial'
    },
    expiryDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['Active', 'Expired', 'Revoked'],
        default: 'Active'
    },
    hardwareId: {
        type: String
    },
    lastSynced: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('LocalLicense', LocalLicenseSchema);
