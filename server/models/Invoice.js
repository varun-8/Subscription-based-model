const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Made optional for Sales Entries
    customerName: { type: String }, // Added for non-registered customers
    category: { type: String, default: 'Subscription' }, // Subscription, Sales Entry, Advertisement
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
    advertisementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Advertisement' }, // Link to advertisement
    invoiceNumber: { type: String, unique: true },
    billingStart: Date,
    billingEnd: Date,
    items: [{
        description: String,
        amount: Number
    }],
    amount: { type: Number, required: true },
    status: { type: String, enum: ['Paid', 'Unpaid', 'Overdue'], default: 'Unpaid' },
    paymentMethod: { type: String, enum: ['Cash', 'GPay', 'Account Transfer', 'Credit Transaction', 'Money Order', 'Account Transfer - Cash', 'Account Transfer - Cheque', 'Account Transfer - DD', 'Account Transfer - NEFT', 'Account Transfer - GPay - N Palaniappan'], default: null },
    dateIssued: { type: Date, default: Date.now },
    paymentDate: Date,
    referenceNo: { type: String, default: '' },
    tempReceiptNo: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
