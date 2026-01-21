const mongoose = require('mongoose');

const magazineSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    price: Number,
    category: String,
    periodicity: { type: String, enum: ['Weekly', 'Monthly', 'Quarterly', 'Yearly'] },
    coverImage: String
}, { timestamps: true });

module.exports = mongoose.model('Magazine', magazineSchema);
