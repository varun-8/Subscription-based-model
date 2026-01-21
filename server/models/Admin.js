const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    actionPassword: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        default: 'Administrator'
    }
}, { timestamps: true });

// Hash password before saving
adminSchema.pre('save', async function () {
    try {
        const salt = await bcrypt.genSalt(10);
        if (this.isModified('password') && this.password) {
            this.password = await bcrypt.hash(this.password, salt);
        }
        if (this.isModified('actionPassword') && this.actionPassword) {
            this.actionPassword = await bcrypt.hash(this.actionPassword, salt);
        }
    } catch (err) {
        throw err;
    }
});

// Method to compare password
adminSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to compare action password
adminSchema.methods.compareActionPassword = async function (candidatePassword) {
    if (!this.actionPassword) return false;
    return await bcrypt.compare(candidatePassword, this.actionPassword);
};

module.exports = mongoose.model('Admin', adminSchema);