import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MdCloudUpload, MdDeleteForever, MdStorage, MdBackup } from 'react-icons/md';



interface DatabaseViewProps {
    showNotification: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
    openConfirm: (title: string, message: string, onConfirm: () => void) => void;
    closeConfirm: () => void;
    handleError: (err: any, msg: string) => void;
}

const DatabaseView: React.FC<DatabaseViewProps> = ({ showNotification, openConfirm, closeConfirm, handleError }) => {

    const [loading, setLoading] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [currentBackupPath, setCurrentBackupPath] = useState('');
    const [lastBackupDate, setLastBackupDate] = useState('Never');

    useEffect(() => {
        const fetchBackupState = async () => {
            if (window.electronAPI && window.electronAPI.getBackupState) {
                const state = await window.electronAPI.getBackupState();
                setCurrentBackupPath(state.path);
                setLastBackupDate(state.lastDate);
            } else if (window.electronAPI && window.electronAPI.getBackupPath) {
                const path = await window.electronAPI.getBackupPath();
                setCurrentBackupPath(path);
            }
        };
        fetchBackupState();

        // Listen for background backup events
        if (window.electronAPI && window.electronAPI.onBackupInfo) {
            window.electronAPI.onBackupInfo((info: any) => {
                if (info.success) {
                    setLastBackupDate(info.date);
                    // Only show notification if we are not currently in the middle of a manual backup 
                    // (to avoid double notifications)
                    if (!loading) {
                        showNotification(`System Auto-Backup Successful`, 'success');
                    }
                }
            });
        }
    }, [loading, showNotification]);

    const handleSelectPath = async () => {
        if (window.electronAPI && window.electronAPI.selectBackupPath) {
            const result = await window.electronAPI.selectBackupPath();
            if (result.success && result.path) {
                setCurrentBackupPath(result.path);
                showNotification('Backup location updated successfully', 'success');
            } else if (result.error) {
                showNotification(`Failed to update location: ${result.error}`, 'error');
            }
        } else {
            showNotification('Automatic backup configuration is only available in the Desktop App.', 'warning');
        }
    };

    const handleManualBackup = async () => {
        try {
            setLoading(true);
            if (window.electronAPI && window.electronAPI.performBackup) {
                const result = await window.electronAPI.performBackup();
                if (result.success) {
                    showNotification(`Backup saved successfully to: ${result.path}`, 'success');
                    if (result.date) setLastBackupDate(result.date);
                } else {
                    showNotification(`Backup failed: ${result.error}`, 'error');
                }
            } else {
                // Fallback to regular export if Electron API not available
                await handleExport();
            }
        } catch (err) {
            handleError(err, 'Failed to create backup');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/admin/export-database', { withCredentials: true });
            const data = res.data;
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `magzone_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            window.URL.revokeObjectURL(url);
            showNotification('Backup downloaded successfully', 'success');
        } catch (err) {
            handleError(err, 'Failed to export database');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!importFile) {
            showNotification('Please select a backup file first', 'warning');
            return;
        }

        openConfirm(
            'Import Database?',
            'Warning: This will OVERWRITE all current data with the data from the backup file. This action cannot be undone. Are you sure?',
            async () => {
                try {
                    closeConfirm();
                    setLoading(true);
                    const reader = new FileReader();

                    reader.onload = async (e) => {
                        try {
                            const content = e.target?.result as string;
                            const data = JSON.parse(content);
                            await axios.post('/api/admin/import-database', { data }, { withCredentials: true });
                            showNotification('Database imported successfully', 'success');
                            setImportFile(null);
                        } catch (err) {
                            handleError(err, 'Failed to parse or import backup file');
                        } finally {
                            setLoading(false);
                        }
                    };
                    reader.readAsText(importFile);
                } catch (err) {
                    handleError(err, 'Failed to read backup file');
                    setLoading(false);
                }
            }
        );
    };

    const handleReset = () => {
        openConfirm(
            'Reset Database?',
            'CRITICAL WARNING: This will DELETE ALL records (customers, subscriptions, invoices, etc.) except for the admin user. This action is PERMANENT. Are you absolutely sure?',
            async () => {
                closeConfirm();
                setPasswordInput('');
                setShowPasswordModal(true);
            }
        );
    };

    const confirmResetWithPassword = async () => {
        if (!passwordInput) {
            showNotification('Password is required', 'warning');
            return;
        }

        try {
            setLoading(true);
            await axios.delete('/api/admin/reset-database', {
                data: { password: passwordInput },
                withCredentials: true
            });

            showNotification('Database reset successfully', 'success');
            setShowPasswordModal(false);
        } catch (err: any) {
            // Handle specifically the 403 for invalid password
            if (err.response && err.response.status === 403) {
                showNotification('Incorrect password', 'error');
            } else {
                handleError(err, 'Failed to reset database');
            }
        } finally {
            setLoading(false);
            setPasswordInput('');
        }
    };

    return (
        <div className="database-view" style={{
            width: '100%',
            padding: '24px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            minHeight: '100vh',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            <div className="view-header" style={{ marginBottom: '32px' }}>
                <h1 style={{
                    margin: 0,
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    letterSpacing: '-0.02em'
                }}>
                    <MdStorage style={{ color: '#4f46e5' }} /> Database Manager
                </h1>
                <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>
                    Securely backup your critical data, restore from archives, or manage system reset.
                </p>
            </div>

            <div className="database-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px'
            }}>
                {/* System Backup Card */}
                <div className="db-card-premium backup-card">
                    <div className="card-header-premium">
                        <div className="icon-wrapper glass-blue">
                            <MdBackup size={28} />
                        </div>
                        <div>
                            <h3>System Backup</h3>
                            <p>Automated & Manual Snapshots</p>
                        </div>
                    </div>

                    <div className="card-content-premium">
                        <div className="info-row">
                            <span className="info-label">Backup Location</span>
                            <code className="info-value path-value" title={currentBackupPath}>
                                {currentBackupPath || 'Default (Downloads)'}
                            </code>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Last Backup</span>
                            <span className="info-value date-value">
                                {lastBackupDate !== 'Never' ? new Date(lastBackupDate).toLocaleString() : 'Never'}
                            </span>
                        </div>
                    </div>

                    <div className="card-actions-premium">
                        <button
                            className="btn-premium btn-secondary-premium"
                            onClick={handleSelectPath}
                            disabled={loading}
                        >
                            Change Path
                        </button>
                        <button
                            className="btn-premium btn-primary-premium"
                            onClick={handleManualBackup}
                            disabled={loading}
                        >
                            {loading ? 'Backing up...' : 'Backup Now'}
                        </button>
                    </div>
                </div>

                {/* Restore Card */}
                <div className="db-card-premium restore-card">
                    <div className="card-header-premium">
                        <div className="icon-wrapper glass-green">
                            <MdCloudUpload size={28} />
                        </div>
                        <div>
                            <h3>Restore Data</h3>
                            <p>Import from Backup File</p>
                        </div>
                    </div>

                    <div className="card-content-premium">
                        <div className="upload-zone">
                            <input
                                type="file"
                                accept=".json"
                                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                id="backup-upload"
                                className="hidden-input"
                            />
                            <label htmlFor="backup-upload" className={`upload-label ${importFile ? 'file-selected' : ''}`}>
                                <span className="upload-icon">📂</span>
                                <span className="upload-text">
                                    {importFile ? importFile.name : 'Click to select backup file (.json)'}
                                </span>
                            </label>
                        </div>
                        <p className="restore-warning">
                            Warning: restoring will <strong>overwrite</strong> all current data.
                        </p>
                    </div>

                    <div className="card-actions-premium">
                        <button
                            className="btn-premium btn-success-premium full-width"
                            onClick={handleImport}
                            disabled={loading || !importFile}
                        >
                            {loading ? 'Restoring...' : 'Restore Database'}
                        </button>
                    </div>
                </div>

                {/* Danger Zone Card */}
                <div className="db-card-premium danger-card">
                    <div className="card-header-premium">
                        <div className="icon-wrapper glass-red">
                            <MdDeleteForever size={28} />
                        </div>
                        <div>
                            <h3>Danger Zone</h3>
                            <p>System Reset & Wipe</p>
                        </div>
                    </div>

                    <div className="card-content-premium">
                        <div className="danger-box">
                            <p>
                                This action will permanently delete all customers, subscriptions, and records.
                                Only the admin account will be preserved.
                            </p>
                            <p><strong>This cannot be undone.</strong></p>
                        </div>
                    </div>

                    <div className="card-actions-premium">
                        <button
                            className="btn-premium btn-danger-premium full-width"
                            onClick={handleReset}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Reset All Data'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="modal-overlay-premium">
                    <div className="modal-content-premium">
                        <div className="modal-header-premium">
                            <h3 style={{ color: '#dc2626', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <MdDeleteForever /> Confirm Reset
                            </h3>
                            <button className="modal-close-premium" onClick={() => setShowPasswordModal(false)}>×</button>
                        </div>
                        <div className="modal-body-premium">
                            <p>Security Check: Please enter the <strong>Database Reset Password</strong>.</p>

                            <input
                                type="password"
                                className="input-premium"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                placeholder="Enter admin password"
                                autoFocus
                            />

                            <div className="modal-footer-premium">
                                <button className="btn-premium btn-secondary-premium" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                                <button
                                    className="btn-premium btn-danger-premium"
                                    onClick={confirmResetWithPassword}
                                    disabled={loading}
                                >
                                    {loading ? 'Wiping Data...' : 'Confirm Wipe'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .db-card-premium {
                    background: white;
                    border-radius: 20px;
                    padding: 24px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.05);
                    border: 1px solid rgba(226, 232, 240, 0.6);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
                    height: 100%;
                }

                .db-card-premium:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                }

                .card-header-premium {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .card-header-premium h3 {
                    margin: 0;
                    font-size: 1.25rem;
                    color: #1e293b;
                    font-weight: 700;
                }

                .card-header-premium p {
                    margin: 4px 0 0;
                    font-size: 0.85rem;
                    color: #64748b;
                }

                .icon-wrapper {
                    width: 56px;
                    height: 56px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }

                .glass-blue { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); color: #3b82f6; }
                .glass-green { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); color: #10b981; }
                .glass-red { background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); color: #ef4444; }

                .card-content-premium {
                    flex: 1;
                    margin-bottom: 24px;
                }

                .info-row {
                    background: #f8fafc;
                    padding: 12px 16px;
                    border-radius: 12px;
                    margin-bottom: 12px;
                    border: 1px solid #e2e8f0;
                }

                .info-label {
                    display: block;
                    font-size: 0.75rem;
                    color: #64748b;
                    font-weight: 600;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                    letter-spacing: 0.05em;
                }

                .info-value {
                    display: block;
                    color: #334155;
                    font-weight: 600;
                    font-size: 0.95rem;
                }

                .path-value {
                    font-family: 'Monaco', monospace;
                    font-size: 0.85rem;
                    word-break: break-all;
                }

                .date-value {
                    color: #0f172a;
                }

                .upload-zone {
                    margin-bottom: 16px;
                }

                .hidden-input {
                    display: none;
                }

                .upload-label {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    border: 2px dashed #cbd5e1;
                    border-radius: 16px;
                    cursor: pointer;
                    background: #f8fafc;
                    transition: all 0.2s ease;
                }

                .upload-label:hover {
                    border-color: #6366f1;
                    background: #eff6ff;
                }

                .upload-label.file-selected {
                    border-color: #10b981;
                    background: #f0fdf4;
                }

                .upload-icon {
                    font-size: 24px;
                    margin-bottom: 8px;
                }

                .upload-text {
                    font-size: 0.9rem;
                    color: #475569;
                    font-weight: 500;
                    text-align: center;
                }

                .restore-warning {
                    font-size: 0.85rem;
                    color: #ef4444;
                    background: #fef2f2;
                    padding: 12px;
                    border-radius: 8px;
                    border: 1px solid #fee2e2;
                    line-height: 1.4;
                    margin: 0;
                }

                .danger-box {
                    padding: 16px;
                    background: #fef2f2;
                    border-radius: 12px;
                    border: 1px solid #fee2e2;
                    color: #b91c1c;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }
                
                .danger-box p { margin: 0 0 8px 0; }
                .danger-box p:last-child { margin: 0; }

                .card-actions-premium {
                    display: flex;
                    gap: 12px;
                }

                .btn-premium {
                    padding: 12px 20px;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 0.95rem;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .btn-premium:active { transform: translateY(1px); }
                .btn-premium:disabled { opacity: 0.7; cursor: not-allowed; }

                .btn-primary-premium {
                    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                    color: white;
                    flex: 1;
                    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);
                }
                .btn-primary-premium:hover:not(:disabled) {
                    box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);
                    transform: translateY(-2px);
                }

                .btn-secondary-premium {
                    background: white;
                    border: 1px solid #e2e8f0;
                    color: #475569;
                    flex: 1;
                }
                .btn-secondary-premium:hover:not(:disabled) {
                    background: #f8fafc;
                    border-color: #cbd5e1;
                    color: #1e293b;
                }

                .btn-success-premium {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
                }
                .btn-success-premium:hover:not(:disabled) {
                    box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4);
                    transform: translateY(-2px);
                }

                .btn-danger-premium {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    color: white;
                    box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.3);
                }
                .btn-danger-premium:hover:not(:disabled) {
                    box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.4);
                    transform: translateY(-2px);
                }

                .full-width { width: 100%; }

                /* Modal Styles */
                .modal-overlay-premium {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 50;
                    animation: fadeIn 0.2s ease-out;
                }

                .modal-content-premium {
                    background: white;
                    border-radius: 20px;
                    width: 90%;
                    max-width: 420px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    overflow: hidden;
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .modal-header-premium {
                    padding: 20px 24px;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #fff1f2;
                }

                .modal-close-premium {
                    background: transparent;
                    border: none;
                    font-size: 24px;
                    color: #94a3b8;
                    cursor: pointer;
                    line-height: 1;
                }

                .modal-body-premium {
                    padding: 24px;
                }

                .input-premium {
                    width: 100%;
                    padding: 12px 16px;
                    margin: 16px 0 24px;
                    border: 1px solid #cbd5e1;
                    border-radius: 12px;
                    font-size: 1rem;
                    outline: none;
                    transition: all 0.2s;
                }

                .input-premium:focus {
                    border-color: #6366f1;
                    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
                }

                .modal-footer-premium {
                    display: flex;
                    gap: 12px;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default DatabaseView;
