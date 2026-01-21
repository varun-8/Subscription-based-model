declare module '*.png';
declare module '*.svg';
declare module '*.jpg';
declare module '*.jpeg';

interface Window {
    electronAPI?: {
        savePDF: (data: Uint8Array, filename: string) => Promise<{ success: boolean; path?: string; error?: string }>;
        saveReport: (data: Uint8Array, filename: string) => Promise<{ success: boolean; path?: string; error?: string }>;
        performBackup: () => Promise<{ success: boolean; path?: string; error?: string; date?: string }>;
        startBackupMonitoring: () => Promise<{ success: boolean }>;
        stopBackupMonitoring: () => Promise<{ success: boolean }>;
        getBackupPath: () => Promise<string>;
        selectBackupPath: () => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
        getBackupState: () => Promise<{ path: string; lastDate: string }>;
        onBackupInfo: (callback: (info: any) => void) => void;
    };
}
