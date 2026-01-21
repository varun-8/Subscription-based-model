const router = require('express').Router();
const Magazine = require('../models/Magazine');
const Subscription = require('../models/Subscription');
const { verifyToken } = require('../middleware/auth');

// Get all magazines
router.get('/magazines', verifyToken, async (req, res) => {
    try {
        const magazines = await Magazine.find();
        res.json(magazines);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get my subscriptions
router.get('/subscriptions', verifyToken, async (req, res) => {
    try {
        const subs = await Subscription.find({ userId: req.user._id }).populate('magazineId');
        res.json(subs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Subscribe to a magazine
router.post('/subscribe', verifyToken, async (req, res) => {
    try {
        const { magazineId } = req.body;
        const existing = await Subscription.findOne({
            userId: req.user._id,
            magazineId,
            status: 'Active'
        });
        if (existing) return res.status(400).json({ message: 'Already subscribed' });

        const subscription = new Subscription({
            userId: req.user._id,
            magazineId,
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
        });
        await subscription.save();
        res.json(subscription);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
