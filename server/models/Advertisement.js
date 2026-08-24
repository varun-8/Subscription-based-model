const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
    clientName: { type: String, required: true },
    adName: { type: String, default: 'Advertisement' },
    types: [{ type: String }],
    typeAmounts: [{
        name: String,
        amount: Number
    }],
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
    content: String,
    creditType: { type: String, enum: ['Full Credit', 'Part Payment'], default: 'Full Credit' },
    amountPaidNow: { type: Number, default: 0 },
    partPaymentDate: Date,
    tdsAmount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Advertisement', adSchema);
