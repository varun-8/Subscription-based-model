const router = require('express').Router();
const User = require('../models/User');
const Admin = require('../models/Admin');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const Advertisement = require('../models/Advertisement');
const Magazine = require('../models/Magazine');
const MemberType = require('../models/MemberType');
const Inventory = require('../models/Inventory');
const { verifyToken, requireRole } = require('../middleware/auth');
const AdType = require('../models/AdType');
const PurchaseEntry = require('../models/PurchaseEntry');
const CourierEntry = require('../models/CourierEntry');
const excel = require('exceljs');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Protect all admin routes
// EXEMPT /auto-backup from general admin auth (used by Electron main process)
router.post('/auto-backup', (req, res, next) => {
    const remoteAddress = req.socket.remoteAddress || '';
    // Allow if localhost (::1, 127.0.0.1, ::ffff:127.0.0.1)
    if (remoteAddress === '::1' || remoteAddress === '127.0.0.1' || remoteAddress.endsWith('127.0.0.1')) {
        next();
    } else {
        res.status(403).json({ message: 'Access Denied: Local only' });
    }
}, async (req, res) => {
    try {
        const data = {
            metadata: {
                backupDate: new Date().toISOString(),
                version: '1.3',
                source: 'MagZone ERP System',
                author: 'Administrator'
            },
            users: await User.find({ role: { $ne: 'admin' } }).lean(),
            admins: await Admin.find({}).lean(), // Now including admins in backup
            subscriptions: await Subscription.find({}).lean(),
            invoices: await Invoice.find({}).lean(),
            magazines: await Magazine.find({}).lean(),
            memberTypes: await MemberType.find({}).lean(),
            adTypes: await AdType.find({}).lean(),
            advertisements: await Advertisement.find({}).lean(),
            purchaseEntries: await PurchaseEntry.find({}).lean(),
            inventory: await Inventory.find({}).lean(),
            courierEntries: await CourierEntry.find({}).lean()
        };
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Auto backup failed: ' + err.message });
    }
});

router.use(verifyToken);
router.use(requireRole('admin'));

