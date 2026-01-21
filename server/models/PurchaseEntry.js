const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    qty: { type: Number, required: true, default: 0 },
    rate: { type: Number, required: true, default: 0 },
    amount: { type: Number, required: true, default: 0 }
});

const purchaseEntrySchema = new mongoose.Schema({
    entryNo: { type: String },
    billNo: { type: String, required: true },
    date: { type: Date, default: Date.now },
    billDate: { type: Date },
    enteredBy: { type: String },
    supplier: { type: String },
    purchaseCategory: { type: String },
    modeOfPayment: { type: String },
    remarks: { type: String },
    items: [purchaseItemSchema],
    billAmount: { type: Number, required: true, default: 0 } // Total Amount
}, { timestamps: true });

module.exports = mongoose.model('PurchaseEntry', purchaseEntrySchema);
