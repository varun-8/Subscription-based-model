const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    clientName: {
        type: String,
        required: true
    },
    product: {
        type: String,
        required: true, // e.g., 'Magproj'
        default: 'Magproj'
    },
    type: {
        type: String,
        enum: ['Lifetime', 'Yearly', 'Trial'],
        required: true
    },
    expiryDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['Active', 'Revoked', 'Suspended', 'Unused', 'Expired'],
        default: 'Unused'
    },
    isPaused: {
        type: Boolean,
        default: false
    },
    batchId: {
        type: String, // UUID to group multiple keys
        default: null
    },
    hardwareId: {
        type: String,
        default: null
    },
    lastCheckIn: {
        type: Date
    },
    activationDate: {
        type: Date
    },
    notes: String
}, { timestamps: true });

module.exports = mongoose.model('License', licenseSchema);