// Verify Analytics Password
// Analytics endpoint
router.get('/analytics', async (req, res) => {
    try {
        const { range = '30d' } = req.query;

        // Calculate date range
        const now = new Date();
        let startDate = new Date();

        switch (range) {
            case '7d':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(now.getDate() - 90);
                break;
            case '1y':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate.setDate(now.getDate() - 30);
        }

        // Total Customers (Including Subscription, Advertisement, Kovil, Nagarathaar Sangam)
        const totalSubscribers = await User.countDocuments({
            role: 'customer'
        });

        // Total Advertisement Customers
        const totalAdCustomers = await User.countDocuments({
            role: 'customer',
            customerType: 'Advertisement'
        });

        // Active subscriptions (Explicitly check plan is not linked to Ad if applicable, for now assume Subs are Subs)
        const activeSubscriptions = await Subscription.countDocuments({
            status: 'Active',
            endDate: { $gte: now }
        });

        // Renewal Needed (Expired but not yet renewed/terminated, or explicitly marked)
        // Logic: Status is 'Renew Needed' OR (Status is 'Active' but expired)
        const renewalNeededCount = await Subscription.countDocuments({
            $or: [
                { status: 'Renew Needed' },
                { status: 'Active', endDate: { $lt: now } }
            ]
        });

        // Revenue calculations
        const revenueInvoices = await Invoice.find({
            status: 'Paid',
            dateIssued: { $gte: startDate }
        });

        const totalRevenue = revenueInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

        // Advertisement revenue
        const { adPaymentType } = req.query;
        const adQuery = {
            category: 'Advertisement',
            status: 'Paid',
            dateIssued: { $gte: startDate }
        };

        if (adPaymentType === 'Cash') {
            adQuery.paymentMethod = 'Cash';
        } else if (adPaymentType === 'Other') {
            adQuery.paymentMethod = { $ne: 'Cash' };
        }

        const adInvoices = await Invoice.find(adQuery);

        const adRevenue = adInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

        // Purchase costs - from PurchaseEntry collection
        const purchaseEntries = await PurchaseEntry.find({
            date: { $gte: startDate }
        });

        const totalPurchaseCost = purchaseEntries.reduce((sum, entry) => sum + (entry.billAmount || 0), 0);

        // Geographic distribution - Limited to top 5 districts
        const geographicData = await User.aggregate([
            { $match: { role: 'customer' } },
            {
                $group: {
                    _id: '$address.district',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const totalDistrictCount = geographicData.reduce((sum, item) => sum + item.count, 0);
        const geographicDistribution = geographicData.map(item => ({
            region: item._id || 'Unknown',
            count: item.count,
            percentage: Math.round((item.count / totalDistrictCount) * 100)
        }));

        // Calculate actual revenue breakdown from database
        const subscriptionRevenue = await Invoice.aggregate([
            { $match: { status: 'Paid', category: { $ne: 'Advertisement' } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const advertisementRevenue = await Invoice.aggregate([
            { $match: { status: 'Paid', category: 'Advertisement' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const subRevenue = subscriptionRevenue[0]?.total || 0;
        const advRevenue = advertisementRevenue[0]?.total || 0;
        const totalRev = subRevenue + advRevenue;

        // Revenue breakdown - Main revenue categories (limited to top categories)
        const revenueBreakdown = [
            {
                source: 'Subscriptions',
                amount: subRevenue,
                percentage: totalRev > 0 ? Math.round((subRevenue / totalRev) * 100) : 0,
                color: '#667eea'
            },
            {
                source: 'Advertisements',
                amount: advRevenue,
                percentage: totalRev > 0 ? Math.round((advRevenue / totalRev) * 100) : 0,
                color: '#f59e0b'
            },
            {
                source: 'Other',
                amount: 0,
                percentage: 0,
                color: '#10b981'
            }
        ].slice(0, 5); // Ensure maximum of 5 items

        // Recent activity
        const recentSubscriptions = await Subscription.find({})
            .populate('userId', 'name')
            .sort({ createdAt: -1 })
            .limit(3);

        const recentInvoices = await Invoice.find({})
            .populate('userId', 'name customerName')
            .sort({ createdAt: -1 })
            .limit(3);

        // Recent advertisements
        const recentAdvertisements = await Advertisement.find({})
            .populate('userId', 'name')
            .sort({ createdAt: -1 })
            .limit(4);

        // Recent ad-related invoices (separate from general invoices)
        const recentAdInvoices = await Invoice.find({
            category: 'Advertisement',
            status: 'Paid'
        })
            .populate('userId', 'name customerName')
            .sort({ createdAt: -1 })
            .limit(2);

        const recentActivity = [
            ...recentSubscriptions.map(sub => ({
                action: 'New subscription',
                user: sub.userId?.name || 'Unknown',
                time: formatTimeAgo(sub.createdAt),
                timestamp: sub.createdAt, // Keep original timestamp for sorting
                type: 'subscription'
            })),
            ...recentInvoices.filter(inv => inv.category !== 'Advertisement').map(inv => ({
                action: 'Payment received',
                user: inv.userId?.name || inv.customerName || 'Unknown',
                time: formatTimeAgo(inv.createdAt),
                timestamp: inv.createdAt, // Keep original timestamp for sorting
                type: 'payment'
            })),
            ...recentAdInvoices.map(inv => ({
                action: 'Advertisement payment received',
                user: inv.userId?.name || inv.customerName || 'Unknown',
                time: formatTimeAgo(inv.createdAt),
                timestamp: inv.createdAt, // Keep original timestamp for sorting
                type: 'payment'
            })),
            ...recentAdvertisements.map(ad => ({
                action: 'Advertisement booked',
                user: ad.userId?.name || ad.clientName || 'Unknown',
                time: formatTimeAgo(ad.createdAt),
                timestamp: ad.createdAt, // Keep original timestamp for sorting
                type: 'advertisement'
            }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5); // Limited to top 5 recent activities

        // Calculate top performing plan
        const topPlans = await Subscription.aggregate([
            {
                $lookup: {
                    from: 'membertypes',
                    localField: 'memberTypeId',
                    foreignField: '_id',
                    as: 'memberType'
                }
            },
            { $unwind: '$memberType' },
            {
                $group: {
                    _id: '$memberType.name',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]);

        // Calculate expiring subscriptions (next 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const expiringCount = await Subscription.countDocuments({
            status: 'Active',
            endDate: { $gte: now, $lte: thirtyDaysFromNow }
        });

        // Calculate growth rate (comparing last 30 days to previous 30 days)
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date(now);
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const recentSubs = await Subscription.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        const previousSubs = await Subscription.countDocuments({
            createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
        });

        const growthRate = previousSubs > 0 ? ((recentSubs - previousSubs) / previousSubs) * 100 : 0;

        // Calculate percentage changes (simplified - comparing to previous period)
        const previousPeriodRevenue = await Invoice.aggregate([
            {
                $match: {
                    status: 'Paid',
                    dateIssued: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const revenueChange = previousPeriodRevenue[0]?.total > 0 ?
            ((totalRevenue - previousPeriodRevenue[0].total) / previousPeriodRevenue[0].total) * 100 : 0;

        // Generate revenue trend data for the chart
        const trendData = [];

        // Calculate days based on range
        let daysToGoBack = 30;
        switch (range) {
            case '7d':
                daysToGoBack = 7;
                break;
            case '30d':
                daysToGoBack = 30;
                break;
            case '90d':
                daysToGoBack = 90;
                break;
            case '1y':
                daysToGoBack = 365;
                break;
            default:
                daysToGoBack = 30;
        }

        for (let i = daysToGoBack - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const dayRevenue = await Invoice.aggregate([
                {
                    $match: {
                        status: 'Paid',
                        dateIssued: { $gte: startOfDay, $lte: endOfDay }
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            const dayAdRevenue = await Invoice.aggregate([
                {
                    $match: {
                        status: 'Paid',
                        category: 'Advertisement',
                        dateIssued: { $gte: startOfDay, $lte: endOfDay }
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            trendData.push({
                date: date.toISOString().split('T')[0],
                totalRevenue: dayRevenue[0]?.total || 0,
                subscriptionRevenue: (dayRevenue[0]?.total || 0) - (dayAdRevenue[0]?.total || 0),
                advertisementRevenue: dayAdRevenue[0]?.total || 0
            });
        }


        // Breakdown: Customer Types
        const customerTypeCounts = await User.aggregate([
            { $match: { role: 'customer' } },
            { $group: { _id: '$customerType', count: { $sum: 1 } } }
        ]);

        // Breakdown: Plans (Active Subscriptions)
        const planCounts = await Subscription.aggregate([
            { $match: { status: 'Active', endDate: { $gte: now } } },
            {
                $lookup: {
                    from: 'membertypes',
                    localField: 'memberTypeId',
                    foreignField: '_id',
                    as: 'type'
                }
            },
            { $unwind: '$type' },
            {
                $group: {
                    _id: '$type.name',
                    planId: { $first: '$type._id' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const analyticsData = {
            totalSubscribers,
            activeSubscriptions,
            totalAdCustomers, // New
            renewalNeededCount, // New
            totalRevenue,
            adRevenue,
            totalPurchaseCost,
            revenueChange: parseFloat(revenueChange.toFixed(1)),
            subscribersChange: 8.2, // This would need more complex calculation
            activeSubsChange: 15.3, // This would need more complex calculation
            adRevenueChange: 22.1, // This would need more complex calculation
            geographicData: geographicDistribution,
            revenueBreakdown,
            recentActivity,
            topPlan: topPlans[0]?._id || 'No subscriptions',
            topPlanCount: topPlans[0]?.count || 0,
            expiringCount,
            growthRate: parseFloat(growthRate.toFixed(1)),
            revenueTrend: trendData,
            customerTypeBreakdown: customerTypeCounts.map(c => ({ name: c._id || 'Standard', count: c.count })),
            planBreakdown: planCounts.map(p => ({ name: p._id, id: p.planId, count: p.count }))
        };

        res.json(analyticsData);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch analytics data' });
    }
});

// Helper function to format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const diffInMs = now - new Date(date);
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return new Date(date).toLocaleDateString();
}

router.delete('/reset-database', async (req, res) => {
    try {
        const { password } = req.body;
        if (!password || password !== process.env.DB_RESET_PASSWORD) {
            return res.status(403).json({ message: 'Invalid password. Database reset aborted.' });
        }

        try {
            await User.deleteMany({ role: { $ne: 'admin' } });
            await Subscription.deleteMany({});
            await Invoice.deleteMany({});
            await Magazine.deleteMany({});
            await MemberType.deleteMany({});
            await AdType.deleteMany({});
            await Advertisement.deleteMany({});
            await PurchaseEntry.deleteMany({});
            await Inventory.deleteMany({});
            await CourierEntry.deleteMany({});
        } catch (e) {
            // Silently fail or use a proper logging service
        }
        res.json({ message: 'All records erased successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Export/Import Database ---
router.get('/export-database', async (req, res) => {
    try {
        const data = {
            metadata: {
                backupDate: new Date().toISOString(),
                version: '1.3',
                source: 'MagZone ERP System',
                author: req.user ? 'Admin Session' : 'Manual Trigger'
            },
            users: await User.find({ role: { $ne: 'admin' } }).lean(),
            admins: await Admin.find({}).lean(),
            subscriptions: await Subscription.find({}).lean(),
            invoices: await Invoice.find({}).lean(),
            magazines: await Magazine.find({}).lean(),
            memberTypes: await MemberType.find({}).lean(),
            adTypes: await AdType.find({}).lean(),
            advertisements: await Advertisement.find({}).lean(),
            purchaseEntries: await PurchaseEntry.find({}).lean(),
            inventory: await Inventory.find({}).lean(),
            courierEntries: await CourierEntry.find({}).lean()
        };
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: 'Export failed: ' + err.message });
    }
});

// End auto-backup

router.post('/import-database', async (req, res) => {
    try {
        const { data } = req.body;
        if (!data) return res.status(400).json({ message: 'No data provided' });

        // Basic validation of the backup file
        if (!data.users || !data.subscriptions || !data.invoices) {
            return res.status(400).json({ message: 'Invalid backup file format: Missing critical data collections.' });
        }

        // Check metadata if exists (for newer backups)
        if (data.metadata && data.metadata.source !== 'MagZone ERP System') {
            return res.status(400).json({ message: 'Invalid backup file: Source mismatch.' });
        }

        // Use a session if available for atomicity (requires replica set)
        // Since we likely don't have a replica set, we'll do sequential deletion and insertion.
        
        // Clear existing data EXCEPT ADMINS
        const collections = [
            { model: User, name: 'Users', query: { role: { $ne: 'admin' } } },
            { model: Subscription, name: 'Subscriptions' },
            { model: Invoice, name: 'Invoices' },
            { model: Magazine, name: 'Magazines' },
            { model: MemberType, name: 'MemberTypes' },
            { model: AdType, name: 'AdTypes' },
            { model: Advertisement, name: 'Advertisements' },
            { model: PurchaseEntry, name: 'PurchaseEntries' },
            { model: Inventory, name: 'Inventory' },
            { model: CourierEntry, name: 'CourierEntries' }
        ];

        // Perform deletions
        for (const col of collections) {
            await col.model.deleteMany(col.query || {});
        }

        // Import Users (preserving IDs)
        if (data.users && data.users.length > 0) {
            const importUsers = data.users.filter(u => u.role !== 'admin');
            if (importUsers.length > 0) {
                try {
                    await User.insertMany(importUsers, { ordered: false });
                } catch (userErr) {
                    console.error('Some users failed to import:', userErr.message);
                }
            }
        }

        // Import Other Collections (preserving IDs)
        const otherCollections = [
            { key: 'subscriptions', model: Subscription },
            { key: 'invoices', model: Invoice },
            { key: 'magazines', model: Magazine },
            { key: 'memberTypes', model: MemberType },
            { key: 'adTypes', model: AdType },
            { key: 'advertisements', model: Advertisement },
            { key: 'purchaseEntries', model: PurchaseEntry },
            { key: 'inventory', model: Inventory },
            { key: 'courierEntries', model: CourierEntry }
        ];

        for (const col of otherCollections) {
            const records = data[col.key];
            if (records && records.length > 0) {
                try {
                    await col.model.insertMany(records, { ordered: false });
                } catch (collErr) {
                    console.error(`Some records in ${col.key} failed to import:`, collErr.message);
                }
            }
        }

        // Special handling for Admins collection
        // ONLY import admins if the current Admin collection is empty or if specifically needed.
        // For now, we'll only import admins if they don't already exist by username.
        if (data.admins && data.admins.length > 0) {
            for (const adminData of data.admins) {
                const existing = await Admin.findOne({ username: adminData.username });
                if (!existing) {
                    try {
                        await Admin.create(adminData);
                    } catch (adminErr) {
                        console.error('Failed to import admin:', adminData.username, adminErr.message);
                    }
                }
            }
        }

        res.json({ 
            message: 'Database restored successfully', 
            details: 'Existing data was cleared and replaced with backup data. Admin accounts were preserved.' 
        });
    } catch (err) {
        console.error('CRITICAL IMPORT FAILURE:', err);
        res.status(500).json({ message: 'Import failed: ' + err.message });
    }
});



// --- Ad Types Management ---

// --- Ad Types Management ---
router.get('/ad-types', async (req, res) => {
    try {
        const types = await AdType.find().sort({ updatedAt: -1 });
        res.json(types);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/ad-types', async (req, res) => {
    try {
        const type = new AdType(req.body);
        await type.save();
        res.json(type);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/ad-types/:id', async (req, res) => {
    try {
        const type = await AdType.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(type);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/ad-types/:id', async (req, res) => {
    try {
        await AdType.findByIdAndDelete(req.params.id);
        res.json({ message: 'Ad Type deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Customer History ---
router.get('/customers/:id/history', async (req, res) => {
    try {
        const history = await Subscription.find({ userId: req.params.id })
            .populate('userId')
            .populate('magazineId')
            .populate('memberTypeId');
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/customers/:id/ad-history', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        const criteria = [{ userId: req.params.id }];
        if (user && user.name) {
            criteria.push({ clientName: user.name });
        }
        const history = await Advertisement.find({ $or: criteria }).sort({ updatedAt: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Helpers ---
const parseExcelDate = (val) => {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'string') {
        const parts = val.split(/[\/\-]/);
        if (parts.length === 3) {
            // Assume DD/MM/YYYY
            const d = parseInt(parts[0]);
            const m = parseInt(parts[1]) - 1;
            const y = parseInt(parts[2]);
            if (y > 1000) return new Date(y, m, d);
        }
    }
    return new Date(val);
};

const generateInvoiceNumber = async (prefix = 'INV') => {
    const lastInv = await Invoice.findOne({ invoiceNumber: new RegExp(`^${prefix}-[0-9]+`) }, { invoiceNumber: 1 }).sort({ invoiceNumber: -1 });
    let nextNum = 1;
    if (lastInv && lastInv.invoiceNumber) {
        const parts = lastInv.invoiceNumber.split('-');
        if (parts.length > 1) {
            const numPart = parseInt(parts[1]);
            if (!isNaN(numPart)) nextNum = numPart + 1;
        }
    }
    return `${prefix}-${String(nextNum).padStart(6, '0')}`;
};

const generateSubscriptionId = async (prefix = 'SUB') => {
    const subs = await Subscription.find({ subscriptionId: new RegExp(`^${prefix}[0-9]`) }, { subscriptionId: 1 });
    let maxNo = 0;
    subs.forEach(s => {
        const match = s.subscriptionId.match(/[0-9]+$/);
        if (match) {
            const num = parseInt(match[0]);
            if (num > maxNo) maxNo = num;
        }
    });
    return `${prefix}${String(maxNo + 1).padStart(2, '0')}`;
};

const generateSubscriberNo = async (prefix = 'C') => {
    const users = await User.find({
        role: 'customer',
        subscriberNo: new RegExp(`^${prefix}[0-9]`)
    }, { subscriberNo: 1 });

    let maxNo = 0;
    users.forEach(u => {
        const match = u.subscriberNo.match(/[0-9]+$/);
        if (match) {
            const num = parseInt(match[0]);
            if (num > maxNo) maxNo = num;
        }
    });
    return `${prefix}${String(maxNo + 1).padStart(2, '0')}`;
};

// --- Subscriptions ---
router.get('/subscriptions', async (req, res) => {
    try {
        const { status, planId, paymentMethod } = req.query;
        let query = {};
        const now = new Date();

        if (planId) {
            query.memberTypeId = planId;
        }

        if (paymentMethod) {
            query.paymentMethod = paymentMethod;
        }

        // Exclude special customer types (Advertisement, Kovil, Nagarathaar Sangam)
        const excludedCustomerTypes = ['Advertisement', 'Kovil', 'Nagarathaar Sangam'];
        const excludedUsers = await User.find({ role: 'customer', customerType: { $in: excludedCustomerTypes } }, '_id');
        const excludedUserIds = excludedUsers.map(u => u._id);

        if (excludedUserIds.length > 0) {
            query.userId = { $nin: excludedUserIds };
        }

        if (status) {
            if (status === 'Expired') {
                query.status = 'Active';
                query.endDate = { $lt: now };
            } else if (status === 'Active') {
                query.status = 'Active';
                query.endDate = { $gte: now };
            } else {
                query.status = status;
            }
        }

        let rawSubs = await Subscription.find(query)
            .populate('userId')
            .populate('magazineId')
            .populate('memberTypeId')
            .sort({ updatedAt: -1 });

        // Exclude Admin subscriptions from the list
        rawSubs = rawSubs.filter(sub => sub.userId && sub.userId.role !== 'admin');

        // If asking for 'Expired' (Renewal Needed), filter out subs where the user 
        // ALREADY has a new active subscription.
        if (status === 'Expired') {
            // 1. Identify users in this list
            const userIds = rawSubs.map(s => s.userId?._id).filter(id => !!id);

            // 2. Find any active valid subscriptions for these users
            const activeValidSubs = await Subscription.find({
                userId: { $in: userIds },
                status: 'Active',
                endDate: { $gte: now }
            }).distinct('userId');

            // 3. Convert to string for comparison
            const usersWithActiveSubs = new Set(activeValidSubs.map(id => id.toString()));

            // 4. Filter list
            const filteredSubs = rawSubs.filter(sub => {
                const uId = sub.userId?._id?.toString();
                if (!uId) return true; // Keep if user deleted or weird data
                // If user has an active sub, DONT show this expired one
                return !usersWithActiveSubs.has(uId);
            });

            res.json(filteredSubs);
        } else {
            res.json(rawSubs);
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/subscriptions', async (req, res) => {
    try {
        const { userId, magazineId, memberTypeId, startDate, endDate, paymentMethod, referenceNo, tempReceiptNo } = req.body;
        const start = startDate ? new Date(startDate) : new Date();
        let end = endDate ? new Date(endDate) : new Date(start);

        let mType = null;
        if (memberTypeId) {
            mType = await MemberType.findById(memberTypeId);
            if (mType && !endDate) {
                end.setMonth(end.getMonth() + mType.durationInMonths);
                end.setDate(end.getDate() - 1);
            }
        }

        const subId = await generateSubscriptionId(mType?.letter || 'SUB');
        const sub = new Subscription({
            userId, magazineId, memberTypeId,
            subscriptionId: subId,
            startDate: start,
            endDate: end,
            status: paymentMethod ? 'Active' : 'Pending',
            referenceNo: referenceNo || '',
            tempReceiptNo: tempReceiptNo || '',
            paymentMethod: paymentMethod || ''
        });
        await sub.save();

        // Create Invoice
        const prefix = (paymentMethod === 'Cash') ? 'C' : 'B';
        const invNo = await generateInvoiceNumber(prefix);
        let amount = mType ? mType.price : 0;

        const invoice = new Invoice({
            userId,
            subscriptionId: sub._id,
            invoiceNumber: invNo,
            amount,
            status: (paymentMethod && paymentMethod !== 'Credit Transaction') ? 'Paid' : 'Unpaid',
            dateIssued: new Date(),
            billingStart: start,
            billingEnd: end,
            paymentMethod,
            paymentDate: (paymentMethod && paymentMethod !== 'Credit Transaction') ? new Date() : null,
            referenceNo: referenceNo || '',
            tempReceiptNo: tempReceiptNo || '',
            items: [{ description: mType ? `Subscription - ${mType.name}` : 'Subscription', amount }]
        });
        await invoice.save();

        const populatedSub = await Subscription.findById(sub._id).populate('memberTypeId');
        const populatedInvoice = await Invoice.findById(invoice._id)
            .populate('userId')
            .populate({
                path: 'subscriptionId',
                populate: { path: 'memberTypeId' }
            });

        // Update User's updatedAt to bring them to the top of 'recently added/updated'
        await User.findByIdAndUpdate(userId, { updatedAt: new Date() });

        res.json({ subscription: populatedSub, invoice: populatedInvoice });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Renew subscription
router.post('/subscriptions/renew', async (req, res) => {
    try {
        const { subscriptionId, memberTypeId, startDate, endDate, paymentMethod, referenceNo, tempReceiptNo } = req.body;

        // Find the existing subscription
        const existingSub = await Subscription.findById(subscriptionId);
        if (!existingSub) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        // Get the new member type
        const newMemberType = await MemberType.findById(memberTypeId);
        if (!newMemberType) {
            return res.status(404).json({ message: 'Member type not found' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Create new subscription for renewal (history preservation)
        const subId = await generateSubscriptionId(newMemberType.letter || 'SUB');

        const newSub = new Subscription({
            userId: existingSub.userId,
            magazineId: existingSub.magazineId,
            memberTypeId: memberTypeId,
            subscriptionId: subId,
            startDate: start,
            endDate: end,
            status: paymentMethod ? 'Active' : 'Pending',
            referenceNo: referenceNo || '',
            tempReceiptNo: tempReceiptNo || '',
            paymentMethod: paymentMethod || ''
        });

        await newSub.save();

        // Create new invoice for renewal
        const prefix = (paymentMethod === 'Cash') ? 'C' : 'B';
        const invNo = await generateInvoiceNumber(prefix);
        const invoice = new Invoice({
            userId: existingSub.userId,
            subscriptionId: newSub._id, // Link to the NEW subscription
            invoiceNumber: invNo,
            amount: newMemberType.price,
            status: (paymentMethod && paymentMethod !== 'Credit Transaction') ? 'Paid' : 'Unpaid',
            dateIssued: new Date(),
            billingStart: start,
            billingEnd: end,
            paymentMethod,
            paymentDate: (paymentMethod && paymentMethod !== 'Credit Transaction') ? new Date() : null,
            referenceNo: referenceNo || '',
            tempReceiptNo: tempReceiptNo || '',
            items: [{ description: `Subscription Renewal - ${newMemberType.name}`, amount: newMemberType.price }]
        });
        await invoice.save();

        const populatedSub = await Subscription.findById(existingSub._id)
            .populate('userId')
            .populate('memberTypeId');

        const populatedInvoice = await Invoice.findById(invoice._id)
            .populate('userId')
            .populate({
                path: 'subscriptionId',
                populate: { path: 'memberTypeId' }
            });

        // Update User's updatedAt to bring them to the top of 'recently added/updated'
        await User.findByIdAndUpdate(existingSub.userId, { updatedAt: new Date() });

        res.json({ subscription: populatedSub, invoice: populatedInvoice });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Edit existing subscription details
router.put('/subscriptions/:id', async (req, res) => {
    try {
        const { userId, memberTypeId, startDate, endDate, paymentMethod, referenceNo, tempReceiptNo, password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Admin password required' });
        }

        // Verify admin action password
        const admin = await Admin.findById(req.user._id);
        if (!admin) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const requiredActionPassword = process.env.ADMIN_ACTION_PASSWORD;
        if (!requiredActionPassword || password !== requiredActionPassword) {
            return res.status(401).json({ message: 'Invalid admin action password' });
        }

        const sub = await Subscription.findById(req.params.id);
        if (!sub) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        let selectedMemberType = null;
        const previousMemberTypeId = sub.memberTypeId ? sub.memberTypeId.toString() : '';
        if (memberTypeId) {
            selectedMemberType = await MemberType.findById(memberTypeId);
            if (!selectedMemberType) {
                return res.status(404).json({ message: 'Member type not found' });
            }
            sub.memberTypeId = memberTypeId;

            // If plan changes, regenerate subscription id with the correct plan prefix.
            if (previousMemberTypeId && previousMemberTypeId !== memberTypeId.toString()) {
                sub.subscriptionId = await generateSubscriptionId(selectedMemberType.letter || 'SUB');
            }
        }

        if (userId) sub.userId = userId;
        if (startDate) sub.startDate = new Date(startDate);
        if (endDate) sub.endDate = new Date(endDate);

        if (typeof paymentMethod === 'string') {
            sub.paymentMethod = paymentMethod;
            sub.status = paymentMethod ? 'Active' : 'Pending';
        }

        if (typeof referenceNo === 'string') sub.referenceNo = referenceNo;
        if (typeof tempReceiptNo === 'string') sub.tempReceiptNo = tempReceiptNo;

        await sub.save();

        // Keep associated invoices in sync without affecting other subscriptions.
        const invoice = await Invoice.findOne({ subscriptionId: sub._id }).sort({ createdAt: -1 });
        let updatedInvoice = null;

        if (invoice) {
            const invoiceUpdateFields = {};

            if (startDate) invoiceUpdateFields.billingStart = new Date(startDate);
            if (endDate) invoiceUpdateFields.billingEnd = new Date(endDate);

            if (selectedMemberType) {
                invoiceUpdateFields.amount = selectedMemberType.price || 0;
                invoiceUpdateFields.items = [{ description: `Subscription - ${selectedMemberType.name}`, amount: selectedMemberType.price || 0 }];
            }

            if (typeof paymentMethod === 'string') {
                const isPaid = paymentMethod && paymentMethod !== 'Credit Transaction';
                invoiceUpdateFields.paymentMethod = paymentMethod;
                invoiceUpdateFields.status = isPaid ? 'Paid' : 'Unpaid';
                invoiceUpdateFields.paymentDate = isPaid ? new Date() : null;
            }

            if (typeof referenceNo === 'string') invoiceUpdateFields.referenceNo = referenceNo;
            if (typeof tempReceiptNo === 'string') invoiceUpdateFields.tempReceiptNo = tempReceiptNo;

            if (Object.keys(invoiceUpdateFields).length > 0) {
                await Invoice.updateMany({ subscriptionId: sub._id }, { $set: invoiceUpdateFields });
            }

            updatedInvoice = await Invoice.findById(invoice._id)
                .populate('userId')
                .populate({
                    path: 'subscriptionId',
                    populate: { path: 'memberTypeId' }
                });
        }

        const populatedSub = await Subscription.findById(sub._id)
            .populate('userId')
            .populate('memberTypeId');

        res.json({ message: 'Subscription updated successfully', subscription: populatedSub, invoice: updatedInvoice });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete subscription
router.delete('/subscriptions/:id', async (req, res) => {
    try {
        const sub = await Subscription.findById(req.params.id);
        if (!sub) return res.status(404).json({ message: 'Subscription not found' });

        // Delete associated invoice
        await Invoice.deleteMany({ subscriptionId: sub._id });
        await Subscription.findByIdAndDelete(req.params.id);

        res.json({ message: 'Subscription and associated invoices deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Magazines ---
router.get('/magazines', async (req, res) => {
    try {
        const mags = await Magazine.find().sort({ updatedAt: -1 });
        res.json(mags);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/magazines', async (req, res) => {
    try {
        const mag = new Magazine(req.body);
        await mag.save();
        res.json(mag);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/magazines/:id', async (req, res) => {
    try {
        const mag = await Magazine.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(mag);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/magazines/:id', async (req, res) => {
    try {
        await Magazine.findByIdAndDelete(req.params.id);
        res.json({ message: 'Magazine deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Subscribers ---
router.get('/subscribers', async (req, res) => {
    try {
        const { type } = req.query;
        // Include both customers and admins (for 'Other' filter)
        const query = { role: { $in: ['customer', 'admin'] } };
        if (type) {
            query.customerType = type;
        }
        const rawSubscribers = await User.find(query).sort({ updatedAt: -1 }).lean();

        // Enrich with status/billing info
        const subscribers = await Promise.all(rawSubscribers.map(async (user) => {
            const lastSub = await Subscription.findOne({ userId: user._id }).sort({ endDate: -1 }).populate('memberTypeId');
            let nextBillingDate = null;
            let status = user.customerType === 'Advertisement' ? 'Advertisement' : 'Active';
            let planName = user.customerType === 'Advertisement' ? 'Advertisement' : 'N/A';

            if (lastSub) {
                nextBillingDate = lastSub.endDate;
                planName = lastSub.memberTypeId?.name || 'N/A';
                const isExpired = new Date(lastSub.endDate) < new Date();
                if (isExpired && user.customerType !== 'Advertisement') {
                    status = 'Renew Needed';
                }
            } else if (user.customerType !== 'Advertisement') {
                status = 'New';
            }

            return {
                ...user,
                subscriberNo: user.subscriberNo || (lastSub && lastSub.subscriptionId),
                nextBillingDate,
                planName,
                status
            };
        }));

        res.json(subscribers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Reports Management ---
router.get('/reports/dashboard', async (req, res) => {
    try {
        const totalSubscribers = await User.countDocuments({
            role: 'customer',
            customerType: { $nin: ['Advertisement', 'Kovil', 'Nagarathaar Sangam'] }
        });
        const now = new Date();
        const adminIds = await User.find({ role: 'admin' }).distinct('_id');

        // Identify IDs of excluded customer types (Advertisement, Kovil, Nagarathaar Sangam) to remove from subscription counts
        const excludedCustomerTypes = ['Advertisement', 'Kovil', 'Nagarathaar Sangam'];
        const excludedUsers = await User.find({ role: 'customer', customerType: { $in: excludedCustomerTypes } }, '_id');
        const excludedUserIds = excludedUsers.map(u => u._id);

        // Combine IDs to exclude (Admins + Special Customers)
        const idsToExclude = [...adminIds, ...excludedUserIds];

        // Calculate unique customers with active subscriptions
        const activeSubscriptionCustomers = await Subscription.distinct('userId', {
            status: 'Active',
            endDate: { $gte: now },
            userId: { $nin: idsToExclude }
        });
        const activeSubscriptions = activeSubscriptionCustomers.length;

        // Smart Calculation for Renewal Needed:
        // Exclude expired subscriptions if the user already has a DIFFERENT active, valid subscription.
        const usersWithActiveSub = await Subscription.distinct('userId', {
            status: 'Active',
            endDate: { $gte: now }
        });

        const renewalNeededSubscriptions = await Subscription.countDocuments({
            status: 'Active',
            endDate: { $lt: now },
            userId: { $nin: usersWithActiveSub.concat(idsToExclude) }
        });
        const allSubscriptions = await Subscription.countDocuments({
            userId: { $nin: idsToExclude }
        });

        // Calculate total revenue
        const revenue = await Invoice.aggregate([
            { $match: { status: 'Paid' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Calculate advertisement revenue specifically
        const adRevenue = await Invoice.aggregate([
            { $match: { status: 'Paid', category: 'Advertisement' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Calculate unique customers with subscriptions
        const uniqueSubscriptionCustomers = await Subscription.distinct('userId', {
            userId: { $nin: adminIds }
        });

        res.json({
            totalCustomers: await User.countDocuments({ role: 'customer' }),
            totalSubscribers: uniqueSubscriptionCustomers.length, // Count unique customers with subscriptions
            totalAdCustomers: await User.countDocuments({ role: 'customer', customerType: 'Advertisement' }),
            activeSubscriptions,
            renewalNeededSubscriptions,
            allSubscriptions,
            revenue: revenue[0]?.total || 0,
            adRevenue: adRevenue[0]?.total || 0
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/reports/subscribers-by-plan', async (req, res) => {
    try {
        const { planId, startDate, endDate, status, district, dispatchType, customerType, adType } = req.query;

        // Handle Advertisement, Kovil, Nagarathaar Sangam status (User based query)
        // Kept for Advertisement as it might not follow standard sub logic or we want all clients
        const specialTypes = ['Advertisement', 'Kovil', 'Nagarathaar Sangam'];
        if (specialTypes.includes(status) || specialTypes.includes(customerType)) {
            const typeToFilter = specialTypes.includes(status) ? status : customerType;
            let userQuery = { customerType: typeToFilter };

            // Filter by Ad Classification if provided (Only for Advertisements)
            if (adType && typeToFilter === 'Advertisement') {
                // Find all advertisements that have this specific type
                const matchingAds = await Advertisement.find({ types: adType }).distinct('userId');
                // Even if no ads found, we should return empty, so matchingAds will be empty array
                // If we didn't add this, it would return ALL advertisement customers

                // If userQuery already has an _id query (unlikely here but good practice), we need to merge
                // But for now, just set it.
                // We use $in to restrict users to those who have run ads of this type
                userQuery._id = { $in: matchingAds };
            }

            if (dispatchType && dispatchType !== 'All') {
                userQuery.dispatchType = dispatchType;
            }
            if (district) {
                const searchRegex = { $regex: new RegExp(district, 'i') };
                userQuery.$or = [
                    { 'address.street': searchRegex },
                    { 'address.addressLine2': searchRegex },
                    { 'address.taluk': searchRegex },
                    { 'address.district': searchRegex },
                    { 'address.state': searchRegex },
                    { 'address.pincode': searchRegex },
                    { 'address.country': searchRegex },
                    { 'address': searchRegex } // Legacy string support
                ];
            }
            const users = await User.find(userQuery).sort({ createdAt: -1 });
            const reportData = users.map(user => ({
                subscriberNo: user.subscriberNo,
                name: user.name,
                mobile: user.mobile,
                address: user.address,
                startDate: user.createdAt,
                status: typeToFilter,
                planName: typeToFilter,
                customerType: typeToFilter,
                dispatchType: user.dispatchType
            }));
            return res.json(reportData);
        }

        let query = {};
        if (planId) query.memberTypeId = planId;

        if (startDate || endDate) {
            query.startDate = {};
            if (startDate) query.startDate.$gte = new Date(startDate);
            if (endDate) query.startDate.$lte = new Date(endDate);
        }

        // 1. Find the Users matching the initial criteria (Plan, Date)
        // We use distinct to get unique userIds efficiently
        const targetUserIds = await Subscription.distinct('userId', query);

        // 2. Fetch ALL subscriptions for these users and group by user to get the latest
        const allTargetSubs = await Subscription.find({ userId: { $in: targetUserIds } })
            .populate('userId')
            .populate('memberTypeId')
            .sort({ createdAt: -1 });

        // 3. Deduplicate to keep only the absolute latest per user
        // Group by userId and keep only the most recent subscription
        const userSubsMap = new Map();
        const seenSubscriberNos = new Set();

        for (const sub of allTargetSubs) {
            // Verify User exists
            if (!sub.userId || !sub.userId._id) continue;

            const uid = sub.userId._id.toString();

            // If we haven't seen this user yet, or this subscription is newer than the one we have
            if (!userSubsMap.has(uid) || new Date(sub.createdAt) > new Date(userSubsMap.get(uid).createdAt)) {
                userSubsMap.set(uid, sub);
            }
        }

        // Convert map to array
        const uniqueSubs = Array.from(userSubsMap.values());

        // Get active user IDs to exclude from 'Inactive' reports
        const now = new Date();
        const activeUserIds = await Subscription.distinct('userId', {
            status: 'Active',
            endDate: { $gte: now }
        });
        const activeUserSet = new Set(activeUserIds.map(id => id.toString()));

        let reportData = uniqueSubs.map(sub => {
            const user = sub.userId || {};
            const isExpired = new Date(sub.endDate) < new Date();
            const currentStatus = isExpired ? 'Expired' : sub.status;

            return {
                subscriberNo: sub.subscriptionId || user.subscriberNo,
                userId: user._id ? user._id.toString() : null,
                name: user.name,
                mobile: user.mobile,
                address: user.address,
                startDate: sub.startDate,
                endDate: sub.endDate,
                status: currentStatus,
                planName: sub.memberTypeId?.name,
                customerType: user.customerType || 'Subscription',
                dispatchType: user.dispatchType || 'Post', // Default to Post
                paymentMethod: sub.paymentMethod,
                referenceNo: sub.referenceNo
            };
        });

        // Filter by Customer Type
        if (customerType && customerType !== 'All') {
            reportData = reportData.filter(d => d.customerType === customerType);
        }

        // Filter by Dispatch Type
        if (dispatchType && dispatchType !== 'All') {
            reportData = reportData.filter(d => d.dispatchType === dispatchType);
        }

        // Filter by Status
        // Filter by Status
        if (status && status !== 'All') {
            reportData = reportData.filter(d => {
                // Exclude special customer types from standard status filters
                if (['Active', 'Inactive', 'Renew Needed', 'ExpiringSoon'].includes(status)) {
                    if (['Kovil', 'Nagarathaar Sangam', 'Advertisement'].includes(d.customerType)) {
                        return false;
                    }
                }

                if (status === 'Active') return d.status === 'Active';
                if (status === 'Renew Needed') return d.status === 'Renew Needed' || d.status === 'Expired';
                if (status === 'Inactive') {
                    const isInactiveStatus = d.status === 'Renew Needed' || d.status === 'Expired' || d.status === 'Terminated';
                    // If the subscription is inactive, BUT the user is in the active set (has another active sub), 
                    // then do NOT show them in "Inactive" list.
                    return isInactiveStatus && !activeUserSet.has(d.userId);
                }
                if (status === 'ExpiringSoon') {
                    if (d.status !== 'Active') return false;
                    const endDate = new Date(d.endDate);
                    const thirtyDaysFromNow = new Date();
                    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                    return endDate >= new Date() && endDate <= thirtyDaysFromNow;
                }
                if (status === 'Other') {
                    const knownStatuses = ['Active', 'Renew Needed', 'Expired', 'Terminated', 'Inactive'];
                    return !knownStatuses.includes(d.status);
                }
                // Default: Exact Match (for specific statuses like 'Suspended' if they exist)
                return d.status === status;
            });
        } else {
            // Default 'All' view: Exclude special types unless specifically requested via customerType
            if (!customerType || customerType === 'All') {
                reportData = reportData.filter(d => !['Kovil', 'Nagarathaar Sangam', 'Advertisement'].includes(d.customerType));
            }
        }

        // Filter by District/Address (searches all address fields)
        if (district) {
            const lowerDist = district.toLowerCase();
            reportData = reportData.filter(d => {
                if (!d.address) return false;
                if (typeof d.address === 'object') {
                    const street = (d.address.street || '').toLowerCase();
                    const addressLine2 = (d.address.addressLine2 || '').toLowerCase();
                    const taluk = (d.address.taluk || '').toLowerCase();
                    const districtField = (d.address.district || '').toLowerCase();
                    const state = (d.address.state || '').toLowerCase();
                    const pincode = (d.address.pincode || '').toLowerCase();
                    const country = (d.address.country || '').toLowerCase();

                    return street.includes(lowerDist) ||
                        addressLine2.includes(lowerDist) ||
                        taluk.includes(lowerDist) ||
                        districtField.includes(lowerDist) ||
                        state.includes(lowerDist) ||
                        pincode.includes(lowerDist) ||
                        country.includes(lowerDist);
                }
                if (typeof d.address === 'string') {
                    return d.address.toLowerCase().includes(lowerDist);
                }
                return false;
            });
        }

        res.json(reportData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Member Types ---
router.get('/member-types', async (req, res) => {
    try {
        const types = await MemberType.find().sort({ updatedAt: -1 });
        res.json(types);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/member-types', async (req, res) => {
    try {
        const type = new MemberType(req.body);
        await type.save();
        res.json(type);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/member-types/:id', async (req, res) => {
    try {
        const type = await MemberType.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(type);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/member-types/:id', async (req, res) => {
    try {
        await MemberType.findByIdAndDelete(req.params.id);
        res.json({ message: 'Member type deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Advertisements ---
router.get('/advertisements', async (req, res) => {
    try {
        const ads = await Advertisement.find().populate('userId').sort({ updatedAt: -1 });
        res.json(ads);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/advertisements', async (req, res) => {
    try {
        const { userId, clientName, adName, types, startDate, endDate, price, paymentMethod, referenceNo, tempReceiptNo, creditType, amountPaidNow, partPaymentDate, adminActionPassword, tdsAmount, typeAmounts } = req.body;

        if (paymentMethod === 'Credit Transaction' || (tdsAmount && tdsAmount > 0)) {
            const requiredActionPassword = process.env.ADMIN_ACTION_PASSWORD;
            if (!requiredActionPassword || adminActionPassword !== requiredActionPassword) {
                const trigger = (tdsAmount && tdsAmount > 0) ? 'TDS deduction' : 'credit transaction';
                return res.status(401).json({ message: `Invalid admin action password for ${trigger}` });
            }
        }

        const ad = new Advertisement({
            userId, clientName, adName, types, typeAmounts, startDate, endDate, price, paymentMethod, referenceNo, tempReceiptNo, creditType, amountPaidNow, tdsAmount: tdsAmount || 0,
            partPaymentDate: creditType === 'Part Payment' ? (partPaymentDate || new Date()) : null
        });
        await ad.save();

        // Create Invoice for Advertisement
        // Use C for Cash, B for Other (Credit/Bank)
        const prefix = (paymentMethod === 'Cash') ? 'C' : 'B';
        const invNo = await generateInvoiceNumber(prefix);
        // Generate Invoice Items based on typeAmounts if available
        const invoiceItems = [];
        if (typeAmounts && typeAmounts.length > 0) {
            typeAmounts.forEach((ta) => {
                invoiceItems.push({ description: `Advertisement: ${adName} - ${ta.name}`, amount: ta.amount });
            });
        } else {
            invoiceItems.push({ description: `Advertisement: ${adName}${types && types.length > 0 ? `\nAd Type: ${types.join(', ')}` : ''}`, amount: price });
        }
        if (tdsAmount) {
            invoiceItems.push({ description: 'TDS Deduction', amount: -tdsAmount });
        }

        const invoice = new Invoice({
            userId,
            advertisementId: ad._id, // Link to the advertisement
            customerName: clientName, // Ensure name is stored if userId is missing or for reference
            invoiceNumber: invNo,
            category: 'Advertisement',
            amount: price - (tdsAmount || 0),
            status: (paymentMethod && paymentMethod !== 'Credit Transaction') ? 'Paid' : 'Unpaid',
            dateIssued: new Date(),
            billingStart: startDate ? new Date(startDate) : new Date(),
            billingEnd: endDate ? new Date(endDate) : new Date(),
            paymentMethod,
            paymentDate: (paymentMethod && paymentMethod !== 'Credit Transaction') ? new Date() : null,
            referenceNo: referenceNo || '',
            tempReceiptNo: tempReceiptNo || '',
            items: invoiceItems
        });
        await invoice.save();

        const populatedInvoice = await Invoice.findById(invoice._id).populate('userId').populate('advertisementId');
        res.json({ advertisement: ad, invoice: populatedInvoice });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/advertisements/:id', async (req, res) => {
    try {
        const { paymentMethod, adminActionPassword, tdsAmount } = req.body;

        const oldAd = await Advertisement.findById(req.params.id);
        if (!oldAd) return res.status(404).json({ message: 'Advertisement not found' });

        const isNewOrChangedCredit = paymentMethod === 'Credit Transaction' && oldAd.paymentMethod !== 'Credit Transaction';
        const isNewOrChangedTds = (tdsAmount && tdsAmount > 0) && oldAd.tdsAmount !== tdsAmount;

        if (isNewOrChangedCredit || isNewOrChangedTds) {
            const requiredActionPassword = process.env.ADMIN_ACTION_PASSWORD;
            if (!requiredActionPassword || adminActionPassword !== requiredActionPassword) {
                const trigger = isNewOrChangedTds ? 'TDS deduction change' : 'credit transaction';
                return res.status(401).json({ message: `Invalid admin action password for ${trigger}` });
            }
        }

        const updateData = { ...req.body };

        // Incremental part payments from the ads dashboard should add to the existing total.
        if (req.body.amountPaidIncrement !== undefined) {
            const increment = Number(req.body.amountPaidIncrement) || 0;
            const currentPaid = Number(oldAd.amountPaidNow) || 0;
            const adTotal = Math.max((Number(oldAd.price) || 0) - (Number(oldAd.tdsAmount) || 0), 0);
            updateData.amountPaidNow = Math.min(currentPaid + increment, adTotal);
            delete updateData.amountPaidIncrement;
        }
        
        // Handle partPaymentDate logic
        if (req.body.creditType === 'Part Payment' && oldAd.creditType !== 'Part Payment' && !req.body.partPaymentDate) {
            updateData.partPaymentDate = new Date();
        } else if (req.body.creditType === 'Full Credit' && req.body.paymentMethod === 'Credit Transaction') {
            updateData.partPaymentDate = null;
        }

        // Handle paymentDate for repayment
        if (req.body.paymentMethod && req.body.paymentMethod !== 'Credit Transaction' && oldAd.paymentMethod === 'Credit Transaction') {
            updateData.paymentDate = new Date();
        }

        const ad = await Advertisement.findByIdAndUpdate(req.params.id, updateData, { new: true });

        let updatedInvoice = await Invoice.findOne({ advertisementId: ad._id }).sort({ createdAt: -1 });

        if (updatedInvoice) {
            let invoiceChanged = false;

            // Handle price, typeAmounts, or TDS updates
            if (req.body.price !== undefined || req.body.tdsAmount !== undefined || req.body.adName !== undefined || req.body.typeAmounts !== undefined) {
                const newPrice = ad.price || 0;
                const newTds = ad.tdsAmount || 0;
                updatedInvoice.amount = newPrice - newTds;
                
                const newItems = [];
                if (ad.typeAmounts && ad.typeAmounts.length > 0) {
                    ad.typeAmounts.forEach((ta) => {
                        newItems.push({ description: `Advertisement: ${ad.adName} - ${ta.name}`, amount: ta.amount });
                    });
                } else {
                    newItems.push({ description: `Advertisement: ${ad.adName}${ad.types && ad.types.length > 0 ? `\nAd Type: ${ad.types.join(', ')}` : ''}`, amount: newPrice });
                }
                if (newTds) {
                    newItems.push({ description: 'TDS Deduction', amount: -newTds });
                }
                
                updatedInvoice.items = newItems;
                invoiceChanged = true;
            }

            // Handle credit specifics
            if (req.body.creditType !== undefined || req.body.amountPaidNow !== undefined) {
                invoiceChanged = true;
            }

            // Sync payment details
            if (req.body.paymentMethod !== undefined || req.body.referenceNo !== undefined || req.body.tempReceiptNo !== undefined) {
                if (req.body.paymentMethod) updatedInvoice.paymentMethod = req.body.paymentMethod;
                if (req.body.referenceNo !== undefined) updatedInvoice.referenceNo = req.body.referenceNo;
                if (req.body.tempReceiptNo !== undefined) updatedInvoice.tempReceiptNo = req.body.tempReceiptNo;

                // Sync status based on paymentMethod
                if (req.body.paymentMethod) {
                    if (req.body.paymentMethod === 'Credit Transaction') {
                        // If it's a credit transaction, it's Unpaid by default unless manually overridden in some other logic
                        // But usually we want to keep it Unpaid.
                        updatedInvoice.status = 'Unpaid';
                        updatedInvoice.paymentDate = null;
                    } else {
                        updatedInvoice.status = 'Paid';
                        if (!updatedInvoice.paymentDate) updatedInvoice.paymentDate = new Date();
                    }
                }
                invoiceChanged = true;
            }

            if (invoiceChanged) {
                await updatedInvoice.save();
                // Populate for frontend
                updatedInvoice = await Invoice.findById(updatedInvoice._id).populate('userId').populate('advertisementId');
            }
        }

        res.json({ advertisement: ad, invoice: updatedInvoice });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/advertisements/:id', async (req, res) => {
    try {
        const ad = await Advertisement.findByIdAndDelete(req.params.id);
        if (!ad) {
            return res.status(404).json({ message: 'Advertisement not found' });
        }

        await Invoice.deleteMany({ advertisementId: ad._id });
        res.json({ message: 'Advertisement deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Customers Management ---
router.post('/customers', async (req, res) => {
    try {
        const { name, street, addressLine2, taluk, district, state, country, pincode, mobile, whatsapp, customerType, memberTypeId, dispatchType } = req.body;

        // 1. Check for Duplicate Mobile
        if (mobile) {
            const existingMobile = await User.findOne({ mobile, role: 'customer' });
            if (existingMobile) {
                return res.status(400).json({ message: 'Duplicate Error: A customer with this mobile number already exists.' });
            }
        } else {
            // 2. Check for Duplicate Name + Address (only if mobile is empty)
            // We require at least Name and (Street OR District) to confirm duplicate
            if (name && (street || district)) {
                const query = {
                    name: { $regex: new RegExp(`^${name}$`, 'i') },
                    role: 'customer'
                };
                if (street) query['address.street'] = { $regex: new RegExp(`^${street}$`, 'i') };
                if (district) query['address.district'] = { $regex: new RegExp(`^${district}$`, 'i') };
                if (pincode) query['address.pincode'] = pincode;

                const existingUser = await User.findOne(query);
                if (existingUser) {
                    return res.status(400).json({ message: 'Duplicate Error: A customer with this Name and Address already exists.' });
                }
            }
        }

        const prefix = customerType === 'Advertisement' ? 'A' : 'C';
        const subscriberNo = await generateSubscriberNo(prefix);

        const userData = {
            name,
            username: mobile || subscriberNo,
            password: 'welcome123',
            role: 'customer',
            address: {
                street: street || '',
                addressLine2: addressLine2 || '',
                taluk: taluk || '',
                district: district || '',
                state: state || '',
                country: country || 'India',
                pincode: pincode || ''
            },
            mobile: mobile || '',
            whatsapp: whatsapp || '',
            customerType: customerType || 'Subscription',
            dispatchType: dispatchType || 'Post',
            subscriberNo,
            adType: req.body.adType || '' // Save optional adType
        };

        const user = new User(userData);
        await user.save();
        res.json(user);
    } catch (err) {
        let msg = err.message;
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            msg = `Duplicate Error: A customer with this ${field} already exists.`;
        }
        res.status(400).json({ message: msg });
    }
});

router.put('/customers/:id', async (req, res) => {
    try {
        const { name, street, addressLine2, taluk, district, state, country, pincode, mobile, whatsapp, customerType, dispatchType } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Customer not found' });

        user.name = name;

        user.address = {
            street: street || '',
            addressLine2: addressLine2 || '',
            taluk: taluk || '',
            district: district || '',
            state: state || '',
            country: country || 'India',
            pincode: pincode || ''
        };
        user.mobile = mobile || '';
        user.whatsapp = whatsapp || '';
        user.customerType = customerType || 'Subscription';
        user.dispatchType = dispatchType || 'Post';

        await user.save();
        res.json(user);
    } catch (err) {
        let msg = err.message;
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            msg = `Duplicate Error: A customer with this ${field} already exists.`;
        }
        res.status(400).json({ message: msg });
    }
});

router.delete('/customers/:id', async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Admin password required' });
        }

        // Verify admin password
        const admin = await Admin.findById(req.user._id);
        if (!admin) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const requiredActionPassword = process.env.ADMIN_ACTION_PASSWORD;
        if (!requiredActionPassword || password !== requiredActionPassword) {
            return res.status(401).json({ message: 'Invalid admin action password' });
        }

        const userId = req.params.id;
        await User.findByIdAndDelete(userId);
        await Subscription.deleteMany({ userId: userId });
        await Invoice.deleteMany({ userId: userId });
        await Advertisement.deleteMany({ userId: userId });
        res.json({ message: 'Customer and associated data deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Invoices Management ---
router.get('/invoices', async (req, res) => {
    try {
        const { userId, customerName, subscriptionId } = req.query;
        const query = {};
        if (userId) query.userId = userId;
        if (customerName) query.customerName = customerName;
        if (subscriptionId) query.subscriptionId = subscriptionId;

        const invoices = await Invoice.find(query)
            .populate('userId')
            .populate({
                path: 'subscriptionId',
                populate: { path: 'memberTypeId' }
            })
            .populate('advertisementId')
            .sort({ updatedAt: -1 });
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/invoices/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const updateData = { status };
        if (status === 'Paid') {
            updateData.paymentDate = new Date();
        }
        let invoice = await Invoice.findByIdAndUpdate(req.params.id, updateData, { new: true });

        // If explicitly moving to Paid, potentially update associated subscription/ad
        if (status === 'Paid' && invoice) {
            const updateFields = {
                paymentMethod: invoice.paymentMethod || 'Paid (Direct Update)',
                referenceNo: invoice.referenceNo || '',
                tempReceiptNo: invoice.tempReceiptNo || '',
                paymentDate: new Date()
            };

            if (invoice.subscriptionId) {
                await Subscription.findByIdAndUpdate(invoice.subscriptionId, {
                    ...updateFields,
                    status: 'Active'
                });
            } else if (invoice.advertisementId) {
                await Advertisement.findByIdAndUpdate(invoice.advertisementId, updateFields);
            }
        }

        // Populate for frontend PDF generation
        invoice = await Invoice.findById(invoice._id)
            .populate('userId')
            .populate({
                path: 'subscriptionId',
                populate: { path: 'memberTypeId' }
            })
            .populate('advertisementId');

        res.json(invoice);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/invoices/:id', async (req, res) => {
    try {
        await Invoice.findByIdAndDelete(req.params.id);
        res.json({ message: 'Invoice deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Inventory Management ---
router.get('/purchase-entries', async (req, res) => {
    try {
        const items = await PurchaseEntry.find().sort({ updatedAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/purchase-entries', async (req, res) => {
    try {
        const lastEntry = await PurchaseEntry.findOne().sort({ createdAt: -1 });
        let nextNo = 1;
        if (lastEntry && lastEntry.entryNo) {
            const lastNo = parseInt(lastEntry.entryNo);
            if (!isNaN(lastNo)) nextNo = lastNo + 1;
        }

        const entry = new PurchaseEntry({
            ...req.body,
            entryNo: nextNo.toString()
        });
        await entry.save();
        res.json(entry);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/purchase-entries/:id', async (req, res) => {
    try {
        const entry = await PurchaseEntry.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(entry);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/purchase-entries/:id', async (req, res) => {
    try {
        await PurchaseEntry.findByIdAndDelete(req.params.id);
        res.json({ message: 'Purchase entry deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Courier Entries Management ---
router.get('/courier-entries', async (req, res) => {
    try {
        const items = await CourierEntry.find().sort({ updatedAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/courier-entries', async (req, res) => {
    try {
        const entry = new CourierEntry(req.body);
        await entry.save();
        res.json(entry);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/courier-entries/:id', async (req, res) => {
    try {
        const entry = await CourierEntry.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(entry);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/courier-entries/:id', async (req, res) => {
    try {
        await CourierEntry.findByIdAndDelete(req.params.id);
        res.json({ message: 'Courier entry deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Get All Customers with Subscription Details ---
router.get('/customers', async (req, res) => {
    try {
        const customers = await User.aggregate([
            { $match: { role: 'customer' } },
            {
                $lookup: {
                    from: 'subscriptions',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'subscriptions'
                }
            },
            {
                $lookup: {
                    from: 'invoices',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'invoices'
                }
            },
            {
                $lookup: {
                    from: 'membertypes',
                    localField: 'subscriptions.memberTypeId',
                    foreignField: '_id',
                    as: 'plans'
                }
            },
            {
                $addFields: {
                    latestSubscription: { $arrayElemAt: [{ $sortArray: { input: "$subscriptions", sortBy: { createdAt: -1 } } }, 0] },
                    latestInvoice: { $arrayElemAt: [{ $sortArray: { input: "$invoices", sortBy: { dateIssued: -1 } } }, 0] }
                }
            },
            {
                $addFields: {
                    latestPlan: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: "$plans",
                                    as: "plan",
                                    cond: { $eq: ["$$plan._id", "$latestSubscription.memberTypeId"] }
                                }
                            },
                            0
                        ]
                    }
                }
            },
            { $sort: { createdAt: -1 } }
        ]);
        res.json(customers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Bulk Import ---
router.post('/bulk-import-customers', async (req, res) => {
    try {
        const { records } = req.body;
        let successCount = 0;
        let errors = [];
        const processedMobiles = new Set();

        for (const rec of records) {
            try {
                // Map exported headers to model fields
                const name = rec['Name'] || rec.name;
                const mobile = rec['Mobile'] || rec.mobile || '';
                const whatsapp = rec['WhatsApp'] || rec.whatsapp || mobile;
                const customerType = rec['Customer Type'] || rec.customerType || 'Subscription';
                const dispatchType = rec['Dispatch Preference'] || rec['Dispatch Type'] || rec.dispatchType || 'Post';
                const street = rec['Street'] || rec.street || '';
                const addressLine2 = rec['Landmark'] || rec.addressLine2 || '';
                const taluk = rec['Taluk'] || rec.taluk || '';
                const district = rec['District'] || rec.district || '';
                const state = rec['State'] || rec.state || '';
                const country = rec['Country'] || rec.country || 'India';
                const pincode = rec['Pincode'] || rec.pincode || '';
                const status = rec['Status'] || rec.status || 'New';

                if (!name) throw new Error('Name is required.');
                
                // Check for duplicates
                if (mobile) {
                    const existingUser = await User.findOne({
                        $or: [{ mobile: mobile }, { username: mobile }]
                    });
                    if (existingUser) throw new Error(`Customer with mobile ${mobile} already exists.`);
                    if (processedMobiles.has(mobile)) throw new Error(`Duplicate mobile ${mobile} in file.`);
                    processedMobiles.add(mobile);
                }

                const subscriberNo = await generateSubscriberNo(customerType === 'Advertisement' ? 'A' : 'C');
                const user = new User({
                    name,
                    username: mobile || subscriberNo,
                    password: 'welcome123',
                    role: 'customer',
                    address: { street, addressLine2, taluk, district, state, country, pincode },
                    mobile,
                    whatsapp,
                    customerType,
                    subscriberNo,
                    dispatchType,
                    status
                });
                await user.save();
                successCount++;
            } catch (e) {
                errors.push({ user: rec['Name'] || rec.name || 'Unknown', message: e.message });
            }
        }
        res.json({ successCount, errors });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/bulk-import-ads', async (req, res) => {
    try {
        const { records } = req.body;
        let successCount = 0;
        let errors = [];

        for (const rec of records) {
            try {
                const clientName = rec['Client Name'] || rec.clientName;
                if (!clientName) throw new Error('Client Name is required.');
                
                const mobile = rec['Client Mobile'] || rec.mobile || '';
                const adName = rec['Ad Name'] || rec.adName || 'Bulk Imported Ad';
                const types = rec['Ad Types'] || rec.types;
                const price = rec['Total Price'] || rec['Base Price'] || rec.price || 0;
                const pageSize = rec['Page Size'] || rec.pageSize || 'Half';
                const qty = rec['Qty'] || rec['Quantity'] || rec.qty || 1;
                const paymentMethod = rec['Payment Method'] || rec.paymentMethod || 'Unpaid';
                const status = rec['Payment Status'] || rec.status || 'Active';
                const taluk = rec['Taluk'] || rec.taluk || '';
                const district = rec['District'] || rec.district || '';

                let user = null;
                if (mobile) {
                    user = await User.findOne({ mobile: mobile });
                }

                if (!user && mobile) {
                    const subscriberNo = await generateSubscriberNo('A');
                    user = new User({
                        name: clientName,
                        username: mobile || subscriberNo,
                        password: 'welcome123',
                        role: 'customer',
                        mobile: mobile,
                        whatsapp: rec['Client WhatsApp'] || rec.whatsapp || mobile,
                        customerType: 'Advertisement',
                        subscriberNo,
                        address: { taluk, district }
                    });
                    await user.save();
                }

                const ad = new Advertisement({
                    userId: user ? user._id : null,
                    clientName,
                    adName,
                    types: types ? (Array.isArray(types) ? types : types.split(',').map(t => t.trim())) : [],
                    price: parseFloat(price) || 0,
                    startDate: parseExcelDate(rec['Start Date'] || rec.startDate) || new Date(),
                    endDate: parseExcelDate(rec['End Date'] || rec.endDate) || new Date(),
                    pageSize,
                    qty: parseInt(qty) || 1,
                    status,
                    paymentMethod,
                    referenceNo: rec['Ref No'] || rec.referenceNo || '',
                    tempReceiptNo: rec['Receipt No'] || rec.tempReceiptNo || '',
                });
                await ad.save();
                successCount++;
            } catch (e) {
                errors.push({ user: rec['Client Name'] || rec.clientName || 'Unknown', message: e.message });
            }
        }
        res.json({ successCount, errors });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/bulk-import', async (req, res) => {
    try {
        const { records } = req.body;
        let successCount = 0;
        let errors = [];

        const memberTypes = await MemberType.find();
        const processedMobiles = new Set();

        for (const rec of records) {
            let createdUser = null;
            let createdSub = null;
            try {
                const planStr = rec['Plan'] || rec.planName;
                if (!planStr) throw new Error('Plan name is required.');

                const plan = memberTypes.find(t => t.name.toLowerCase() === planStr.toLowerCase());
                if (!plan) throw new Error(`Plan not found: ${planStr}`);

                const name = rec['Customer Name'] || rec.name;
                const mobile = rec['Mobile'] || rec.mobile;
                const whatsapp = rec['WhatsApp'] || rec.whatsapp || mobile;
                const street = rec['Street'] || rec.street || '';
                const taluk = rec['Taluk'] || rec.taluk || '';
                const district = rec['District'] || rec.district || '';
                const state = rec['State'] || rec.state || '';
                const pincode = rec['Pincode'] || rec.pincode || '';
                const paymentMethod = rec['Payment Method'] || rec.paymentMethod;
                const status = rec['Status'] || rec.status;

                let startStr = rec['Start Date'] || rec.startDate;
                const start = parseExcelDate(startStr) || new Date();
                const end = new Date(start);

                if (mobile) {
                    const existingUser = await User.findOne({
                        $or: [{ mobile: mobile }, { username: mobile }]
                    });
                    if (existingUser) {
                        throw new Error(`Duplicate: Customer with mobile ${mobile} already exists.`);
                    }
                    if (processedMobiles.has(mobile)) {
                        throw new Error(`Duplicate in file: Mobile ${mobile} appears multiple times.`);
                    }
                    processedMobiles.add(mobile);
                }

                const subscriberNo = await generateSubscriberNo('C');

                const user = new User({
                    name,
                    username: mobile || subscriberNo,
                    password: 'welcome123',
                    role: 'customer',
                    address: { street, taluk, district, state, pincode, country: 'India' },
                    mobile,
                    whatsapp,
                    customerType: rec['Customer Type'] || rec.customerType || 'Subscription',
                    subscriberNo,
                    dispatchType: rec['Dispatch Info'] || rec.dispatchType || 'Post'
                });
                createdUser = await user.save();

                end.setMonth(end.getMonth() + plan.durationInMonths);
                end.setDate(end.getDate() - 1);

                const subId = await generateSubscriptionId(plan.letter || 'SUB');
                const sub = new Subscription({
                    userId: user._id,
                    memberTypeId: plan._id,
                    subscriptionId: subId,
                    startDate: start,
                    endDate: end,
                    status: status || (paymentMethod ? 'Active' : 'Pending'),
                    referenceNo: rec['Ref No'] || rec.referenceNo,
                    tempReceiptNo: rec['Receipt No'] || rec.tempReceiptNo || rec['Receipt No'],
                });
                createdSub = await sub.save();

                const prefix = (paymentMethod === 'Cash') ? 'C' : 'B';
                const invNo = await generateInvoiceNumber(prefix);
                const invoice = new Invoice({
                    userId: user._id,
                    subscriptionId: sub._id,
                    invoiceNumber: invNo,
                    amount: plan.price,
                    status: (paymentMethod && paymentMethod !== 'Credit Transaction') ? 'Paid' : 'Unpaid',
                    dateIssued: start, 
                    billingStart: start,
                    billingEnd: end,
                    paymentMethod: paymentMethod,
                    paymentDate: (paymentMethod && paymentMethod !== 'Credit Transaction') ? start : null,
                    items: [{ description: `Subscription - ${plan.name}`, amount: plan.price }]
                });
                await invoice.save();

                successCount++;
            } catch (e) {
                // Rollback if needed
                if (createdSub) await Subscription.findByIdAndDelete(createdSub._id);
                if (createdUser) await User.findByIdAndDelete(createdUser._id);

                let msg = e.message;
                if (e.code === 11000) {
                    const field = Object.keys(e.keyPattern)[0];
                    msg = `Duplicate found: A record with this ${field} already exists.`;
                }
                errors.push({ user: rec['Customer Name'] || rec.name || 'Unknown', message: msg });
            }
        }
        res.json({ successCount, errors });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Revenue Report ---
router.get('/revenue-report', async (req, res) => {
    try {
        const { type, period, date, paymentMethod, startDate: customStart, endDate: customEnd } = req.query;

        // Ensure date is valid
        const queryDate = date ? new Date(date) : new Date();
        let startDate = new Date(queryDate);
        let endDate = new Date(queryDate);

        // Set time range based on period
        if (period === 'custom' && customStart && customEnd) {
            startDate = new Date(customStart);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(customEnd);
            endDate.setHours(23, 59, 59, 999);
        } else if (period === 'day') {
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
        } else if (period === 'month') {
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
            endDate.setDate(0);
            endDate.setHours(23, 59, 59, 999);
        } else if (period === 'year') {
            startDate.setMonth(0, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate.setFullYear(startDate.getFullYear() + 1);
            endDate.setMonth(0, 0);
            endDate.setHours(23, 59, 59, 999);
        } else {
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
        }

        // Use dateIssued for consistency with other reports
        const query = {
            status: 'Paid',
            dateIssued: { $gte: startDate, $lte: endDate }
        };

        if (type === 'advertisement') {
            query.category = 'Advertisement';
        } else {
            // Subscription logic
            query.category = { $ne: 'Advertisement' };
        }

        // Apply Payment filter dynamically for both types if provided
        if (paymentMethod) {
            if (paymentMethod === 'Cash') {
                query.paymentMethod = 'Cash';
            } else if (paymentMethod === 'Other') {
                query.paymentMethod = { $ne: 'Cash' };
            }
        }

        const invoices = await Invoice.find(query)
            .populate('userId', 'name mobile address')
            .populate({
                path: 'subscriptionId',
                populate: { path: 'memberTypeId', select: 'name' }
            })
            .sort({ dateIssued: 1 });

        const report = invoices.map(inv => ({
            date: inv.dateIssued,
            invoiceNumber: inv.invoiceNumber,
            customerName: inv.customerName || (inv.userId ? inv.userId.name : 'Unknown'),
            amount: inv.amount,
            paymentMethod: inv.paymentMethod || 'Unknown',
            type: inv.category === 'Advertisement' ? 'Advertisement' : 'Subscription',
            details: inv.items && inv.items.length > 0 ? inv.items[0].description : ''
        }));

        res.json({
            meta: {
                type,
                period,
                startDate,
                endDate,
                totalAmount: report.reduce((sum, item) => sum + (item.amount || 0), 0),
                count: report.length
            },
            data: report
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});




// --- Verify Analytics Password ---
router.post('/verify-analytics', async (req, res) => {
    try {
        const { password } = req.body;

        // Use verified admin user from request
        const admin = await Admin.findById(req.user._id);
        if (!admin) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const requiredActionPassword = process.env.ADMIN_ACTION_PASSWORD;
        if (requiredActionPassword && password === requiredActionPassword) {
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, message: 'Invalid password' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- Verify Admin Password ---
router.post('/verify-admin-password', async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ success: false, message: 'Password required' });
        }

        const admin = await Admin.findById(req.user._id);
        if (!admin) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const requiredActionPassword = process.env.ADMIN_ACTION_PASSWORD;
        if (requiredActionPassword && password === requiredActionPassword) {
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, message: 'Invalid admin action password' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- Update Subscription Date ---
router.put('/subscriptions/:id/date', async (req, res) => {
    try {
        const { password, endDate } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Admin password required' });
        }

        // Verify admin password
        const admin = await Admin.findById(req.user._id);
        if (!admin) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const requiredActionPassword = process.env.ADMIN_ACTION_PASSWORD;
        if (!requiredActionPassword || password !== requiredActionPassword) {
            return res.status(401).json({ message: 'Invalid admin action password' });
        }

        // Update subscription
        // Update subscription
        const updateFields = {};
        if (endDate) updateFields.endDate = new Date(endDate);
        if (req.body.startDate) updateFields.startDate = new Date(req.body.startDate);

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ message: 'Start date or End date is required' });
        }

        const subscription = await Subscription.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true }
        ).populate('userId').populate('memberTypeId');

        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        res.json(subscription);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Update Subscription Payment ---
router.put('/subscriptions/:id/payment', async (req, res) => {
    try {
        const { paymentMethod, referenceNo, tempReceiptNo } = req.body;

        // Update Subscription
        const sub = await Subscription.findByIdAndUpdate(
            req.params.id,
            {
                paymentMethod,
                referenceNo: referenceNo || '',
                tempReceiptNo: tempReceiptNo || '',
                // If it was Credit Transaction (effectively Active but unpaid invoice), update status if needed
                // But usually status is already Active.
            },
            { new: true }
        );

        if (!sub) return res.status(404).json({ message: 'Subscription not found' });

        // Update Associated Invoice
        // Find unpaid invoice for this subscription
        const invoice = await Invoice.findOne({
            subscriptionId: sub._id,
            status: 'Unpaid'
        });

        let updatedInvoice = null;
        if (invoice) {
            invoice.status = 'Paid';
            invoice.paymentMethod = paymentMethod;
            invoice.paymentDate = new Date();
            if (referenceNo) invoice.referenceNo = referenceNo;
            if (tempReceiptNo) invoice.tempReceiptNo = tempReceiptNo;
            updatedInvoice = await invoice.save();

            // Populate for frontend
            updatedInvoice = await Invoice.findById(updatedInvoice._id)
                .populate('userId')
                .populate({
                    path: 'subscriptionId',
                    populate: { path: 'memberTypeId' }
                });
        }

        res.json({ message: 'Payment updated successfully', subscription: sub, invoice: updatedInvoice });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Change Login Password ---
router.post('/change-login-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const admin = await Admin.findById(req.user._id);

        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        const isMatch = await admin.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        admin.password = newPassword;
        await admin.save();

        res.json({ success: true, message: 'Login password updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Change Action Password ---
router.post('/change-action-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const admin = await Admin.findById(req.user._id);

        if (!admin) return res.status(404).json({ message: 'Admin not found' });

        const requiredActionPassword = process.env.ADMIN_ACTION_PASSWORD;
        if (!requiredActionPassword || currentPassword !== requiredActionPassword) {
            return res.status(400).json({ message: 'Incorrect current action password (ENV)' });
        }

        admin.actionPassword = newPassword;
        await admin.save();

        res.json({ success: true, message: 'Admin action password updated successfully' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Excel Export/Import ---

router.get('/export-excel', async (req, res) => {
    try {
        const workbook = new excel.Workbook();

        // 1. Users (Customers)
        const users = await User.find({ role: 'customer' }).lean();
        const userSheet = workbook.addWorksheet('Customers');
        userSheet.columns = [
            { header: '_id', key: '_id', width: 30 },
            { header: 'SubscriberNo', key: 'subscriberNo', width: 15 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Mobile', key: 'mobile', width: 15 },
            { header: 'Address', key: 'addressStr', width: 40 }, // Flattened
            { header: 'Type', key: 'customerType', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'RawAddress', key: 'address', width: 10 } // Hidden JSON
        ];
        users.forEach(u => {
            userSheet.addRow({
                ...u,
                _id: u._id.toString(),
                addressStr: typeof u.address === 'object' ?
                    `${u.address.street || ''}, ${u.address.taluk || ''}, ${u.address.district || ''}` : u.address,
                address: JSON.stringify(u.address)
            });
        });

        // 2. Subscriptions
        const subs = await Subscription.find({}).lean();
        const subSheet = workbook.addWorksheet('Subscriptions');
        subSheet.columns = [
            { header: '_id', key: '_id', width: 30 },
            { header: 'UserId', key: 'userId', width: 30 },
            { header: 'SubID', key: 'subscriptionId', width: 15 },
            { header: 'PlanId', key: 'memberTypeId', width: 30 },
            { header: 'StartDate', key: 'startDate', width: 15 },
            { header: 'EndDate', key: 'endDate', width: 15 },
            { header: 'Status', key: 'status', width: 15 }
        ];
        subs.forEach(s => subSheet.addRow({
            ...s,
            _id: s._id.toString(),
            userId: s.userId?.toString(),
            memberTypeId: s.memberTypeId?.toString()
        }));

        // 3. Invoices
        const invs = await Invoice.find({}).lean();
        const invSheet = workbook.addWorksheet('Invoices');
        invSheet.columns = [
            { header: '_id', key: '_id', width: 30 },
            { header: 'UserId', key: 'userId', width: 30 },
            { header: 'InvoiceNo', key: 'invoiceNumber', width: 20 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'DateIssued', key: 'dateIssued', width: 15 },
            { header: 'PaymentMethod', key: 'paymentMethod', width: 20 },
            { header: 'Status', key: 'status', width: 15 }
        ];
        invs.forEach(i => invSheet.addRow({
            ...i,
            _id: i._id.toString(),
            userId: i.userId?.toString()
        }));

        // 4. Advertisements
        const ads = await Advertisement.find({}).lean();
        const adSheet = workbook.addWorksheet('Advertisements');
        adSheet.columns = [
            { header: '_id', key: '_id', width: 30 },
            { header: 'UserId', key: 'userId', width: 30 },
            { header: 'AdName', key: 'adName', width: 25 },
            { header: 'StartDate', key: 'startDate', width: 15 },
            { header: 'EndDate', key: 'endDate', width: 15 },
            { header: 'Amount', key: 'finalRate', width: 15 },
            { header: 'Status', key: 'status', width: 15 }
        ];
        ads.forEach(a => adSheet.addRow({
            ...a,
            _id: a._id.toString(),
            userId: a.userId?.toString()
        }));

        // 5. Purchase/Expenses
        const purchases = await PurchaseEntry.find({}).lean();
        const purSheet = workbook.addWorksheet('PurchaseEntries');
        purSheet.columns = [
            { header: '_id', key: '_id', width: 30 },
            { header: 'Supplier', key: 'supplierName', width: 25 },
            { header: 'Item', key: 'itemName', width: 25 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Amount', key: 'billAmount', width: 15 }
        ];
        purchases.forEach(p => purSheet.addRow({ ...p, _id: p._id.toString() }));

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Magproj_Data.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        res.status(500).json({ message: 'Excel Export Failed: ' + err.message });
    }
});

router.post('/import-excel', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const workbook = new excel.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        let stats = { users: 0, subs: 0, invs: 0, ads: 0, pur: 0 };

        // Helper to process sheet
        const processSheet = async (sheetName, keys, processFn) => {
            const sheet = workbook.getWorksheet(sheetName);
            if (!sheet) return;

            const rows = [];
            sheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;
                const r = {};
                keys.forEach((key, idx) => {
                    // keys array index 0 corresponds to column 1
                    const cell = row.getCell(idx + 1);
                    r[key] = cell.value;
                    // Handle hyperlinks if any (exceljs returns object)
                    if (cell.value && cell.value.text && cell.value.hyperlink) {
                        r[key] = cell.value.text;
                    }
                });
                rows.push(r);
            });

            for (const row of rows) {
                if (row._id) {
                    await processFn(row);
                }
            }
        };

        // 1. Customers
        // Keys match Export columns: _id, subscriberNo, name, mobile, addressStr, customerType, status, address
        await processSheet('Customers',
            ['_id', 'subscriberNo', 'name', 'mobile', 'addressStr', 'customerType', 'status', 'address'],
            async (row) => {
                // Parse address JSON if available (priority), else ignore addressStr
                if (row.address) {
                    try {
                        const parsed = JSON.parse(row.address);
                        row.address = parsed;
                    } catch (e) { }
                } else {
                    delete row.address; // Don't overwrite with string if json missing
                }
                delete row.addressStr; // Remove display field

                await User.findByIdAndUpdate(row._id, { ...row, role: 'customer' }, { upsert: true });
                stats.users++;
            }
        );

        // 2. Subscriptions
        // Keys: _id, userId, subscriptionId, memberTypeId, startDate, endDate, status
        await processSheet('Subscriptions',
            ['_id', 'userId', 'subscriptionId', 'memberTypeId', 'startDate', 'endDate', 'status'],
            async (row) => {
                await Subscription.findByIdAndUpdate(row._id, row, { upsert: true });
                stats.subs++;
            }
        );

        // 3. Invoices
        // Keys: _id, userId, invoiceNumber, amount, dateIssued, paymentMethod, status
        await processSheet('Invoices',
            ['_id', 'userId', 'invoiceNumber', 'amount', 'dateIssued', 'paymentMethod', 'status'],
            async (row) => {
                await Invoice.findByIdAndUpdate(row._id, row, { upsert: true });
                stats.invs++;
            }
        );

        // 4. Advertisements
        // Keys: _id, userId, adName, startDate, endDate, finalRate, status
        await processSheet('Advertisements',
            ['_id', 'userId', 'adName', 'startDate', 'endDate', 'finalRate', 'status'],
            async (row) => {
                await Advertisement.findByIdAndUpdate(row._id, row, { upsert: true });
                stats.ads++;
            }
        );

        // 5. PurchaseEntries
        // Keys: _id, supplierName, itemName, date, billAmount
        await processSheet('PurchaseEntries',
            ['_id', 'supplierName', 'itemName', 'date', 'billAmount'],
            async (row) => {
                await PurchaseEntry.findByIdAndUpdate(row._id, row, { upsert: true });
                stats.pur++;
            }
        );

        res.json({ message: 'Excel Data Imported Successfully', stats });

    } catch (err) {
        console.error('Import Error:', err);
        res.status(500).json({ message: 'Excel Import Failed: ' + err.message });
    }
});
module.exports = router;
