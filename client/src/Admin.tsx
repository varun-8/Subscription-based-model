import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Styles
import './admin.css';

// Components
import Sidebar from './components/admin/Sidebar';
import DashboardStats from './components/admin/DashboardStats';
import CustomersView from './components/admin/CustomersView';
import SubscriptionsView from './components/admin/SubscriptionsView';
import InvoicesView from './components/admin/InvoicesView';
import MagazinesView from './components/admin/MagazinesView'; // New
import AdvertisementsView from './components/admin/AdvertisementsView';
import AnalyticsView from './components/admin/AnalyticsView';
import CustomerDetailModal from './components/admin/CustomerDetailModal';
import SubscriptionDetailModal from './components/admin/SubscriptionDetailModal';
import CustomerFormModal from './components/admin/CustomerFormModal';
import SubscriptionFormModal from './components/admin/SubscriptionFormModal';
import RenewalModal from './components/admin/RenewalModal';
import MagazineFormModal from './components/admin/MagazineFormModal'; // New
import CategoriesView from './components/admin/MemberTypesView'; // Rename import internally
import MemberTypeFormModal from './components/admin/MemberTypeFormModal';
import AdTypeFormModal from './components/admin/AdTypeFormModal'; // New
import ReportsView from './components/admin/ReportsView';
import Notification from './components/admin/Notification';
import AdvertisementFormModal from './components/admin/AdvertisementFormModal';
import QuickOrderView from './components/admin/QuickOrderView';
import InventoryView from './components/admin/InventoryView';
import ConfirmationModal from './components/admin/ConfirmationModal';
import OrderSuccessModal from './components/admin/OrderSuccessModal'; // New Import
import ErrorModal from './components/admin/ErrorModal';
import DatabaseView from './components/admin/DatabaseView';
import PasswordPromptModal from './components/admin/PasswordPromptModal';
import EditSubscriptionDateModal from './components/admin/EditSubscriptionDateModal';
import LoadingSpinner from './components/admin/LoadingSpinner';
import DetailedBreakdownView from './components/admin/DetailedBreakdownView';



