const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
    clientName: { type: String, required: true },
    adName: { type: String, default: 'Advertisement' },
    types: [{ type: String }],
    price: { type: Number, default: 0 },
    startDate: Date,
    endDate: Date,
    status: { type: String, default: 'Active' },
    paymentMethod: { type: String },
    paymentDate: Date,
    referenceNo: { type: String },
    tempReceiptNo: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pageSize: { type: String },
    qty: { type: Number, default: 1 },
    content: String
}, { timestamps: true });

module.exports = mongoose.model('Advertisement', adSchema);
