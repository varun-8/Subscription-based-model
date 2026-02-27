const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    savePDF: (data, filename) => ipcRenderer.invoke('save-pdf', data, filename),
    saveReport: (data, filename) => ipcRenderer.invoke('save-report', data, filename),
    performBackup: () => ipcRenderer.invoke('perform-backup'),
    startBackupMonitoring: () => ipcRenderer.invoke('start-backup-monitoring'),
    stopBackupMonitoring: () => ipcRenderer.invoke('stop-backup-monitoring'),
    getBackupPath: () => ipcRenderer.invoke('get-backup-path'),
    selectBackupPath: () => ipcRenderer.invoke('select-backup-path'),
    getBackupState: () => ipcRenderer.invoke('get-backup-state'),
    onBackupInfo: (callback) => ipcRenderer.on('backup-info', (_event, value) => callback(value)),
    // License
    checkLicense: () => ipcRenderer.invoke('check-license'),
    activateLicense: (key) => ipcRenderer.invoke('activate-license', key),
    getMachineId: () => ipcRenderer.invoke('get-machine-id')
});