const Admin = () => {
    // --- State ---
    const [stats, setStats] = useState<any>({ totalCustomers: 0, totalSubscribers: 0, activeSubscriptions: 0, renewalNeededSubscriptions: 0, allSubscriptions: 0, revenue: 0 });
    const [view, setView] = useState('dashboard');
    const [data, setData] = useState<any[]>([]);
    const [filter, setFilter] = useState('');
    const [customers, setCustomers] = useState<any[]>([]);
    const [magazines, setMagazines] = useState<any[]>([]);
    const [memberTypes, setMemberTypes] = useState<any[]>([]);
    const [adTypes, setAdTypes] = useState<any[]>([]); // New
    const navigate = useNavigate();

    // Customer Form State
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [customerForm, setCustomerForm] = useState({ name: '', street: '', taluk: '', district: '', state: '', pincode: '', mobile: '', whatsapp: '', customerType: 'Subscription', adType: '' });
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState('');

    // Subscription Form State
    const [showSubForm, setShowSubForm] = useState(false);
    const [subForm, setSubForm] = useState({ userId: '', memberTypeId: '', startDate: '', endDate: '', paymentMethod: '' });

    // Member Type Form State
    const [showMemberTypeForm, setShowMemberTypeForm] = useState(false);
    const [memberTypeForm, setMemberTypeForm] = useState({ name: '', durationInMonths: '', price: '', letter: '', description: '' });
    const [memberTypeEditMode, setMemberTypeEditMode] = useState(false);
    const [memberTypeEditId, setMemberTypeEditId] = useState('');

    // Ad Type Form State
    const [showAdTypeForm, setShowAdTypeForm] = useState(false);
    const [adTypeForm, setAdTypeForm] = useState({ name: '', description: '' });
    const [adTypeEditMode, setAdTypeEditMode] = useState(false);
    const [adTypeEditId, setAdTypeEditId] = useState('');

    // Magazine Form State
    const [showMagForm, setShowMagForm] = useState(false);
    const [magForm, setMagForm] = useState({ title: '', description: '', price: '', category: '', periodicity: 'Monthly', coverImage: '' });
    const [magEditMode, setMagEditMode] = useState(false);
    const [magEditId, setMagEditId] = useState('');

    // Advertisement Form State
    const [showAdForm, setShowAdForm] = useState(false);
    const [adForm, setAdForm] = useState<any>({ clientName: '', adName: '', types: [], price: '', startDate: '', endDate: '', status: 'Active', pageSize: 'Half', qty: 1 });
    const [adEditMode, setAdEditMode] = useState(false);
    const [adEditId, setAdEditId] = useState('');

    // Customer Detail Modal State
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [customerHistory, setCustomerHistory] = useState<any[]>([]);
    const [adHistoryData, setAdHistoryData] = useState<any[] | null>(null); // New state for ad history

    // Filters
    const [subStatusFilter, setSubStatusFilter] = useState('');
    const [subPlanFilter, setSubPlanFilter] = useState(''); // New
    const [subPaymentFilter, setSubPaymentFilter] = useState(''); // New
    const [customerFilterType, setCustomerFilterType] = useState('All');

    // Notification State
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
    const [loading, setLoading] = useState(false);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({
        isOpen: false, title: '', message: '', onConfirm: () => { }
    });

    // Order Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState<{ customerName: string; invoice: any } | null>(null);

    // Error Modal State
    const [errorModal, setErrorModal] = useState<{ isOpen: boolean; title: string; message: string; subErrors?: any[] }>({
        isOpen: false, title: '', message: ''
    });

    // Renewal Modal State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showRenewalModal, setShowRenewalModal] = useState(false);
    const [renewalSubscription, setRenewalSubscription] = useState<any>(null);
    const [renewalFormData, setRenewalFormData] = useState({
        memberTypeId: '',
        startDate: '',
        endDate: '',
        paymentMethod: '',
        referenceNo: '',
        tempReceiptNo: ''
    });

    const [quickOrderInitialStep, setQuickOrderInitialStep] = useState(1);
    const [quickOrderInitialCustomer, setQuickOrderInitialCustomer] = useState<any>(null);
    const [quickOrderSubscriptionToUpdate, setQuickOrderSubscriptionToUpdate] = useState<any>(null);

    // Delete Customer Password State
    const [showDeletePasswordModal, setShowDeletePasswordModal] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

    // Edit Subscription Date Modal State
    const [showEditDateModal, setShowEditDateModal] = useState(false);
    const [subscriptionToEdit, setSubscriptionToEdit] = useState<any>(null);
    const [editDateType, setEditDateType] = useState<'startDate' | 'endDate'>('endDate');

    const [showSubDetailModal, setShowSubDetailModal] = useState(false);
    const [selectedSubscriptionForModal, setSelectedSubscriptionForModal] = useState<any>(null);

    const handleOpenSubDetails = (sub: any) => {
        setSelectedSubscriptionForModal(sub);
        setShowSubDetailModal(true);
    };



    const openConfirm = (title: string, message: string, onConfirm: () => void) => {
        setConfirmModal({ isOpen: true, title, message, onConfirm });
    };

    const closeConfirm = () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        if (type === 'error') {
            setErrorModal({ isOpen: true, title: 'Error Occurred', message });
        } else {
            setNotification({ message, type });
        }
    };

    const handleError = (err: any, defaultMessage: string = 'An error occurred', subErrors?: any[]) => {
        const message = err?.response?.data?.message || err?.message || defaultMessage;
        setErrorModal({
            isOpen: true,
            title: 'Action Failed',
            message,
            subErrors: subErrors || err?.response?.data?.errors
        });
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get('/api/admin/reports/dashboard', { withCredentials: true });
            setStats(res.data);
        } catch (err) {
            // Silently fail or redirect if critical
        }
    };

    const fetchAdCustomerCount = async () => {
        // Analytics data is now fetched as part of fetchStats
        // Will fallback to stats.totalAdCustomers
    };

    // --- Effects ---
    useEffect(() => {
        fetchStats();

        // Listen for automatic backup info from Electron
        if (window.electronAPI && window.electronAPI.onBackupInfo) {
            window.electronAPI.onBackupInfo((info: any) => {
                if (info.success) {
                    showNotification(`Automatic backup successful: ${info.path}`, 'success');
                } else {
                    showNotification(`Automatic backup failed: ${info.error}`, 'error');
                }
            });
        }
    }, []);

    // Refresh stats when entering dashboard or subscriptions view to ensure counts are fresh
    useEffect(() => {
        // Reset filters when changing views
        setFilter('');
        setSubStatusFilter('');
        setSubPlanFilter('');
        setSubPaymentFilter('');
        setCustomerFilterType('All');

        if (view === 'dashboard' || view === 'subscriptions') {
            fetchStats();
        }
    }, [view]);

    // Fetch advertisement customer count from analytics when advertisements view is loaded
    useEffect(() => {
        if (view === 'advertisements') {
            fetchAdCustomerCount();
            if (customers.length === 0) {
                // Fetch subscribers but don't change the view state
                axios.get('/api/admin/subscribers', { withCredentials: true })
                    .then(res => setCustomers(res.data))
                    .catch(err => handleError(err, "Failed to load customers"));
            }
        }
    }, [view]);

    useEffect(() => {
        if ((view === 'quick-order' || view === 'subscriptions') && memberTypes.length === 0) {
            axios.get('/api/admin/member-types', { withCredentials: true })
                .then(res => setMemberTypes(res.data))
                .catch(err => handleError(err, "Failed to load member types"));
        }
    }, [view, memberTypes.length]);

    // --- Data Fetching ---
    const fetchData = async (endpoint: string) => {
        try {
            setLoading(true);

            // Special handling for 'categories' (formerly member-types)
            if (endpoint === 'member-types') {
                const memRes = await axios.get('/api/admin/member-types', { withCredentials: true });
                const adRes = await axios.get('/api/admin/ad-types', { withCredentials: true });
                setMemberTypes(memRes.data);
                setAdTypes(adRes.data);
                setView('member-types'); // Keep view name for sidebar highlight
                return;
            }

            let url = endpoint.includes('?')
                ? `/api/admin/${endpoint}`
                : `/api/admin/${endpoint}`;

            if (endpoint === 'reports') {
                url = '/api/admin/member-types';
            }

            const res = await axios.get(url, { withCredentials: true });
            setData(res.data);

            // Clean view name from query params for state
            const viewName = endpoint.split('?')[0];
            setView(viewName);

            if (viewName === 'subscribers') {
                setCustomers(res.data);
            } else if (viewName === 'magazines') {
                setMagazines(res.data);
            } else if (viewName === 'member-types' || viewName === 'reports') { // Set for both
                setMemberTypes(res.data);
            }
        } catch (err: any) {
            handleError(err, 'Failed to fetch data');
            if (err?.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchSubscriptions = (status: string, plan: string = subPlanFilter, payment: string = subPaymentFilter) => {
        setSubStatusFilter(status);
        setSubPlanFilter(plan);
        setSubPaymentFilter(payment);
        let query = 'subscriptions?';
        if (status) query += `status=${status}&`;
        if (plan) query += `planId=${plan}&`;
        if (payment) query += `paymentMethod=${payment}&`;
        fetchData(query);
    };

    // --- Actions: Customers ---
    const handleCustomerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (editMode) {
                await axios.put(`/api/admin/customers/${editId}`, customerForm, { withCredentials: true });
                showNotification('Customer updated successfully', 'success');
            } else {
                await axios.post('/api/admin/customers', customerForm, { withCredentials: true });
                showNotification('Customer created successfully', 'success');
            }
            setShowCustomerForm(false);
            setCustomerForm({ name: '', street: '', taluk: '', district: '', state: '', pincode: '', mobile: '', whatsapp: '', customerType: 'Subscription', adType: '' });
            fetchData('subscribers');
        } catch (err: any) {
            handleError(err, 'Failed to save customer');
        } finally {
            setLoading(false);
        }
    };

    const openCreateCustomer = () => {
        setEditMode(false);
        setCustomerForm({ name: '', street: '', taluk: '', district: '', state: '', pincode: '', mobile: '', whatsapp: '', customerType: 'Subscription', adType: '' });
        setShowCustomerForm(true);
    };

    const openAddAdCustomer = () => {
        setEditMode(false);
        setCustomerForm({
            name: '', mobile: '', whatsapp: '', street: '', addressLine2: '', taluk: '', district: '', state: '', pincode: '',
            customerType: 'Advertisement',
            country: 'India',
            adType: ''
        } as any);
        setShowCustomerForm(true);
    };

    const openEditCustomer = (cust: any) => {
        setEditId(cust._id);
        setEditMode(true);
        const addr = (typeof cust.address === 'object' && cust.address) ? cust.address : { street: cust.address || '', taluk: '', district: '', state: '', pincode: '' };
        setCustomerForm({
            name: cust.name,
            street: addr.street || '',
            taluk: addr.taluk || '',
            district: addr.district || '',
            state: addr.state || '',
            pincode: addr.pincode || '',
            mobile: cust.mobile || '',
            whatsapp: cust.whatsapp || '',
            customerType: cust.customerType || 'Subscription',
            adType: cust.adType || ''
        });
        setShowCustomerForm(true);
        setShowDetailModal(false);
    };

    const openCustomerDetails = async (cust: any) => {
        try {
            setLoading(true);

            let enrichedCustomer = { ...cust };

            if (enrichedCustomer.customerType === 'Advertisement') {
                const res = await axios.get(`/api/admin/customers/${cust._id}/ad-history`, { withCredentials: true });
                setAdHistoryData(res.data);
                setCustomerHistory([]);

                // Ensure status is set
                enrichedCustomer.status = 'Advertisement';
                enrichedCustomer.planName = 'Advertisement';
            } else {
                const res = await axios.get(`/api/admin/customers/${cust._id}/history`, { withCredentials: true });
                const history = res.data;
                setCustomerHistory(history);
                setAdHistoryData(null);

                // If opened from subscriptions tab, enrichedCustomer might lack some computed fields
                if (!enrichedCustomer.status || enrichedCustomer.status === 'Active') {
                    const lastSub = history.length > 0 ? history.sort((a: any, b: any) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0] : null;
                    if (lastSub) {
                        enrichedCustomer.nextBillingDate = lastSub.endDate;
                        enrichedCustomer.planName = lastSub.memberTypeId?.name || 'N/A';
                        const isExpired = new Date(lastSub.endDate) < new Date();
                        enrichedCustomer.status = isExpired ? 'Renew Needed' : (lastSub.status || 'Active');
                    } else {
                        enrichedCustomer.status = 'New';
                    }
                }
            }

            setSelectedCustomer(enrichedCustomer);
            setShowDetailModal(true);
        } catch (err: any) {
            handleError(err, 'Failed to fetch customer details');
        } finally {
            setLoading(false);
        }
    };

    const deleteCustomer = (id: string) => {
        setCustomerToDelete(id);
        setShowDeletePasswordModal(true);
    };

    const handleDeletePasswordSuccess = (password: string) => {
        if (customerToDelete) {
            const customerId = customerToDelete;
            setShowDeletePasswordModal(false);
            openConfirm(
                'Delete Customer?',
                'Are you sure you want to delete this customer? This will also delete all associated subscriptions and invoices.',
                async () => {
                    try {
                        setLoading(true);
                        await axios.delete(`/api/admin/customers/${customerId}`, {
                            data: { password },
                            withCredentials: true
                        });
                        showNotification('Customer deleted successfully', 'success');
                        setShowCustomerForm(false);
                        setShowDetailModal(false);
                        fetchData('subscribers');
                        closeConfirm();
                        setCustomerToDelete(null);
                    } catch (err: any) {
                        handleError(err, 'Failed to delete customer');
                    } finally {
                        setLoading(false);
                    }
                }
            );
        }
    };

    // --- Actions: Subscriptions ---
    const openSubForm = async () => {
        try {
            setLoading(true);
            // Refresh customers and magazines
            const custRes = await axios.get('/api/admin/subscribers', { withCredentials: true });
            setCustomers(custRes.data);
            const magRes = await axios.get('/api/admin/magazines', { withCredentials: true });
            setMagazines(magRes.data);
            const memRes = await axios.get('/api/admin/member-types', { withCredentials: true });
            setMemberTypes(memRes.data);

            const today = new Date().toISOString().split('T')[0];
            // Default EndDate will be set when Plan is selected

            setSubForm({ userId: '', memberTypeId: '', startDate: today, endDate: '', paymentMethod: '' } as any);
            setShowSubForm(true);
        } catch (err: any) {
            handleError(err, 'Failed to load subscription form data');
        } finally {
            setLoading(false);
        }
    };

    const handleRenewClick = async (subscription: any) => {
        setLoading(true);
        try {
            // Ensure member types are loaded for duration calculation
            let currentMemberTypes = memberTypes;
            if (currentMemberTypes.length === 0) {
                const res = await axios.get('/api/admin/member-types', { withCredentials: true });
                currentMemberTypes = res.data;
                setMemberTypes(res.data);
            }

            const endDate = new Date(subscription.endDate);
            // Start Date is always Expiry Date + 1 Day
            const nextDay = new Date(endDate);
            nextDay.setDate(nextDay.getDate() + 1);
            const startStr = nextDay.toISOString().split('T')[0];

            const planId = subscription.memberTypeId?._id || (typeof subscription.memberTypeId === 'string' ? subscription.memberTypeId : '');
            let endStr = '';

            if (planId && startStr) {
                const plan = currentMemberTypes.find((t: any) => t._id === planId);
                if (plan) {
                    const date = new Date(startStr);
                    date.setMonth(date.getMonth() + plan.durationInMonths);
                    date.setDate(date.getDate() - 1);
                    endStr = date.toISOString().split('T')[0];
                }
            }

            setRenewalSubscription(subscription);
            setRenewalFormData({
                memberTypeId: planId,
                startDate: startStr,
                endDate: endStr,
                paymentMethod: '',
                referenceNo: '',
                tempReceiptNo: ''
            });
            setShowRenewalModal(true);
        } catch (err) {
            handleError(err, 'Failed to prepare renewal');
        } finally {
            setLoading(false);
        }
    };

    const handleEditSubscriptionDate = (subscription: any, type: 'startDate' | 'endDate' = 'endDate') => {
        setSubscriptionToEdit(subscription);
        setEditDateType(type);
        setShowEditDateModal(true);
    };

    const handleSaveSubscriptionDate = async (subscriptionId: string, dateValue: string, dateType: 'startDate' | 'endDate', password: string) => {
        try {
            setLoading(true);
            const payload: any = { password };
            if (dateType === 'endDate') {
                payload.endDate = dateValue;
            } else {
                payload.startDate = dateValue;
            }

            await axios.put(`/api/admin/subscriptions/${subscriptionId}/date`, payload, { withCredentials: true });

            showNotification(`${dateType === 'startDate' ? 'Start' : 'End'} date updated successfully`, 'success');
            // Refresh customer details if modal is open
            if (selectedCustomer) {
                await openCustomerDetails(selectedCustomer);
            }
            // Refresh subscriptions if on subscriptions view
            if (view === 'subscriptions') {
                fetchSubscriptions(subStatusFilter, subPlanFilter);
            }
            setShowEditDateModal(false);
            setSubscriptionToEdit(null);
        } catch (err: any) {
            throw err;
        } finally {
            setLoading(false);
        }
    };



    const handleDownloadSubscriptionInvoice = async (subscription: any) => {
        try {
            setLoading(true);
            // Fetch the corresponding invoice(s) for this subscription
            const res = await axios.get(`/api/admin/invoices?subscriptionId=${subscription._id || subscription.subscriptionId}`, { withCredentials: true });

            if (res.data && res.data.length > 0) {
                // Pick the latest one
                const latestInvoice = res.data.sort((a: any, b: any) =>
                    new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime()
                )[0];

                await downloadPDF(latestInvoice);
            } else {
                showNotification('No invoice found for this subscription.', 'warning');
            }
        } catch (err: any) {
            handleError(err, 'Failed to download invoice');
        } finally {
            setLoading(false);
        }
    };

    const handleRenewalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!renewalSubscription) return;

        setLoading(true);
        try {
            const renewalData = {
                subscriptionId: renewalSubscription._id,
                memberTypeId: renewalFormData.memberTypeId,
                startDate: renewalFormData.startDate,
                endDate: renewalFormData.endDate,
                paymentMethod: renewalFormData.paymentMethod,
                referenceNo: renewalFormData.referenceNo,
                tempReceiptNo: renewalFormData.tempReceiptNo
            };

            const res = await axios.post('/api/admin/subscriptions/renew', renewalData, { withCredentials: true });

            // Refresh subscriptions data
            await fetchSubscriptions('');

            // Refresh stats to update 'Renew Needed' count
            await fetchStats();

            // Handle Success Modal
            const inv = res.data.invoice;
            if (inv && res.data.subscription) {
                inv.subscriptionId = res.data.subscription;
            }

            setSuccessData({
                customerName: (res.data.subscription?.userId?.name) || 'Customer',
                invoice: inv
            });

            setShowRenewalModal(false);
            setRenewalSubscription(null);
            setRenewalFormData({
                memberTypeId: '',
                startDate: '',
                endDate: '',
                paymentMethod: '',
                referenceNo: '',
                tempReceiptNo: ''
            });

            setShowSuccessModal(true);
            showNotification('Subscription renewed successfully!', 'success');

        } catch (err: any) {
            handleError(err, 'Failed to renew subscription');
        } finally {
            setLoading(false);
        }
    };

    const handleSubSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!subForm.userId) {
            showNotification('Please select a customer', 'warning');
            return;
        }
        if (!subForm.memberTypeId) {
            showNotification('Please select a membership plan', 'warning');
            return;
        }
        if (!subForm.startDate) {
            showNotification('Please select a start date', 'warning');
            return;
        }
        if (!subForm.endDate) {
            showNotification('Please ensure end date is calculated', 'warning');
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post('/api/admin/subscriptions', subForm, { withCredentials: true });

            // Handle Success Modal
            const inv = res.data.invoice;
            // Attach subscription details to invoice object for PDF generation
            if (inv && res.data.subscription) {
                inv.subscriptionId = res.data.subscription;
            }
            const cust = customers.find((c: any) => c._id === subForm.userId);

            setSuccessData({
                customerName: cust?.name || 'Customer',
                invoice: inv
            });
            setShowSuccessModal(true);
            setShowSubForm(false);

            if (view === 'subscriptions') {
                fetchSubscriptions(subStatusFilter);
            }
            // Refresh stats (especially if this was a renewal via new sub)
            await fetchStats();

        } catch (err: any) {
            handleError(err, 'Failed to create subscription');
        } finally {
            setLoading(false);
        }
    };

    // --- Actions: Magazines ---
    const openAddMagazine = () => {
        setMagEditMode(false);
        setMagForm({ title: '', description: '', price: '', category: '', periodicity: 'Monthly', coverImage: '' });
        setShowMagForm(true);
    };

    const openEditMagazine = (mag: any) => {
        setMagEditId(mag._id);
        setMagEditMode(true);
        setMagForm({
            title: mag.title,
            description: mag.description || '',
            price: mag.price,
            category: mag.category || '',
            periodicity: mag.periodicity || 'Monthly',
            coverImage: mag.coverImage || ''
        });
        setShowMagForm(true);
    };

    const handleMagSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!magForm.title?.trim()) {
            showNotification('Please enter a magazine title', 'warning');
            return;
        }
        if (!magForm.price || parseFloat(magForm.price) <= 0) {
            showNotification('Please enter a valid price', 'warning');
            return;
        }

        try {
            setLoading(true);
            if (magEditMode) {
                await axios.put(`/api/admin/magazines/${magEditId}`, magForm, { withCredentials: true });
                showNotification('Magazine updated successfully', 'success');
            } else {
                await axios.post('/api/admin/magazines', magForm, { withCredentials: true });
                showNotification('Magazine created successfully', 'success');
            }
            setShowMagForm(false);
            fetchData('magazines');
        } catch (err: any) {
            handleError(err, 'Failed to save magazine');
        } finally {
            setLoading(false);
        }
    };

    const deleteMagazine = (id: string) => {
        openConfirm(
            'Delete Magazine?',
            'Are you sure you want to delete this magazine? This action cannot be undone.',
            async () => {
                try {
                    setLoading(true);
                    await axios.delete(`/api/admin/magazines/${id}`, { withCredentials: true });
                    showNotification('Magazine deleted successfully', 'success');
                    fetchData('magazines');
                    closeConfirm();
                } catch (err: any) {
                    handleError(err, 'Failed to delete magazine');
                } finally {
                    setLoading(false);
                }
            }
        );
    };

    // --- Actions: Member Types ---
    const openAddMemberType = () => {
        setMemberTypeEditMode(false);
        setMemberTypeForm({ name: '', durationInMonths: '', price: '', letter: '', description: '' });
        setShowMemberTypeForm(true);
    };

    const openEditMemberType = (type: any) => {
        setMemberTypeEditId(type._id);
        setMemberTypeEditMode(true);
        setMemberTypeForm({
            name: type.name,
            durationInMonths: type.durationInMonths,
            price: type.price,
            letter: type.letter || '',
            description: type.description || ''
        });
        setShowMemberTypeForm(true);
    };

    const handleMemberTypeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (memberTypeEditMode) {
                await axios.put(`/api/admin/member-types/${memberTypeEditId}`, memberTypeForm, { withCredentials: true });
                showNotification('Plan updated successfully', 'success');
            } else {
                await axios.post('/api/admin/member-types', memberTypeForm, { withCredentials: true });
                showNotification('Plan created successfully', 'success');
            }
            setShowMemberTypeForm(false);
            fetchData('member-types');
        } catch (err: any) {
            handleError(err, 'Failed to save plan');
        }
    };

    const deleteMemberType = (id: string) => {
        openConfirm(
            'Delete Plan?',
            'Are you sure you want to delete this plan? This may affect existing subscriptions.',
            async () => {
                try {
                    setLoading(true);
                    await axios.delete(`/api/admin/member-types/${id}`, { withCredentials: true });
                    showNotification('Plan deleted successfully', 'success');
                    setShowMemberTypeForm(false);
                    fetchData('member-types');
                    closeConfirm();
                } catch (err: any) {
                    handleError(err, 'Failed to delete plan');
                } finally {
                    setLoading(false);
                }
            }
        );
    };

    // --- Actions: Ad Types ---
    const openAddAdType = () => {
        setAdTypeEditMode(false);
        setAdTypeForm({ name: '', description: '' });
        setShowAdTypeForm(true);
    };

    const openEditAdType = (type: any) => {
        setAdTypeEditId(type._id);
        setAdTypeEditMode(true);
        setAdTypeForm({ name: type.name, description: type.description || '' });
        setShowAdTypeForm(true);
    };

    const handleAdTypeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (adTypeEditMode) {
                await axios.put(`/api/admin/ad-types/${adTypeEditId}`, adTypeForm, { withCredentials: true });
                showNotification('Ad Type updated', 'success');
            } else {
                await axios.post('/api/admin/ad-types', adTypeForm, { withCredentials: true });
                showNotification('Ad Type created', 'success');
            }
            setShowAdTypeForm(false);
            // Refresh
            const res = await axios.get('/api/admin/ad-types', { withCredentials: true });
            setAdTypes(res.data);
        } catch (err: any) {
            handleError(err, 'Failed to save Ad Type');
        }
    };

    const deleteAdType = (id: string) => {
        openConfirm('Delete Ad Type?', 'Are you sure?', async () => {
            try {
                await axios.delete(`/api/admin/ad-types/${id}`, { withCredentials: true });
                showNotification('Ad Type deleted', 'success');
                setShowAdTypeForm(false);
                const res = await axios.get('/api/admin/ad-types', { withCredentials: true });
                setAdTypes(res.data);
                closeConfirm();
            } catch (err: any) {
                handleError(err, 'Failed to delete');
            }
        });
    };


    // --- Actions: Advertisements ---
    const handleAdSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            let res;
            if (adEditMode) {
                res = await axios.put(`/api/admin/advertisements/${adEditId}`, adForm, { withCredentials: true });
                showNotification('Advertisement updated', 'success');
            } else {
                res = await axios.post('/api/admin/advertisements', adForm, { withCredentials: true });
                showNotification('Advertisement created', 'success');
            }

            // Handle Success Modal
            if (res.data.invoice) {
                setSuccessData({
                    customerName: res.data.advertisement?.clientName || 'Customer',
                    invoice: res.data.invoice
                });
                setShowSuccessModal(true);
            }

            setShowAdForm(false);
            await fetchStats();
            fetchData('advertisements');
        } catch (err: any) {
            handleError(err, 'Failed to save advertisement');
        } finally {
            setLoading(false);
        }
    };

    const quickUpdateAdPayment = async (id: string, method: string) => {
        try {
            setLoading(true);
            const res = await axios.put(`/api/admin/advertisements/${id}`, { paymentMethod: method }, { withCredentials: true });
            showNotification('Payment updated successfully', 'success');

            // Handle Success Modal
            if (res.data.invoice) {
                setSuccessData({
                    customerName: res.data.advertisement?.clientName || 'Customer',
                    invoice: res.data.invoice
                });
                setShowSuccessModal(true);
            }

            // Refresh dashboards/stats
            await fetchStats();
            fetchData('advertisements');
        } catch (err: any) {
            handleError(err, 'Failed to update payment');
        } finally {
            setLoading(false);
        }
    };

    const deleteAd = (id: string) => {
        openConfirm('Delete Advertisement?', 'Are you sure you want to delete this advertisement?', async () => {
            try {
                setLoading(true);
                await axios.delete(`/api/admin/advertisements/${id}`, { withCredentials: true });
                showNotification('Advertisement deleted', 'success');
                fetchData('advertisements');
                closeConfirm();
            } catch (err: any) {
                handleError(err, 'Failed to delete advertisement');
            } finally {
                setLoading(false);
            }
        });
    };

    const openAddAd = async () => {
        setAdEditMode(false);
        setAdForm({ clientName: '', adName: '', types: [], price: '', startDate: '', endDate: '', status: 'Active', paymentMethod: '' });
        try {
            const [custRes, typeRes] = await Promise.all([
                axios.get('/api/admin/subscribers?type=Advertisement', { withCredentials: true }),
                axios.get('/api/admin/ad-types', { withCredentials: true })
            ]);
            setCustomers(custRes.data);
            setAdTypes(typeRes.data);
        } catch (err) {
            handleError(err, "Failed to load dependencies");
        }
        setShowAdForm(true);
    };

    const openEditAd = async (ad: any) => {
        setAdEditId(ad._id);
        setAdEditMode(true);
        setAdForm({ ...ad, types: ad.types || [], paymentMethod: ad.paymentMethod || '' });
        try {
            const [custRes, typeRes] = await Promise.all([
                axios.get('/api/admin/subscribers?type=Advertisement', { withCredentials: true }),
                axios.get('/api/admin/ad-types', { withCredentials: true })
            ]);
            setCustomers(custRes.data);
            setAdTypes(typeRes.data);
        } catch (err) {
            handleError(err, "Failed to load dependencies");
        }
        setShowAdForm(true);
    };

    const openAdHistory = (ad: any) => {
        // Determine customer object
        const cust = ad.userId || { name: ad.clientName, customerType: 'Advertisement', _id: 'temp', mobile: '', address: '' };
        setSelectedCustomer(cust);

        // Filter ads for this customer from current 'data' (which contains all ads in this view)
        const history = data.filter(item => {
            if (ad.userId && item.userId) {
                // If populated object
                const uId1 = typeof ad.userId === 'object' ? ad.userId._id : ad.userId;
                const uId2 = typeof item.userId === 'object' ? item.userId._id : item.userId;
                return uId1 === uId2;
            }
            return item.clientName === ad.clientName;
        });

        setAdHistoryData(history);
        setCustomerHistory([]); // Clear normal history
        setShowDetailModal(true);
    };

    const createAddressImage = (lines: string[], boldFirst = false) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';
        const fontSize = 35; // Matches ~10pt at 0.12 scale
        const boldFontSize = 50; // Matches ~14pt at 0.12 scale

        let maxWidth = 0;
        lines.forEach((l, i) => {
            ctx.font = (i === 0 && boldFirst)
                ? `bold ${boldFontSize}px "Arial Unicode MS", Arial, sans-serif`
                : `${fontSize}px "Arial Unicode MS", Arial, sans-serif`;
            const w = ctx.measureText(l).width;
            if (w > maxWidth) maxWidth = w;
        });

        canvas.width = maxWidth + 40;
        const totalHeight = (boldFirst ? boldFontSize + 15 : 0) +
            ((boldFirst ? lines.length - 1 : lines.length) * (fontSize + 15)) + 40;
        canvas.height = totalHeight;

        ctx.textBaseline = 'top';
        let currentY = 20;
        lines.forEach((l, i) => {
            const isBold = i === 0 && boldFirst;
            const size = isBold ? boldFontSize : fontSize;
            ctx.font = `${isBold ? 'bold ' : ''}${size}px "Arial Unicode MS", Arial, sans-serif`;
            ctx.fillStyle = isBold ? '#0f172a' : '#4b5563';
            ctx.fillText(l, 20, currentY);
            currentY += size + 15;
        });
        return canvas.toDataURL('image/png');
    };

    const downloadAdInvoice = async (ad: any) => {
        try {
            setLoading(true);

            // Fetch Real Invoice Number logic
            let realInvNo = ad.referenceNo || 'Draft';
            if (ad.paymentMethod !== 'Credit Transaction') {
                try {
                    let candidates: any[] = [];
                    // Try fetching by User ID
                    if (ad.userId) {
                        const uId = (ad.userId && ad.userId._id) ? ad.userId._id : ad.userId;
                        const invRes = await axios.get(`/api/admin/invoices?userId=${uId}`, { withCredentials: true });
                        candidates = invRes.data.filter((inv: any) =>
                            inv.category === 'Advertisement' &&
                            Math.abs(inv.amount - (Number(ad.price) || 0)) < 1
                        );
                    }

                    // If not found, Try fetching by Client/Customer Name
                    if (candidates.length === 0 && ad.clientName) {
                        const invRes = await axios.get(`/api/admin/invoices?customerName=${encodeURIComponent(ad.clientName)}`, { withCredentials: true });
                        candidates = invRes.data.filter((inv: any) =>
                            inv.category === 'Advertisement' &&
                            Math.abs(inv.amount - (Number(ad.price) || 0)) < 1
                        );
                    }

                    const exact = candidates.find((inv: any) =>
                        inv.items?.some((i: any) => i.description.includes(ad.adName))
                    );

                    if (exact && exact.invoiceNumber) {
                        realInvNo = exact.invoiceNumber;
                    } else if (candidates.length > 0 && candidates[0].invoiceNumber) {
                        realInvNo = candidates[0].invoiceNumber;
                    }
                } catch (e) {
                    if (e instanceof Error) {
                        // Log suppressed
                    }
                }
            }
            const doc = new jsPDF();

            const loadImage = (url: string): Promise<string> => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.src = url;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0);
                            resolve(canvas.toDataURL('image/png'));
                        } else resolve('');
                    };
                    img.onerror = () => resolve('');
                });
            };

            const createTitleImage = (text: string) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return '';
                const fontSize = 80;
                ctx.font = `bold ${fontSize}px "Arial Unicode MS", Arial, sans-serif`;
                const textWidth = ctx.measureText(text).width;
                canvas.width = textWidth + 80;
                canvas.height = fontSize + 80;
                ctx.font = `bold ${fontSize}px "Arial Unicode MS", Arial, sans-serif`;
                ctx.fillStyle = '#6D0F1B'; // Brand Color
                ctx.textBaseline = 'middle';
                ctx.fillText(text, 40, canvas.height / 2);
                return canvas.toDataURL('image/png');
            };

            const logoData = await loadImage('/invoice-ganesha.png');
            const qrCodeData = await loadImage('/upi-qr.png');
            const titleImg = createTitleImage('ஆச்சி வந்தாச்சு');
            const addrImg = createAddressImage([
                'தமிழ் இலக்கிய மாத இதழ்,',
                '17/7 கிழப்பட்டமார் தெரு, முதல் தளம்,',
                'மதுரை - 625001.',
                'Ph: 0452 4375375'
            ]);

            // --- Header ---
            if (logoData) {
                doc.addImage(logoData, 'PNG', 15, 15, 30, 42);
            }
            if (titleImg) {
                doc.addImage(titleImg, 'PNG', 50, 13, 70, 18);
            }
            if (addrImg) {
                doc.addImage(addrImg, 'PNG', 50, 30, 65, 27);
            }

            // Title (Right)
            doc.setFontSize(28);
            doc.setTextColor('#1e293b');
            doc.text('INVOICE', 195, 25, { align: 'right' });

            // Invoice Details Block (Right)
            const detailsX = 135;
            let currentDetailY = 32;

            doc.setFontSize(10);
            doc.setTextColor(100);
            if (ad.paymentMethod !== 'Credit Transaction') {
                doc.text('Bill No:', detailsX, currentDetailY, { align: 'left' });
                doc.setTextColor(0);
                doc.setFont('helvetica', 'bold');
                doc.text(realInvNo, 195, currentDetailY, { align: 'right' });
                doc.setFont('helvetica', 'normal');
                currentDetailY += 6;
            }

            doc.setTextColor(100);
            doc.text('Date:', detailsX, currentDetailY, { align: 'left' });
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text(new Date().toLocaleDateString('en-GB'), 195, currentDetailY, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            currentDetailY += 6;

            doc.setTextColor(100);
            doc.text('Payment:', detailsX, currentDetailY, { align: 'left' });
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text(ad.paymentMethod || 'nil', 195, currentDetailY, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            currentDetailY += 6;

            doc.setTextColor(100);
            doc.text('Receipt No:', detailsX, currentDetailY, { align: 'left' });
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text(ad.tempReceiptNo || 'nil', 195, currentDetailY, { align: 'right' });
            doc.setFont('helvetica', 'normal');

            let extraY = currentDetailY + 5;

            const adTypeLabel = 'Advertisement Invoice';
            const extraYForBox = extraY + 5;
            doc.setFontSize(12);
            doc.setTextColor('#1e293b');
            doc.setFont('helvetica', 'bold');
            doc.text(adTypeLabel, 105, extraYForBox + 6.5, { align: 'center' });
            doc.setFont('helvetica', 'normal');

            // Divider (Moved down slightly)
            doc.setDrawColor(200);
            doc.setLineWidth(0.5);
            doc.line(15, extraY + 20, 195, extraY + 20);

            // Add Address for Ad Invoice
            const adAddr = ad.userId?.address;
            const clientName = ad.clientName || 'Valued Client';
            const customerLines = [clientName];

            if (adAddr) {
                if (typeof adAddr === 'object') {
                    if (adAddr.street) customerLines.push(adAddr.street);
                    if (adAddr.taluk) customerLines.push(adAddr.taluk);
                    let districtLine = '';
                    if (adAddr.district) districtLine += adAddr.district;
                    if (adAddr.pincode) districtLine += (districtLine ? ' - ' : '') + adAddr.pincode;
                    if (districtLine) customerLines.push(districtLine);
                    if (adAddr.state) customerLines.push(adAddr.state);
                } else if (typeof adAddr === 'string') {
                    customerLines.push(...adAddr.split('\n'));
                }
            }

            // Add Mobile Number
            if (ad.userId?.mobile) {
                customerLines.push(`Mob: ${ad.userId.mobile}`);
            }

            const customerBlockImg = createAddressImage(customerLines, true);
            let adAddrY = extraY + 30;
            if (customerBlockImg) {
                const imgProps = doc.getImageProperties(customerBlockImg);
                const scale = 0.12;
                const imgW = imgProps.width * scale;
                const imgH = imgProps.height * scale;
                doc.addImage(customerBlockImg, 'PNG', 15, adAddrY, imgW, imgH);
                adAddrY += imgH + 5;
            }

            // --- Table ---
            const typeStr = ad.types && ad.types.length > 0 ? ad.types.join(', ') : '-';
            const tableBody = [[
                ad.adName || 'Advertisement Charge',
                typeStr,
                `Rs. ${ad.price}`
            ]];

            autoTable(doc, {
                startY: Math.max(120, adAddrY + 15),
                head: [['Description', 'Type / Format', 'Amount']],
                body: tableBody,
                theme: 'grid',
                styles: {
                    fontSize: 10,
                    cellPadding: 6,
                    textColor: 50,
                    lineColor: [230, 230, 230],
                    lineWidth: 0.1
                },
                headStyles: {
                    fillColor: [241, 245, 249], // Light Slate #f1f5f9
                    textColor: [15, 23, 42], // Dark Slate #0f172a
                    fontStyle: 'bold',
                    halign: 'left'
                },
                columnStyles: {
                    2: { halign: 'right', fontStyle: 'bold' }
                },
                foot: [[
                    { content: 'Total Amount:', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fontSize: 11 } },
                    { content: `Rs. ${ad.price || 0}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 11, textColor: '#334155' } }
                ]],
                footStyles: { fillColor: [255, 255, 255] }
            });

            // --- Footer ---
            const pageHeight = doc.internal.pageSize.height;
            const bankY = pageHeight - 65;

            // Bank Details (Left)
            doc.setFontSize(10);
            doc.setTextColor('#334155');
            doc.text('Bank Details:', 15, bankY);

            doc.setFontSize(9);
            doc.setTextColor(0);
            doc.text([
                'Name: AACHI VANTHACHU',
                'Bank: ICICI',
                'Branch: MADURAI MAIN',
                'Current A/C No: 600 30 50 77 673',
                'IFS Code: ICIC 000 6003',
                'GPay: 9843424699'
            ], 15, bankY + 6);


            // QR Code (Left, below bank details)
            if (qrCodeData) {
                doc.addImage(qrCodeData, 'PNG', 70, bankY - 5, 35, 35);
            }

            // Signature (Right Bottom)
            const signatureY = bankY + 5;
            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.text('For Aachi Vanthachu', 195, signatureY, { align: 'right' });

            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text('(Authorized Signatory)', 195, bankY + 30, { align: 'right' });

            // Bottom Branding
            doc.setDrawColor('#334155');
            doc.setLineWidth(0.5); // Lightened line
            doc.line(15, pageHeight - 15, 195, pageHeight - 15);

            // Save Logic
            const filename = `Invoice_${ad.clientName}.pdf`;
            const electron = (window as any).electronAPI;

            if (electron) {
                const pdfArrayBuffer = doc.output('arraybuffer');
                const result = await electron.savePDF(pdfArrayBuffer, filename);
                if (result.success) {
                    showNotification(`Invoice saved to ${result.path}`, 'success');
                } else {
                    showNotification('Failed to save invoice via Electron', 'error');
                }
            } else {
                doc.save(filename);
            }

        } catch (err) {
            handleError(err, 'Failed to generate invoice');
        } finally {
            setLoading(false);
        }
    };

    // --- Actions: Invoices ---
    const downloadPDF = async (invoice: any) => {
        try {
            setLoading(true);
            const doc = new jsPDF();

            const loadImage = (url: string): Promise<string> => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.src = url;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0);
                            resolve(canvas.toDataURL('image/png'));
                        } else resolve('');
                    };
                    img.onerror = () => resolve('');
                });
            };

            const createTitleImage = (text: string) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return '';
                const fontSize = 80;
                ctx.font = `bold ${fontSize}px "Arial Unicode MS", Arial, sans-serif`;
                const textWidth = ctx.measureText(text).width;
                canvas.width = textWidth + 80;
                canvas.height = fontSize + 80;
                ctx.font = `bold ${fontSize}px "Arial Unicode MS", Arial, sans-serif`;
                ctx.fillStyle = '#6D0F1B'; // Brand Color
                ctx.textBaseline = 'middle';
                ctx.fillText(text, 40, canvas.height / 2);
                return canvas.toDataURL('image/png');
            };

            const logoData = await loadImage('/invoice-ganesha.png');
            const qrCodeData = await loadImage('/upi-qr.png');
            const titleImg = createTitleImage('ஆச்சி வந்தாச்சு');
            const addrImg = createAddressImage([
                'தமிழ் இலக்கிய மாத இதழ்,',
                '17/7 கிழப்பட்டமார் தெரு, முதல் தளம்,',
                'மதுரை - 625001.',
                'Ph: 0452 4375375'
            ]);

            // --- Header ---
            if (logoData) {
                doc.addImage(logoData, 'PNG', 15, 15, 30, 42);
            }
            if (titleImg) {
                doc.addImage(titleImg, 'PNG', 50, 13, 70, 18);
            }
            if (addrImg) {
                doc.addImage(addrImg, 'PNG', 50, 30, 65, 27);
            }

            // Title (Right)
            doc.setFontSize(28);
            doc.setTextColor('#1e293b');
            doc.text('INVOICE', 195, 25, { align: 'right' });

            doc.setFontSize(10);
            const categoryLabel = invoice.category ? `${invoice.category} Invoice` : 'Tax Invoice';
            // Invoice Details Block (Right)
            const detailsX = 135;
            let currentDetailY = 32;
            const invNo = invoice.invoiceNumber || invoice._id;
            const dateStr = invoice.dateIssued ? new Date(invoice.dateIssued).toLocaleDateString('en-GB') : 'N/A';

            if (!(invoice.category === 'Advertisement' && invoice.paymentMethod === 'Credit Transaction')) {
                doc.setFontSize(10);
                doc.setTextColor(100);
                doc.text('Bill No:', detailsX, currentDetailY, { align: 'left' });
                doc.setTextColor(0);
                doc.setFont('helvetica', 'bold');
                doc.text(invNo, 195, currentDetailY, { align: 'right' });
                doc.setFont('helvetica', 'normal');
                currentDetailY += 6;
            }

            doc.setTextColor(100);
            doc.text('Date:', detailsX, currentDetailY, { align: 'left' });
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text(dateStr, 195, currentDetailY, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            currentDetailY += 6;

            const subCode = (invoice.subscriptionId && typeof invoice.subscriptionId === 'object') ? invoice.subscriptionId.subscriptionId : '';
            if (subCode) {
                doc.setTextColor(100);
                doc.text('Sub No:', detailsX, currentDetailY, { align: 'left' });
                doc.setTextColor(0);
                doc.setFont('helvetica', 'bold');
                doc.text(subCode, 195, currentDetailY, { align: 'right' });
                doc.setFont('helvetica', 'normal');
                currentDetailY += 6;
            }

            const receiptNo = invoice.tempReceiptNo || (invoice.subscriptionId && typeof invoice.subscriptionId === 'object' ? invoice.subscriptionId.tempReceiptNo : '');
            if (receiptNo) {
                doc.setTextColor(100);
                doc.text('Rec No:', detailsX, currentDetailY, { align: 'left' });
                doc.setTextColor(0);
                doc.setFont('helvetica', 'bold');
                doc.text(receiptNo, 195, currentDetailY, { align: 'right' });
                doc.setFont('helvetica', 'normal');
                currentDetailY += 6;
            }

            if (invoice.referenceNo) {
                doc.setTextColor(100);
                doc.text('Ref No:', detailsX, currentDetailY, { align: 'left' });
                doc.setTextColor(0);
                doc.setFont('helvetica', 'bold');
                doc.text(invoice.referenceNo, 195, currentDetailY, { align: 'right' });
                doc.setFont('helvetica', 'normal');
                currentDetailY += 6;
            }

            doc.setTextColor(100);
            doc.text('Payment:', detailsX, currentDetailY, { align: 'left' });
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text(invoice.paymentMethod || 'nil', 195, currentDetailY, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            currentDetailY += 6;

            const statusColor = invoice.status === 'Paid' ? '#059669' : '#dc2626';
            doc.setTextColor(100);
            doc.text('Status:', detailsX, currentDetailY, { align: 'left' });
            doc.setTextColor(statusColor);
            doc.setFont('helvetica', 'bold');
            doc.text(invoice.status || '', 195, currentDetailY, { align: 'right' });
            doc.setFont('helvetica', 'normal');

            let extraY = currentDetailY + 5;

            const extraYForBox = extraY + 5;
            doc.setFontSize(14); // Increased font size
            doc.setTextColor('#1e293b');
            doc.setFont('helvetica', 'bold');
            doc.text(categoryLabel, 105, extraYForBox + 6.5, { align: 'center' });
            doc.setFont('helvetica', 'normal');

            const dividerY = extraYForBox + 15;

            // Divider
            doc.setDrawColor(200);
            doc.setLineWidth(0.5);
            doc.line(15, dividerY, 195, dividerY);

            // --- To ---
            doc.setFontSize(10);
            doc.setTextColor('#64748b');
            doc.text('To', 15, dividerY + 10);

            const userName = invoice.userId?.name || invoice.customerName || 'Valued Customer';
            const addr = invoice.userId?.address;

            let customerLines: string[] = [userName];
            if (addr && typeof addr === 'object') {
                if (addr.street) customerLines.push(addr.street);
                if (addr.addressLine2) customerLines.push(addr.addressLine2);
                if (addr.taluk) customerLines.push(addr.taluk);
                let districtLine = '';
                if (addr.district) districtLine += addr.district;
                if (addr.pincode) districtLine += (districtLine ? ' - ' : '') + addr.pincode;
                if (districtLine) customerLines.push(districtLine);
                if (addr.state) customerLines.push(addr.state);
            } else if (typeof addr === 'string') {
                customerLines.push(...addr.split('\n'));
            }

            // Add Mobile Number
            if (invoice.userId?.mobile) {
                customerLines.push(`Mob: ${invoice.userId.mobile}`);
            }

            const customerBlockImg = createAddressImage(customerLines, true);
            let nextY = dividerY + 17;
            if (customerBlockImg) {
                const imgProps = doc.getImageProperties(customerBlockImg);
                const scale = 0.12;
                const imgW = imgProps.width * scale;
                const imgH = imgProps.height * scale;
                doc.addImage(customerBlockImg, 'PNG', 15, nextY, imgW, imgH);
                nextY += imgH + 5;
            }

            // --- Table ---
            const tableBody = invoice.items && invoice.items.length > 0
                ? invoice.items.map((i: any) => {
                    let desc = i.description;
                    const isSubscription = invoice.category === 'Subscription' || (!invoice.category && invoice.subscriptionId);

                    if (isSubscription) {
                        const plan = invoice.subscriptionId?.memberTypeId;
                        let planName = plan?.name;

                        // Fallback: Try to extract plan name from description if object population failed
                        if (!planName && i.description && i.description.startsWith('Subscription - ')) {
                            planName = i.description.replace('Subscription - ', '');
                        }

                        desc = 'Magazine Subscription';

                        // Always include plan name if available - either from populated data or from description
                        if (planName) {
                            const months = plan?.durationInMonths || (i.description && i.description.includes('Year') ? 12 : 0);
                            const durationText = (months > 0) ? ((months % 12 === 0) ? `${months / 12} Year` : `${months} Months`) : '';
                            desc += `\nPlan: ${planName}${durationText ? ` (${durationText})` : ''}`;
                        } else if (i.description && i.description !== 'Subscription' && i.description.startsWith('Subscription - ')) {
                            // Extract plan name from description and display it
                            const extractedPlanName = i.description.replace('Subscription - ', '');
                            desc += `\nPlan: ${extractedPlanName}`;
                        }

                        if (invoice.billingStart && invoice.billingEnd) {
                            const startDate = new Date(invoice.billingStart).toLocaleDateString('en-GB');
                            const endDate = new Date(invoice.billingEnd).toLocaleDateString('en-GB');
                            desc += `\nPeriod: ${startDate} to ${endDate}`;
                        }
                    }
                    return [
                        invoice.userId?.subscriberNo || '-',
                        desc,
                        `Rs. ${i.amount}`
                    ];
                })
                : [[
                    invoice.userId?.subscriberNo || '-',
                    (() => {
                        const plan = invoice.subscriptionId?.memberTypeId;
                        const planName = plan?.name || (typeof invoice.subscriptionId === 'string' ? '' : '');
                        const duration = plan?.durationInMonths;
                        const durationText = duration ? (duration % 12 === 0 ? duration / 12 + ' Year' : duration + ' Months') : '';

                        let d = 'Magazine Subscription';
                        if (planName) {
                            d += `\nPlan: ${planName}${durationText ? ` (${durationText})` : ''}`;
                        }
                        if ((invoice.category === 'Subscription' || (!invoice.category && invoice.subscriptionId)) && invoice.billingStart && invoice.billingEnd) {
                            d += `\nPeriod: ${new Date(invoice.billingStart).toLocaleDateString('en-GB')} to ${new Date(invoice.billingEnd).toLocaleDateString('en-GB')}`;
                        }
                        return d;
                    })(),
                    `Rs. ${invoice.amount || 0}`
                ]];

            autoTable(doc, {
                startY: Math.max(130, nextY + 15),
                head: [['Cus ID', 'Description', 'Amount']],
                body: tableBody,
                theme: 'grid',
                styles: {
                    fontSize: 10,
                    cellPadding: 6,
                    textColor: 50,
                    lineColor: [230, 230, 230],
                    lineWidth: 0.1
                },
                headStyles: {
                    fillColor: [241, 245, 249], // Premium Light Slate
                    textColor: [15, 23, 42],
                    fontStyle: 'bold',
                    halign: 'left'
                },
                columnStyles: {
                    0: { cellWidth: 30 },
                    2: { halign: 'right', fontStyle: 'bold' }
                },
                foot: [[
                    { content: 'Total Amount:', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fontSize: 11 } },
                    { content: `Rs. ${invoice.amount || 0}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 11, textColor: '#334155' } }
                ]],
                footStyles: { fillColor: [255, 255, 255] }
            });

            // --- Footer Content: Bank Details & Signature ---
            const pageHeight = doc.internal.pageSize.height;
            const bankY = pageHeight - 65;

            // Bank Details (Left)
            doc.setFontSize(10);
            doc.setTextColor('#334155');
            doc.text('Bank Details:', 15, bankY);

            doc.setFontSize(9);
            doc.setTextColor(0);

            doc.text([
                'Name: AACHI VANTHACHU',
                'Bank: ICICI',
                'Branch: MADURAI MAIN',
                'Current A/C No: 600 30 50 77 673',
                'IFS Code: ICIC 000 6003',
                'GPay: 9843424699'
            ], 15, bankY + 6);


            // QR Code (Left, below bank details)
            if (qrCodeData) {
                doc.addImage(qrCodeData, 'PNG', 70, bankY - 5, 35, 35);
            }

            // Signature (Right)
            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.text('For Aachi Vanthachu', 195, bankY + 5, { align: 'right' });

            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text('(Authorized Signatory)', 195, bankY + 30, { align: 'right' });

            doc.setDrawColor('#334155');
            doc.setLineWidth(0.5); // Lightened line
            doc.line(15, pageHeight - 15, 195, pageHeight - 15);

            // Save Logic
            const filename = `Invoice_${invoice.invoiceNumber || 'draft'}.pdf`;

            const electron = (window as any).electronAPI;

            if (electron) {
                const pdfArrayBuffer = doc.output('arraybuffer');
                const result = await electron.savePDF(pdfArrayBuffer, filename);
                if (result.success) {
                    showNotification(`Invoice saved to ${result.path}`, 'success');
                } else {
                    showNotification('Failed to save invoice via Electron', 'error');
                }
            } else {
                doc.save(filename);
            }

        } catch (err) {
            handleError(err, 'Failed to generate PDF');
        } finally {
            setLoading(false);
        }
    };

    // --- Render ---
    return (
        <div className="admin-container">

            <Sidebar
                view={view}
                setView={(v) => {
                    setView(v);
                    setQuickOrderInitialStep(1);
                    setQuickOrderInitialCustomer(null);
                    setQuickOrderSubscriptionToUpdate(null);
                }}
                fetchData={(v) => {
                    fetchData(v);
                    setQuickOrderInitialStep(1);
                    setQuickOrderInitialCustomer(null);
                    setQuickOrderSubscriptionToUpdate(null);
                }}
                fetchSubscriptions={(s) => {
                    fetchSubscriptions(s);
                    setQuickOrderInitialStep(1);
                    setQuickOrderInitialCustomer(null);
                    setQuickOrderSubscriptionToUpdate(null);
                }}
            />

            <div key={view} className={`admin-main ${view}-mode fade-in-content`}>
                {view === 'dashboard' && <DashboardStats stats={stats} onAnalyticsClick={() => setShowPasswordModal(true)} />}

                {view === 'analytics' && (
                    <AnalyticsView
                        showNotification={showNotification}
                        onOpenDetailedBreakdown={() => setView('detailed-breakdown')}
                    />
                )}

                {view === 'detailed-breakdown' && (
                    <DetailedBreakdownView
                        showNotification={showNotification}
                        onBack={() => setView('analytics')}
                    />
                )}

                {view === 'quick-order' && (
                    <QuickOrderView
                        memberTypes={memberTypes}
                        onInvoiceDownload={downloadPDF}
                        showNotification={showNotification}
                        handleError={handleError}
                        initialStep={quickOrderInitialStep}
                        initialCustomer={quickOrderInitialCustomer}
                        subscriptionToUpdate={quickOrderSubscriptionToUpdate}
                        onPaymentUpdateSuccess={async () => {
                            await fetchStats();
                            fetchData('subscriptions');
                            setQuickOrderSubscriptionToUpdate(null);
                            setQuickOrderInitialCustomer(null);
                        }}
                    />
                )}



                {view === 'subscribers' && (
                    <CustomersView
                        data={data}
                        filter={filter}
                        setFilter={setFilter}
                        customerFilterType={customerFilterType}
                        setCustomerFilterType={setCustomerFilterType}
                        onAddCustomer={openCreateCustomer}
                        onOpenDetails={openCustomerDetails}
                    />
                )}

                {view === 'subscriptions' && (
                    <SubscriptionsView
                        data={data}
                        filter={filter}
                        setFilter={setFilter}
                        subStatusFilter={subStatusFilter}
                        subPlanFilter={subPlanFilter}
                        subPaymentFilter={subPaymentFilter}
                        memberTypes={memberTypes}
                        onFilterChange={fetchSubscriptions}
                        onAddSubscription={openSubForm}
                        onOpenSubDetails={handleOpenSubDetails}
                        onRenewClick={handleRenewClick}
                        globalStats={{
                            allSubscriptions: stats.allSubscriptions,
                            activeSubscriptions: stats.activeSubscriptions,
                            renewalNeededSubscriptions: stats.renewalNeededSubscriptions,
                            totalSubscribers: stats.totalSubscribers, // Use correct subscription customers count
                        }}
                    />
                )}

                {view === 'invoices' && (
                    <InvoicesView
                        data={data}
                        filter={filter}
                        setFilter={setFilter}
                        onDownloadPDF={downloadPDF}
                        onUpdateStatus={async (id, status) => {
                            try {
                                setLoading(true);
                                const res = await axios.put(`/api/admin/invoices/${id}`, { status }, { withCredentials: true });
                                showNotification('Invoice status updated successfully', 'success');

                                if (status === 'Paid' && res.data) {
                                    setSuccessData({
                                        customerName: res.data.customerName || res.data.userId?.name || 'Customer',
                                        invoice: res.data
                                    });
                                    setShowSuccessModal(true);
                                }

                                await fetchStats();
                                fetchData('invoices');
                            } catch (err: any) {
                                handleError(err, 'Failed to update invoice status');
                            } finally {
                                setLoading(false);
                            }
                        }}
                        onDeleteInvoice={(id) => {
                            openConfirm('Delete Invoice?', 'Are you sure you want to delete this invoice?', async () => {
                                try {
                                    setLoading(true);
                                    await axios.delete(`/api/admin/invoices/${id}`, { withCredentials: true });
                                    showNotification('Invoice deleted successfully', 'success');
                                    fetchData('invoices');
                                    closeConfirm();
                                } catch (err: any) {
                                    handleError(err, 'Failed to delete invoice');
                                } finally {
                                    setLoading(false);
                                }
                            });
                        }}
                    />
                )}



                {view === 'advertisements' && (
                    <AdvertisementsView
                        data={data}
                        onAdd={openAddAd}
                        onEdit={openEditAd}
                        onDelete={deleteAd}
                        onInvoice={downloadAdInvoice}
                        onDownloadRealInvoice={downloadPDF}
                        onClientClick={openAdHistory}
                        onQuickUpdatePayment={quickUpdateAdPayment}
                        adTypes={adTypes}
                        onAddCustomer={openAddAdCustomer}
                        allCustomers={customers}
                    />
                )}

                {view === 'magazines' && (
                    <MagazinesView
                        data={data}
                        filter={filter}
                        setFilter={setFilter}
                        onAddMagazine={openAddMagazine}
                        onEditMagazine={openEditMagazine}
                        onDeleteMagazine={deleteMagazine}
                    />
                )}

                {view === 'member-types' && (
                    <CategoriesView
                        data={memberTypes}
                        adTypes={adTypes}
                        onAddMemberType={openAddMemberType}
                        onEditMemberType={openEditMemberType}
                        onAddAdType={openAddAdType}
                        onEditAdType={openEditAdType}
                    />
                )}

                {view === 'reports' && (
                    <ReportsView
                        memberTypes={memberTypes}
                        adTypes={adTypes}
                        showNotification={showNotification}
                    />
                )}

                {view === 'inventory' && (
                    <InventoryView
                        confirm={openConfirm}
                        showNotification={showNotification}
                    />
                )}
                {view === 'database' && (
                    <DatabaseView
                        showNotification={showNotification}
                        openConfirm={openConfirm}
                        closeConfirm={closeConfirm}
                        handleError={handleError}
                    />
                )}


            </div>

            {/* Modals */}
            {
                showDetailModal && selectedCustomer && (
                    <CustomerDetailModal
                        customer={selectedCustomer}
                        history={customerHistory}
                        adHistory={adHistoryData || undefined}
                        hideSubscriptionInfo={view === 'advertisements'}
                        onClose={() => setShowDetailModal(false)}
                        onEdit={openEditCustomer}
                        onDelete={deleteCustomer}
                        onEditSubscriptionDate={handleEditSubscriptionDate}
                        onOpenSubDetails={handleOpenSubDetails}
                    />
                )
            }

            {
                showCustomerForm && (
                    <CustomerFormModal
                        editMode={editMode}
                        formData={customerForm}
                        setFormData={setCustomerForm}
                        onSubmit={handleCustomerSubmit}
                        onClose={() => setShowCustomerForm(false)}
                        memberTypes={memberTypes}
                        isAdContext={view === 'advertisements'}
                    />
                )
            }

            {
                showSubForm && (
                    <SubscriptionFormModal
                        formData={subForm}
                        setFormData={setSubForm}
                        customers={customers}
                        magazines={magazines}
                        memberTypes={memberTypes} // New Prop
                        onSubmit={handleSubSubmit}
                        onClose={() => setShowSubForm(false)}
                    />
                )
            }

            {
                showRenewalModal && renewalSubscription && (
                    <RenewalModal
                        subscription={renewalSubscription}
                        memberTypes={memberTypes}
                        formData={renewalFormData}
                        setFormData={setRenewalFormData}
                        onSubmit={handleRenewalSubmit}
                        onClose={() => {
                            setShowRenewalModal(false);
                            setRenewalSubscription(null);
                        }}
                    />
                )
            }

            {
                showMagForm && (
                    <MagazineFormModal
                        editMode={magEditMode}
                        formData={magForm}
                        setFormData={setMagForm}
                        onSubmit={handleMagSubmit}
                        onClose={() => setShowMagForm(false)}
                    />
                )
            }

            {
                showMemberTypeForm && (
                    <MemberTypeFormModal
                        editMode={memberTypeEditMode}
                        formData={memberTypeForm}
                        setFormData={setMemberTypeForm}
                        onSubmit={handleMemberTypeSubmit}
                        onClose={() => setShowMemberTypeForm(false)}
                        onDelete={() => deleteMemberType(memberTypeEditId)}
                    />
                )
            }

            {
                showAdTypeForm && (
                    <AdTypeFormModal
                        editMode={adTypeEditMode}
                        formData={adTypeForm}
                        setFormData={setAdTypeForm}
                        onSubmit={handleAdTypeSubmit}
                        onClose={() => setShowAdTypeForm(false)}
                        onDelete={() => deleteAdType(adTypeEditId)}
                    />
                )
            }


            {
                showAdForm && (
                    <AdvertisementFormModal
                        editMode={adEditMode}
                        formData={adForm}
                        setFormData={setAdForm}
                        onSubmit={handleAdSubmit}
                        onClose={() => setShowAdForm(false)}
                        onSaveSuccess={() => fetchData('advertisements')}
                        customers={customers}
                        onDownloadInvoice={downloadPDF}
                        adTypes={adTypes}
                        showNotification={showNotification}
                    />
                )
            }


            {/* Notification */}
            {
                notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )
            }

            {/* Loading Overlay */}
            {loading && <LoadingSpinner />}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onClose={closeConfirm}
            />

            {
                showSuccessModal && successData && (
                    <OrderSuccessModal
                        customerName={successData.customerName}
                        invoice={successData.invoice}
                        onDownload={downloadPDF}
                        onClose={() => setShowSuccessModal(false)}
                    />
                )
            }

            <ErrorModal
                isOpen={errorModal.isOpen}
                title={errorModal.title}
                message={errorModal.message}
                subErrors={errorModal.subErrors}
                onClose={() => setErrorModal({ ...errorModal, isOpen: false, subErrors: undefined })}
            />

            <PasswordPromptModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                onSuccess={() => {
                    setView('analytics');
                    setShowPasswordModal(false);
                }}
                title="Analytics Access"
                message="Please enter the Admin Action Password."
                endpoint="/api/admin/verify-analytics"
            />

            <PasswordPromptModal
                isOpen={showDeletePasswordModal}
                onClose={() => {
                    setShowDeletePasswordModal(false);
                    setCustomerToDelete(null);
                }}
                onSuccess={handleDeletePasswordSuccess}
                title="Delete Customer - Authorization"
                message="Please enter the **Admin Action Password** to delete this customer."
            />

            {
                showEditDateModal && subscriptionToEdit && (
                    <EditSubscriptionDateModal
                        isOpen={showEditDateModal}
                        onClose={() => {
                            setShowEditDateModal(false);
                            setSubscriptionToEdit(null);
                        }}
                        subscription={subscriptionToEdit}
                        dateType={editDateType}
                        onSave={handleSaveSubscriptionDate}
                    />
                )
            }
            {
                showSubDetailModal && selectedSubscriptionForModal && (
                    <SubscriptionDetailModal
                        subscription={selectedSubscriptionForModal}
                        onClose={() => {
                            setShowSubDetailModal(false);
                            setSelectedSubscriptionForModal(null);
                        }}
                        onRenewClick={(sub) => {
                            setShowSubDetailModal(false);
                            setSelectedSubscriptionForModal(null);
                            handleRenewClick(sub);
                        }}
                        onDownloadPDF={handleDownloadSubscriptionInvoice}
                        onOpenProfile={(cust) => {
                            setShowSubDetailModal(false);
                            setSelectedSubscriptionForModal(null);
                            openCustomerDetails(cust);
                        }}
                        onEditSubscriptionDate={handleEditSubscriptionDate}
                        onEditSubscription={(sub) => {
                            setShowSubDetailModal(false);
                            setSelectedSubscriptionForModal(null);
                            handleRenewClick(sub);
                        }}
                    />
                )
            }
        </div >
    );
};

export default Admin;
