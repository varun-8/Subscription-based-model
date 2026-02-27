import React, { useState, useEffect } from 'react';
import { useLicense } from './context/LicenseContext';
import { MdVpnKey, MdLock, MdError, MdCheckCircle, MdComputer, MdWifiOff } from 'react-icons/md';
import './ActivationScreen.css';

const ActivationScreen = () => {
    const [key, setKey] = useState('');
    const [error, setError] = useState('');
    const [activating, setActivating] = useState(false);
    const [machineId, setMachineId] = useState<string>('Loading...');
    const { activateLicense } = useLicense();

    useEffect(() => {
        const fetchMachineId = async () => {
            if (window.electronAPI && window.electronAPI.getMachineId) {
                try {
                    const id = await window.electronAPI.getMachineId();
                    setMachineId(id);
                } catch (e) {
                    setMachineId('Unknown');
                }
            } else {
                setMachineId('Browser Mode');
            }
        };
        fetchMachineId();
    }, []);

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!key.trim()) {
            setError('Please enter a license key.');
            return;
        }

        setError('');
        setActivating(true);

        try {
            const success = await activateLicense(key.trim());
            if (!success) {
                setError('Invalid license key or activation failed.');
            }
        } catch (err) {
            setError('An error occurred during activation. Check connection.');
        } finally {
            setActivating(false);
        }
    };

    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(machineId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="activation-container">
            <div className="activation-card">
                <div className="activation-header">
                    <div className="activation-icon-wrapper">
                        <MdLock className="activation-icon" />
                    </div>
                    <h1 className="activation-title">Product Activation</h1>
                    <p className="activation-subtitle">
                        Please enter your license key to unlock the full potential of Magproj.
                    </p>
                </div>

                {error && (
                    <div className="error-message">
                        <MdError size={20} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleActivate} className="activation-form">
                    <div className="input-group">
                        <label className="input-label">LICENSE KEY</label>
                        <input
                            type="text"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="XXXX-XXXX-XXXX-XXXX"
                            className="activation-input"
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={activating}
                        className="activation-btn"
                    >
                        {activating ? (
                            <span>Verifying...</span>
                        ) : (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <MdVpnKey /> Activate License
                            </span>
                        )}
                    </button>
                </form>

                <div className="machine-id-section">
                    <div className="machine-id-header">
                        <div className="id-label">
                            <MdComputer size={14} />
                            <span>HARDWARE ID</span>
                        </div>
                        {copied && <span className="copied-toast">Copied!</span>}
                    </div>
                    <div className="machine-id-wrapper" onClick={handleCopy}>
                        <code className="machine-id-box">
                            {machineId}
                        </code>
                        {copied ? <MdCheckCircle className="copy-icon active" /> : <MdVpnKey className="copy-icon" />}
                    </div>

                    {!navigator.onLine && (
                        <div className="offline-notice">
                            <MdWifiOff />
                            <span>System Offline - Validation will retry when online.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivationScreen;
