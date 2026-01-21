const mongoose = require('mongoose');

const memberTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    durationInMonths: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String
    },
    letter: {
        type: String,
        required: true,
        uppercase: true,
        length: 1
    }
}, { timestamps: true });

module.exports = mongoose.model('MemberType', memberTypeSchema);
