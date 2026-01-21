const mongoose = require('mongoose');

const courierEntrySchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, required: true },
    subscriberNo: { type: String },
    qty: { type: Number, required: true, default: 1 },
    edition: { type: String, required: true }, // Jan, Feb...

    mobile: { type: String },
    address: { type: String },
    remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CourierEntry', courierEntrySchema);
