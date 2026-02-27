import React, { createContext, useContext } from 'react';

// ========== LICENSE SYSTEM DISABLED ==========
// All license checking is bypassed. isActivated is always true.
// To re-enable, restore the original LicenseContext code.

interface LicenseContextType {
    isActivated: boolean;
    checkLicense: () => Promise<void>;
    activateLicense: (key: string) => Promise<boolean>;
    loading: boolean;
    licenseDetails: any;
    licenseError: string;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // LICENSE DISABLED: Always activated, no loading, no checks
    const isActivated = true;
    const loading = false;
    const licenseDetails = null;
    const licenseError = '';

    const checkLicense = async () => {
        // LICENSE DISABLED: No-op
    };

    const activateLicense = async (_key: string): Promise<boolean> => {
        // LICENSE DISABLED: No-op
        return true;
    };

    return (
        <LicenseContext.Provider value={{ isActivated, checkLicense, activateLicense, loading, licenseDetails, licenseError }}>
            {children}
        </LicenseContext.Provider>
    );
};

export const useLicense = () => {
    const context = useContext(LicenseContext);
    if (!context) {
        throw new Error('useLicense must be used within a LicenseProvider');
    }
    return context;
};
