const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    category: { type: String },
    quantity: { type: Number, default: 0 },
    unitPrice: { type: Number, default: 0 },
    supplier: { type: String },
    description: String,
    lastRestocked: Date
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
