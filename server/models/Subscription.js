const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    magazineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Magazine' }, // Made optional if moving away, but keeping ref
    memberTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'MemberType' },
    subscriptionId: { type: String, unique: true, sparse: true },
    status: { type: String, enum: ['Active', 'Expired', 'Paused', 'Terminated', 'Pending'], default: 'Active' }, // Added Terminated
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    paymentStatus: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
    referenceNo: { type: String, default: '' }, // Added Reference No
    tempReceiptNo: { type: String, default: '' }, // Added Temporary Receipt No
    paymentMethod: { type: String, default: '' } // Added Payment Method
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
