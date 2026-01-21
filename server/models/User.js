const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    password: {
        type: String,
        required: false
    },

    role: {
        type: String,
        enum: ['admin', 'customer'],
        default: 'customer'
    },
    name: {
        type: String,
        required: true
    },
    address: {
        street: { type: String, default: '' },
        addressLine2: { type: String, default: '' },
        taluk: { type: String, default: '' },
        district: { type: String, default: '' },
        state: { type: String, default: '' },
        country: { type: String, default: 'India' },
        pincode: { type: String, default: '' }
    },
    mobile: { type: String, default: '' },
    whatsapp: { type: String, default: '' },

    customerType: {
        type: String,
        enum: ['Subscription', 'Advertisement', 'Kovil', 'Nagarathaar Sangam'],
        default: 'Subscription'
    },
    dispatchType: {
        type: String,
        enum: ['Courier', 'Post'],
        default: 'Post'
    },
    subscriberNo: { type: String, unique: true, sparse: true },
    actionPassword: { type: String, required: false },
    adType: { type: String, default: '' } // Optional: Store preferred ad type for advertisement customers
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
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
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to compare action password
userSchema.methods.compareActionPassword = async function (candidatePassword) {
    if (!this.actionPassword) return false;
    return await bcrypt.compare(candidatePassword, this.actionPassword);
};

module.exports = mongoose.model('User', userSchema);
