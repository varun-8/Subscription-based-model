const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Admin = require('./models/Admin');
const User = require('./models/User');
const MemberType = require('./models/MemberType');
const Magazine = require('./models/Magazine');
const Subscription = require('./models/Subscription');
const Invoice = require('./models/Invoice');
const AdType = require('./models/AdType');
const Advertisement = require('./models/Advertisement');
const Inventory = require('./models/Inventory');
const PurchaseEntry = require('./models/PurchaseEntry');
const CourierEntry = require('./models/CourierEntry');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/magazine_erp';
const ADMIN_ACTION_PASSWORD = process.env.ADMIN_ACTION_PASSWORD || 'AACHI@123';

async function seed() {
    console.log(`\n🌱 Connecting to MongoDB: ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully.\n');

    try {
        // 1. Admin Account
        console.log('--- Checking Admin Account ---');
        let admin = await Admin.findOne();
        if (!admin) {
            admin = new Admin({
                name: 'Administrator',
                username: 'admin',
                password: 'password123',
                actionPassword: ADMIN_ACTION_PASSWORD
            });
            await admin.save();
            console.log('✅ Created default Admin account:');
            console.log('   Username: admin');
            console.log('   Password: password123');
            console.log(`   Action Password: ${ADMIN_ACTION_PASSWORD}`);
        } else {
            console.log(`ℹ️ Admin already exists: ${admin.username} (${admin.name})`);
        }

        // 2. Member Types (Subscription Plans)
        console.log('\n--- Seeding Member Types (Plans) ---');
        const memberTypesData = [
            { name: 'Annual Membership', durationInMonths: 12, price: 500, letter: 'A', description: '1 Year (12 monthly editions)' },
            { name: '3-Year Membership', durationInMonths: 36, price: 1400, letter: 'B', description: '3 Years (36 monthly editions) with 10% discount' },
            { name: '5-Year Membership', durationInMonths: 60, price: 2200, letter: 'C', description: '5 Years (60 monthly editions) with 15% discount' },
            { name: 'Life Membership', durationInMonths: 120, price: 5000, letter: 'L', description: '10 Years Life Membership' }
        ];

        const savedMemberTypes = [];
        for (const plan of memberTypesData) {
            let mt = await MemberType.findOne({ name: plan.name });
            if (!mt) {
                mt = await MemberType.create(plan);
                console.log(`  + Created MemberType: ${mt.name} (Letter: ${mt.letter}, ₹${mt.price})`);
            } else {
                console.log(`  ℹ️ MemberType already exists: ${mt.name}`);
            }
            savedMemberTypes.push(mt);
        }

        // 3. Magazines
        console.log('\n--- Seeding Magazines ---');
        const magazineData = [
            {
                title: 'Aachi Vanthachu - Monthly Magazine',
                description: 'Monthly cultural, lifestyle, and heritage magazine for Nagarathaar & Tamil families worldwide.',
                price: 50,
                category: 'Culture & Heritage',
                periodicity: 'Monthly'
            },
            {
                title: 'Aachi Vanthachu - Deepam Festival Edition',
                description: 'Special annual bumper issue featuring devotional and heritage articles.',
                price: 100,
                category: 'Festival Special',
                periodicity: 'Quarterly'
            }
        ];

        const savedMagazines = [];
        for (const mag of magazineData) {
            let m = await Magazine.findOne({ title: mag.title });
            if (!m) {
                m = await Magazine.create(mag);
                console.log(`  + Created Magazine: ${m.title}`);
            } else {
                console.log(`  ℹ️ Magazine already exists: ${m.title}`);
            }
            savedMagazines.push(m);
        }

        // 4. Ad Types
        console.log('\n--- Seeding Ad Types ---');
        const adTypesData = [
            { name: 'Full Page Color', description: 'Full page inside color advertisement (A4)' },
            { name: 'Half Page Color', description: 'Half page horizontal or vertical color advertisement' },
            { name: 'Quarter Page', description: 'Quarter page box advertisement' },
            { name: 'Back Cover Page', description: 'Prime spot full back cover glossy print' },
            { name: 'Front Inside Cover', description: 'Page 2 prime placement inside front cover' }
        ];

        const savedAdTypes = [];
        for (const adType of adTypesData) {
            let at = await AdType.findOne({ name: adType.name });
            if (!at) {
                at = await AdType.create(adType);
                console.log(`  + Created AdType: ${at.name}`);
            } else {
                console.log(`  ℹ️ AdType already exists: ${at.name}`);
            }
            savedAdTypes.push(at);
        }

        // 5. Customers / Subscribers
        console.log('\n--- Seeding Customers & Subscribers ---');
        const sampleCustomers = [
            {
                name: 'R. Meenakshisundaram',
                username: '9840123456',
                mobile: '9840123456',
                whatsapp: '9840123456',
                subscriberNo: 'C01',
                customerType: 'Subscription',
                dispatchType: 'Courier',
                role: 'customer',
                address: {
                    street: '14, Kovilur Road',
                    addressLine2: 'Near Sri Meenakshi Sundareswarar Temple',
                    taluk: 'Karaikudi',
                    district: 'Sivagangai',
                    state: 'Tamil Nadu',
                    country: 'India',
                    pincode: '630001'
                }
            },
            {
                name: 'S. Palaniappan Chettiar',
                username: '9841234567',
                mobile: '9841234567',
                whatsapp: '9841234567',
                subscriberNo: 'C02',
                customerType: 'Subscription',
                dispatchType: 'Post',
                role: 'customer',
                address: {
                    street: '42, Sivan Koil Street',
                    addressLine2: 'Old Bazaar',
                    taluk: 'Devakottai',
                    district: 'Sivagangai',
                    state: 'Tamil Nadu',
                    country: 'India',
                    pincode: '630302'
                }
            },
            {
                name: 'Dr. M. Alagappan',
                username: '9444012345',
                mobile: '9444012345',
                whatsapp: '9444012345',
                subscriberNo: 'C03',
                customerType: 'Subscription',
                dispatchType: 'Courier',
                role: 'customer',
                address: {
                    street: '28, Luz Church Road',
                    addressLine2: 'Mylapore',
                    taluk: 'Mylapore',
                    district: 'Chennai',
                    state: 'Tamil Nadu',
                    country: 'India',
                    pincode: '600004'
                }
            },
            {
                name: 'Lakshmi Aachi',
                username: '9789012345',
                mobile: '9789012345',
                whatsapp: '9789012345',
                subscriberNo: 'C04',
                customerType: 'Subscription',
                dispatchType: 'Post',
                role: 'customer',
                address: {
                    street: '15, West Club Road',
                    addressLine2: 'Race Course',
                    taluk: 'Coimbatore South',
                    district: 'Coimbatore',
                    state: 'Tamil Nadu',
                    country: 'India',
                    pincode: '641018'
                }
            },
            {
                name: 'Sri Meenakshi Silks (P) Ltd',
                username: '9842100001',
                mobile: '9842100001',
                whatsapp: '9842100001',
                subscriberNo: 'A01',
                customerType: 'Advertisement',
                dispatchType: 'Courier',
                adType: 'Full Page Color',
                role: 'customer',
                address: {
                    street: '88, South Masi Street',
                    addressLine2: 'Near Meenakshi Amman Temple',
                    taluk: 'Madurai South',
                    district: 'Madurai',
                    state: 'Tamil Nadu',
                    country: 'India',
                    pincode: '625001'
                }
            },
            {
                name: 'Pillaiyarpatti Sri Karpaga Vinayagar Kovil Devasthanam',
                username: '04577264240',
                mobile: '9443123456',
                whatsapp: '9443123456',
                subscriberNo: 'C05',
                customerType: 'Kovil',
                dispatchType: 'Post',
                role: 'customer',
                address: {
                    street: 'Kovil Sannathi Street',
                    addressLine2: 'Pillaiyarpatti',
                    taluk: 'Thiruppathur',
                    district: 'Sivagangai',
                    state: 'Tamil Nadu',
                    country: 'India',
                    pincode: '630207'
                }
            },
            {
                name: 'Chennai Nagarathaar Sangam',
                username: '9840998877',
                mobile: '9840998877',
                whatsapp: '9840998877',
                subscriberNo: 'C06',
                customerType: 'Nagarathaar Sangam',
                dispatchType: 'Courier',
                role: 'customer',
                address: {
                    street: '22, Venkatnarayana Road',
                    addressLine2: 'T. Nagar',
                    taluk: 'Mambalam',
                    district: 'Chennai',
                    state: 'Tamil Nadu',
                    country: 'India',
                    pincode: '600017'
                }
            }
        ];

        const savedUsers = [];
        for (const cust of sampleCustomers) {
            let u = await User.findOne({ subscriberNo: cust.subscriberNo });
            if (!u) {
                u = new User(cust);
                await u.save();
                console.log(`  + Created Customer: ${u.name} (SubNo: ${u.subscriberNo}, Type: ${u.customerType})`);
            } else {
                console.log(`  ℹ️ Customer already exists: ${u.name} (${u.subscriberNo})`);
            }
            savedUsers.push(u);
        }

        // 6. Subscriptions
        console.log('\n--- Seeding Subscriptions ---');
        const now = new Date();
        const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        const threeYearsLater = new Date(now.getFullYear() + 3, now.getMonth(), now.getDate());
        const pastDate = new Date(now.getFullYear() - 1, now.getMonth() - 2, 1);
        const expiredDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);

        const subscriptionsData = [
            {
                userId: savedUsers[0]._id, // R. Meenakshisundaram
                magazineId: savedMagazines[0]._id,
                memberTypeId: savedMemberTypes[0]._id, // Annual
                subscriptionId: 'SUB01',
                status: 'Active',
                startDate: now,
                endDate: oneYearLater,
                paymentStatus: 'Paid',
                paymentMethod: 'GPay',
                referenceNo: 'UPI/2026/894712',
                tempReceiptNo: 'TR-101'
            },
            {
                userId: savedUsers[1]._id, // S. Palaniappan
                magazineId: savedMagazines[0]._id,
                memberTypeId: savedMemberTypes[1]._id, // 3-Year
                subscriptionId: 'SUB02',
                status: 'Active',
                startDate: now,
                endDate: threeYearsLater,
                paymentStatus: 'Paid',
                paymentMethod: 'Cash',
                referenceNo: 'CASH-REC-042',
                tempReceiptNo: 'TR-102'
            },
            {
                userId: savedUsers[2]._id, // Dr. M. Alagappan
                magazineId: savedMagazines[0]._id,
                memberTypeId: savedMemberTypes[3]._id, // Life
                subscriptionId: 'SUB03',
                status: 'Active',
                startDate: now,
                endDate: new Date(now.getFullYear() + 10, now.getMonth(), now.getDate()),
                paymentStatus: 'Paid',
                paymentMethod: 'Account Transfer - NEFT',
                referenceNo: 'NEFT-IOB-998811',
                tempReceiptNo: 'TR-103'
            },
            {
                userId: savedUsers[3]._id, // Lakshmi Aachi (Expired)
                magazineId: savedMagazines[0]._id,
                memberTypeId: savedMemberTypes[0]._id,
                subscriptionId: 'SUB04',
                status: 'Expired',
                startDate: pastDate,
                endDate: expiredDate,
                paymentStatus: 'Paid',
                paymentMethod: 'Money Order',
                referenceNo: 'MO-887123',
                tempReceiptNo: 'TR-088'
            },
            {
                userId: savedUsers[5]._id, // Kovil
                magazineId: savedMagazines[0]._id,
                memberTypeId: savedMemberTypes[2]._id, // 5-Year
                subscriptionId: 'SUB05',
                status: 'Active',
                startDate: now,
                endDate: new Date(now.getFullYear() + 5, now.getMonth(), now.getDate()),
                paymentStatus: 'Paid',
                paymentMethod: 'Account Transfer - Cheque',
                referenceNo: 'CHQ-554433',
                tempReceiptNo: 'TR-104'
            }
        ];

        const savedSubs = [];
        for (const subData of subscriptionsData) {
            let sub = await Subscription.findOne({ subscriptionId: subData.subscriptionId });
            if (!sub) {
                sub = await Subscription.create(subData);
                console.log(`  + Created Subscription: ${sub.subscriptionId} (${sub.status})`);
            } else {
                console.log(`  ℹ️ Subscription already exists: ${sub.subscriptionId}`);
            }
            savedSubs.push(sub);
        }

        // 7. Invoices
        console.log('\n--- Seeding Invoices ---');
        const invoicesData = [
            {
                userId: savedUsers[0]._id,
                customerName: savedUsers[0].name,
                category: 'Subscription',
                subscriptionId: savedSubs[0]?._id,
                invoiceNumber: 'INV-000001',
                billingStart: now,
                billingEnd: oneYearLater,
                amount: 500,
                status: 'Paid',
                paymentMethod: 'GPay',
                referenceNo: 'UPI/2026/894712',
                items: [{ description: 'Annual Subscription (12 Issues)', amount: 500 }],
                dateIssued: now,
                paymentDate: now
            },
            {
                userId: savedUsers[1]._id,
                customerName: savedUsers[1].name,
                category: 'Subscription',
                subscriptionId: savedSubs[1]?._id,
                invoiceNumber: 'INV-000002',
                billingStart: now,
                billingEnd: threeYearsLater,
                amount: 1400,
                status: 'Paid',
                paymentMethod: 'Cash',
                referenceNo: 'CASH-REC-042',
                items: [{ description: '3-Year Membership (36 Issues)', amount: 1400 }],
                dateIssued: now,
                paymentDate: now
            },
            {
                userId: savedUsers[2]._id,
                customerName: savedUsers[2].name,
                category: 'Subscription',
                subscriptionId: savedSubs[2]?._id,
                invoiceNumber: 'INV-000003',
                billingStart: now,
                billingEnd: new Date(now.getFullYear() + 10, now.getMonth(), now.getDate()),
                amount: 5000,
                status: 'Paid',
                paymentMethod: 'Account Transfer - NEFT',
                referenceNo: 'NEFT-IOB-998811',
                items: [{ description: 'Life Membership (10 Years)', amount: 5000 }],
                dateIssued: now,
                paymentDate: now
            },
            {
                userId: savedUsers[4]._id, // Sri Meenakshi Silks
                customerName: savedUsers[4].name,
                category: 'Advertisement',
                invoiceNumber: 'INV-000004',
                billingStart: now,
                billingEnd: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
                amount: 15000,
                status: 'Paid',
                paymentMethod: 'Account Transfer - NEFT',
                referenceNo: 'NEFT-SBI-443322',
                items: [{ description: 'Full Page Color Advertisement - Monthly Edition', amount: 15000 }],
                dateIssued: now,
                paymentDate: now
            }
        ];

        for (const invData of invoicesData) {
            let inv = await Invoice.findOne({ invoiceNumber: invData.invoiceNumber });
            if (!inv) {
                inv = await Invoice.create(invData);
                console.log(`  + Created Invoice: ${inv.invoiceNumber} (₹${inv.amount} - ${inv.status})`);
            } else {
                console.log(`  ℹ️ Invoice already exists: ${inv.invoiceNumber}`);
            }
        }

        // 8. Advertisements
        console.log('\n--- Seeding Advertisements ---');
        const adsData = [
            {
                clientName: 'Sri Meenakshi Silks (P) Ltd',
                adName: 'Deepavali Festive Silk Saree Collection 2026',
                types: ['Full Page Color'],
                typeAmounts: [{ name: 'Full Page Color', amount: 15000 }],
                price: 15000,
                startDate: now,
                endDate: new Date(now.getFullYear(), now.getMonth() + 2, now.getDate()),
                status: 'Active',
                paymentMethod: 'Account Transfer - NEFT',
                paymentDate: now,
                referenceNo: 'NEFT-SBI-443322',
                userId: savedUsers[4]._id,
                pageSize: 'A4 Full Page',
                qty: 1,
                content: 'Full page vibrant color ad for wedding silk sarees & dhotis.'
            },
            {
                clientName: 'Vasanth Jewellers',
                adName: 'Traditional Chettinad Gold Jewellery Exhibition',
                types: ['Half Page Color'],
                typeAmounts: [{ name: 'Half Page Color', amount: 8000 }],
                price: 8000,
                startDate: now,
                endDate: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
                status: 'Active',
                paymentMethod: 'GPay',
                paymentDate: now,
                referenceNo: 'UPI/VJ-772299',
                pageSize: 'Half Page',
                qty: 1,
                content: 'Heritage Chettinad jewellery advertisement.'
            }
        ];

        for (const adItem of adsData) {
            let ad = await Advertisement.findOne({ clientName: adItem.clientName, adName: adItem.adName });
            if (!ad) {
                ad = await Advertisement.create(adItem);
                console.log(`  + Created Advertisement: ${ad.clientName} - ${ad.adName} (₹${ad.price})`);
            } else {
                console.log(`  ℹ️ Advertisement already exists: ${ad.clientName}`);
            }
        }

        // 9. Inventory
        console.log('\n--- Seeding Inventory Items ---');
        const inventoryData = [
            {
                itemName: 'Mailing Envelopes (Pack of 1000)',
                category: 'Packaging',
                quantity: 4500,
                unitPrice: 2.5,
                supplier: 'Royal Print & Pack, Sivakasi',
                description: 'Heavy duty brown printed dispatch envelopes with magazine branding.'
            },
            {
                itemName: 'Address Sticker Labels (Roll of 2000)',
                category: 'Stationery',
                quantity: 12,
                unitPrice: 450,
                supplier: 'Barclays Stationers, Madurai',
                description: 'Self-adhesive barcode & subscriber address thermal labels.'
            },
            {
                itemName: 'Glossy Art Paper (80 GSM Reams)',
                category: 'Raw Materials',
                quantity: 150,
                unitPrice: 620,
                supplier: 'Tamil Nadu Newsprint & Papers (TNPL)',
                description: 'High quality paper reams for inside magazine pages.'
            },
            {
                itemName: 'Magazine Copies (Current Month Edition)',
                category: 'Publication Stock',
                quantity: 3200,
                unitPrice: 35,
                supplier: 'Vanthachu Press & Media',
                description: 'Ready-to-dispatch printed copies of the current monthly magazine issue.'
            }
        ];

        for (const inv of inventoryData) {
            let existing = await Inventory.findOne({ itemName: inv.itemName });
            if (!existing) {
                existing = await Inventory.create({ ...inv, lastRestocked: new Date() });
                console.log(`  + Created Inventory: ${existing.itemName} (Qty: ${existing.quantity})`);
            } else {
                console.log(`  ℹ️ Inventory already exists: ${existing.itemName}`);
            }
        }

        // 10. Purchase Entries
        console.log('\n--- Seeding Purchase Entries ---');
        const purchaseData = [
            {
                entryNo: 'PE-001',
                billNo: 'TNPL-INV-9921',
                date: new Date(now.getFullYear(), now.getMonth() - 1, 15),
                billDate: new Date(now.getFullYear(), now.getMonth() - 1, 14),
                enteredBy: 'Administrator',
                supplier: 'Tamil Nadu Newsprint & Papers (TNPL)',
                purchaseCategory: 'Paper Stock',
                modeOfPayment: 'Account Transfer',
                remarks: 'Stock replenishment for upcoming 3 monthly editions',
                items: [
                    { productName: 'Glossy Art Paper 80 GSM', qty: 100, rate: 620, amount: 62000 }
                ],
                billAmount: 62000
            },
            {
                entryNo: 'PE-002',
                billNo: 'RPP-7741',
                date: new Date(now.getFullYear(), now.getMonth() - 1, 20),
                billDate: new Date(now.getFullYear(), now.getMonth() - 1, 19),
                enteredBy: 'Administrator',
                supplier: 'Royal Print & Pack, Sivakasi',
                purchaseCategory: 'Packaging Material',
                modeOfPayment: 'Cheque',
                remarks: 'Printed mailing covers',
                items: [
                    { productName: 'Mailing Envelopes (Pack of 1000)', qty: 5, rate: 2500, amount: 12500 }
                ],
                billAmount: 12500
            }
        ];

        for (const pe of purchaseData) {
            let existing = await PurchaseEntry.findOne({ billNo: pe.billNo });
            if (!existing) {
                existing = await PurchaseEntry.create(pe);
                console.log(`  + Created Purchase Entry: ${existing.billNo} (₹${existing.billAmount})`);
            } else {
                console.log(`  ℹ️ Purchase Entry already exists: ${existing.billNo}`);
            }
        }

        // 11. Courier Entries
        console.log('\n--- Seeding Courier / Dispatch Entries ---');
        const courierData = [
            {
                date: now,
                customerId: savedUsers[0]._id,
                customerName: savedUsers[0].name,
                subscriberNo: savedUsers[0].subscriberNo,
                qty: 1,
                edition: 'Current Month Edition',
                mobile: savedUsers[0].mobile,
                address: '14, Kovilur Road, Karaikudi - 630001',
                remarks: 'Dispatched via Professional Courier (AWB: PR882190)'
            },
            {
                date: now,
                customerId: savedUsers[2]._id,
                customerName: savedUsers[2].name,
                subscriberNo: savedUsers[2].subscriberNo,
                qty: 1,
                edition: 'Current Month Edition',
                mobile: savedUsers[2].mobile,
                address: '28, Luz Church Road, Mylapore, Chennai - 600004',
                remarks: 'Dispatched via ST Courier (AWB: ST441209)'
            }
        ];

        for (const ce of courierData) {
            let existing = await CourierEntry.findOne({ customerName: ce.customerName, edition: ce.edition });
            if (!existing) {
                existing = await CourierEntry.create(ce);
                console.log(`  + Created Courier Entry: ${existing.customerName} (${existing.edition})`);
            } else {
                console.log(`  ℹ️ Courier Entry already exists: ${existing.customerName}`);
            }
        }

        console.log('\n🎉 ====================================================');
        console.log('🎉 Sample data populated successfully into MongoDB!');
        console.log('🎉 ====================================================\n');
        console.log('🔑 Login Credentials:');
        console.log('   Username        : admin');
        console.log('   Password        : password123');
        console.log(`   Action Password : ${ADMIN_ACTION_PASSWORD}`);
        console.log('   Database        : magazine_erp (127.0.0.1:27017)\n');

    } catch (err) {
        console.error('❌ Error during seeding:', err);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB.');
    }
}

seed();
