const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { fork, spawn } = require('child_process');
const kill = require('tree-kill');
const fs = require('fs');
const os = require('os');
const http = require('http');
const net = require('net');

let mainWindow;
let serverProcess;
let backupInterval;
let lastBackupDate;
let backupPath;
let isMonitoringStarted = false;
const MONGO_HOST = '127.0.0.1';
const MONGO_PORT = 27017;
const SERVER_PORT = Number(process.env.SERVER_PORT || process.env.PORT || 5055);

function getWindowsLocalAppDataRoot() {
    return process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
}

function getRuntimeRootDir() {
    return path.join(getWindowsLocalAppDataRoot(), 'Aachi Vanthachu');
}

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    return dirPath;
}

function configureRuntimePaths() {
    const runtimeRoot = ensureDir(getRuntimeRootDir());
    const userDataPath = ensureDir(path.join(runtimeRoot, 'UserData'));
    const sessionDataPath = ensureDir(path.join(runtimeRoot, 'SessionData'));

    app.setPath('userData', userDataPath);
    app.setPath('sessionData', sessionDataPath);

    console.log(`Runtime root: ${runtimeRoot}`);
    console.log(`Electron userData path: ${userDataPath}`);
    console.log(`Electron sessionData path: ${sessionDataPath}`);
}

function getMongoDataDir() {
    return ensureDir(path.join(app.getPath('userData'), 'mongodb-data'));
}

function getMongoLogPath() {
    return path.join(app.getPath('userData'), 'logs', 'mongod.log');
}

function resolveExistingPath(candidates) {
    for (const candidate of candidates) {
        if (candidate && fs.existsSync(candidate)) {
            return candidate;
        }
    }

    return null;
}

function getServerEnv() {
    return {
        ...process.env,
        PORT: String(SERVER_PORT),
        NODE_ENV: app.isPackaged ? 'production' : (process.env.NODE_ENV || 'development'),
        MONGODB_URI: process.env.MONGODB_URI || `mongodb://${MONGO_HOST}:${MONGO_PORT}/magazine_erp`,
        JWT_SECRET: process.env.JWT_SECRET || '9f3c6f8c97e4a2d1b5f0e9c7a4b2d8f61c0e7a9b3f4d2e8c6a5b9d1f7e0c4a2',
        ADMIN_ACTION_PASSWORD: process.env.ADMIN_ACTION_PASSWORD || 'AACHI@123',
        DB_RESET_PASSWORD: process.env.DB_RESET_PASSWORD || 'AACHI@123'
    };
}

function waitForTcpPort(host, port, timeoutMs = 15000, intervalMs = 300) {
    return new Promise((resolve) => {
        const deadline = Date.now() + timeoutMs;

        const attempt = () => {
            const socket = new net.Socket();
            let settled = false;

            const finish = (result) => {
                if (settled) return;
                settled = true;
                socket.destroy();
                resolve(result);
            };

            socket.setTimeout(1500);

            socket.once('connect', () => finish(true));
            socket.once('timeout', () => {
                if (Date.now() >= deadline) {
                    finish(false);
                    return;
                }
                socket.destroy();
                setTimeout(attempt, intervalMs);
            });
            socket.once('error', () => {
                if (Date.now() >= deadline) {
                    finish(false);
                    return;
                }
                setTimeout(attempt, intervalMs);
            });

            socket.connect(port, host);
        };

        attempt();
    });
}

function waitForServerHealth(timeoutMs = 30000, intervalMs = 500) {
    return new Promise((resolve) => {
        const deadline = Date.now() + timeoutMs;

        const attempt = () => {
            makeHttpRequest(`http://${MONGO_HOST}:${SERVER_PORT}/api/health`)
                .then((data) => {
                    if (data?.database === 'Connected') {
                        resolve(true);
                        return;
                    }

                    if (Date.now() >= deadline) {
                        resolve(false);
                        return;
                    }

                    setTimeout(attempt, intervalMs);
                })
                .catch(() => {
                    if (Date.now() >= deadline) {
                        resolve(false);
                        return;
                    }

                    setTimeout(attempt, intervalMs);
                });
        };

        attempt();
    });
}

function createWindow() {
    // Create the splash window
    const splashWindow = new BrowserWindow({
        width: 500,
        height: 350,
        transparent: false,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        center: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    splashWindow.loadFile(path.join(__dirname, 'splash.html'));

    // Create the main window but keep it hidden
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "Aachi Vanthachu",
        show: false, // Don't show until ready
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        autoHideMenuBar: true
    });

    // Only open DevTools in development
    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }

    // Retry loading URL until server is ready
    const loadURL = () => {
        // In development, load from Vite dev server (5173) to get latest changes
        // In production, load from the backend server which serves the static build
        const targetUrl = !app.isPackaged ? 'http://127.0.0.1:5173' : `http://${MONGO_HOST}:${SERVER_PORT}`;

        console.log(`Loading URL: ${targetUrl}`);

        mainWindow.loadURL(targetUrl)
            .then(() => {
                // Server is ready and page loaded

                // Add a small delay to ensure React has mounted
                setTimeout(() => {
                    if (splashWindow && !splashWindow.isDestroyed()) {
                        splashWindow.close();
                    }
                    if (mainWindow) {
                        mainWindow.show();
                        mainWindow.focus();
                    }
                }, 300); // Reduced delay for faster startup (was 1500)
            })
            .catch((err) => {
                console.log(`Server not ready, retrying... (${err.message})`);
                setTimeout(loadURL, 200); // Check more frequently (was 1000)
            });
    };

    // Give it a brief moment then start probing
    setTimeout(loadURL, 100);

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

// IPC Handler for saving PDF
ipcMain.handle('save-pdf', async (event, data, filename) => {
    try {
        const targetDir = path.join(app.getPath('downloads'), 'Invoice');

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const filePath = path.join(targetDir, filename);
        // data comes as an array of bytes (from ArrayBuffer)
        const buffer = Buffer.from(data);
        fs.writeFileSync(filePath, buffer);
        console.log(`Saved PDF to: ${filePath}`);
        return { success: true, path: filePath };
    } catch (err) {
        console.error('Failed to save PDF:', err);
        return { success: false, error: err.message };
    }
});

// IPC Handler for saving reports
ipcMain.handle('save-report', async (event, data, filename) => {
    try {
        const targetDir = path.join(app.getPath('downloads'), 'Reports');

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const filePath = path.join(targetDir, filename);
        // data comes as an array of bytes (from ArrayBuffer)
        const buffer = Buffer.from(data);
        fs.writeFileSync(filePath, buffer);
        console.log(`Saved report to: ${filePath}`);
        return { success: true, path: filePath };
    } catch (err) {
        console.error('Failed to save report:', err);
        return { success: false, error: err.message };
    }
});

// IPC Handler for automatic backup
ipcMain.handle('perform-backup', async (event) => {
    return await performBackup();
});

// IPC Handler to start backup monitoring
ipcMain.handle('start-backup-monitoring', async (event) => {
    startBackupMonitoring();
    return { success: true };
});

// IPC Handler to stop backup monitoring
ipcMain.handle('stop-backup-monitoring', async (event) => {
    stopBackupMonitoring();
    return { success: true };
});

// IPC Handler to get current backup path
ipcMain.handle('get-backup-path', async () => {
    try {
        if (!backupPath) {
            backupPath = path.join(app.getPath('downloads'), 'Backups');
        }
        return backupPath;
    } catch (err) {
        console.error('Failed to get backup path:', err);
        return null;
    }
});

// IPC Handler to select backup path
ipcMain.handle('select-backup-path', async () => {
    try {
        if (!mainWindow) return { success: false, error: 'Main window not available' };

        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory', 'createDirectory'],
            title: 'Select Backup Folder',
            buttonLabel: 'Select Folder'
        });

        if (!result.canceled && result.filePaths.length > 0) {
            backupPath = result.filePaths[0];
            saveBackupState();
            return { success: true, path: backupPath };
        }
        return { success: false, canceled: true };
    } catch (err) {
        console.error('Failed to select backup path:', err);
        return { success: false, error: err.message };
    }
});

// IPC Handler to get backup state (path and last date)
ipcMain.handle('get-backup-state', async () => {
    try {
        if (!backupPath) {
            backupPath = path.join(app.getPath('downloads'), 'Backups');
        }
        return {
            path: backupPath,
            lastDate: lastBackupDate || 'Never'
        };
    } catch (err) {
        console.error('Failed to get backup state:', err);
        return { path: '', lastDate: 'Error' };
    }
});

// Global Error Handlers
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});

// Function to perform automatic backup
async function performBackup() {
    try {
        console.log('Starting automatic backup...');

        // Call the auto-backup endpoint using Node.js http
        const backupData = await makeHttpRequest(`http://${MONGO_HOST}:${SERVER_PORT}/api/admin/auto-backup`, 'POST');

        // Create backup directory
        const targetBackupDir = backupPath || path.join(app.getPath('downloads'), 'Backups');

        // Attempt to save to the primary/selected location
        try {
            if (!fs.existsSync(targetBackupDir)) {
                fs.mkdirSync(targetBackupDir, { recursive: true });
            }

            // Try writing the file
            const result = await writeBackupFile(targetBackupDir, backupData);

            // If strictly successful, return it
            if (result.success) {
                return result;
            }

            // If writeBackupFile returned {success: false}, treat it as a failure to trigger fallback
            throw new Error(result.error);

        } catch (primaryErr) {
            console.error(`Primary backup location failed (${targetBackupDir}):`, primaryErr.message);
            console.log('Attempting fallback to User Data directory...');

            // Fallback logic: Use App User Data Directory (Guaranteed writable)
            const fallbackDir = path.join(app.getPath('userData'), 'Backups');

            if (!fs.existsSync(fallbackDir)) {
                fs.mkdirSync(fallbackDir, { recursive: true });
            }

            // Retry write in fallback location
            const fallbackResult = await writeBackupFile(fallbackDir, backupData);
            if (fallbackResult.success && mainWindow) {
                mainWindow.webContents.send('backup-info', fallbackResult);
            }
            return fallbackResult;
        }

    } catch (err) {
        console.error('Backup failed completely:', err.message);
        return { success: false, error: err.message };
    }
}

// Helper to write backup file with proper error handling
async function writeBackupFile(directory, data) {
    try {
        // Generate filename with date and time
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
        const filename = `magzone_backup_${dateStr}_${timeStr}.json`;
        const filePath = path.join(directory, filename);

        // Write backup file
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        // Update last backup date
        lastBackupDate = new Date().toDateString();
        saveBackupState();

        console.log(`Backup completed successfully: ${filePath}`);
        const result = { success: true, path: filePath, date: lastBackupDate };
        if (mainWindow) {
            mainWindow.webContents.send('backup-info', result);
        }
        return result;
    } catch (err) {
        console.error('Failed to write backup file:', err);
        return { success: false, error: `Permission Denied or Disk Full: ${err.message}` };
    }
}

// Function to check if backup is needed (once per day)
function shouldPerformBackup() {
    const today = new Date().toDateString();
    return lastBackupDate !== today;
}

// Function to start backup monitoring
function startBackupMonitoring() {
    console.log('Starting backup monitoring...');

    // Load previous backup state
    loadBackupState();

    // Check immediately
    if (shouldPerformBackup()) {
        performBackup();
    }

    // Set up interval to check every hour
    backupInterval = setInterval(() => {
        if (shouldPerformBackup()) {
            performBackup();
        }
    }, 60 * 60 * 1000); // Check every hour
}

// Function to stop backup monitoring
function stopBackupMonitoring() {
    if (backupInterval) {
        clearInterval(backupInterval);
        backupInterval = null;
        console.log('Backup monitoring stopped');
    }
}

// Function to save backup state
function saveBackupState() {
    try {
        const stateFile = path.join(app.getPath('userData'), 'backup-state.json');
        const state = {
            lastBackupDate: lastBackupDate,
            backupPath: backupPath
        };
        fs.writeFileSync(stateFile, JSON.stringify(state));
    } catch (err) {
        console.error('Failed to save backup state:', err);
    }
}

// Function to load backup state
function loadBackupState() {
    try {
        const stateFile = path.join(app.getPath('userData'), 'backup-state.json');
        if (fs.existsSync(stateFile)) {
            const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
            lastBackupDate = state.lastBackupDate;
            backupPath = state.backupPath;
        }
    } catch (err) {
        console.error('Failed to load backup state:', err);
    }
}

// Function to make HTTP request using Node.js built-in modules
function makeHttpRequest(url, method = 'GET') {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(JSON.parse(data));
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                } catch (err) {
                    reject(err);
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (method === 'POST') {
            req.write(JSON.stringify({}));
        }

        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

function startServer() {
    const isDev = !app.isPackaged;
    const serverScript = isDev
        ? path.join(__dirname, '../server/index.js')
        : resolveExistingPath([
            path.join(process.resourcesPath, 'server/index.js'),
            path.join(process.resourcesPath, 'app/server/index.js'),
            path.join(__dirname, '../server/index.js')
        ]);

    if (!serverScript) {
        console.error('Server entrypoint not found in any expected packaged location.');
        return;
    }

    const serverCwd = path.dirname(serverScript);

    console.log(`Starting server from: ${serverScript}`);

    // Fork the server process
    serverProcess = fork(serverScript, [], {
        cwd: serverCwd,
        env: getServerEnv(),
        silent: false // let stdout flow to electron console
    });

    serverProcess.on('error', (err) => {
        console.error('Failed to start server:', err);
    });
}

function startMongoDBService() {
    return new Promise((resolve) => {
        console.log('Attempting to start MongoDB Windows Service...');

        const { exec } = require('child_process');
        
        // Try to start the MongoDB service
        exec('net start MongoDB', { windowsHide: true }, (error, stdout, stderr) => {
            if (error) {
                // Service might already be running or not installed
                if (error.message.includes('already being provided')) {
                    console.log('MongoDB service is already running.');
                    resolve(true);
                } else if (error.message.includes('service has not been started')) {
                    // Service exists but wasn't running, try again
                    console.log('MongoDB service was not running, starting now...');
                    setTimeout(() => {
                        exec('net start MongoDB', { windowsHide: true }, (retryError) => {
                            if (retryError) {
                                console.error('Failed to start MongoDB service:', retryError.message);
                                resolve(false);
                            } else {
                                console.log('MongoDB service started successfully.');
                                resolve(true);
                            }
                        });
                    }, 500);
                } else {
                    console.warn('MongoDB service start warning:', error.message);
                    console.log('Checking if MongoDB is already running...');
                    resolve(false);
                }
            } else {
                console.log('MongoDB service started successfully.');
                resolve(true);
            }
        });
    });
}

function startMongoDB() {
    return new Promise((resolve) => {
        console.log('Starting MongoDB initialization...');

        // First, try to start the MongoDB Windows Service
        startMongoDBService().then((serviceStarted) => {
            console.log(`MongoDB service start attempt: ${serviceStarted ? 'Success' : 'Failed or already running'}`);

            // Give service time to start if it was just launched
            const delayMs = serviceStarted ? 3000 : 1000;
            setTimeout(() => {
                // Now check if MongoDB is accessible on port 27017
                waitForTcpPort(MONGO_HOST, MONGO_PORT, 20000, 500)
                    .then((portReady) => {
                        if (portReady) {
                            console.log('✓ MongoDB is ready to accept connections');
                            resolve(true);
                        } else {
                            console.error('✗ MongoDB did not become ready within the timeout window');
                            console.log('Info: Ensure MongoDB Windows Service is installed and running, or MongoDB Compass is connected');
                            resolve(false);
                        }
                    });
            }, delayMs);
        });
    });
}

app.on('ready', async () => {
    configureRuntimePaths();
    loadBackupState();

    const serverEnv = getServerEnv();
    Object.assign(process.env, serverEnv);

    // Start MongoDB first
    console.log('Initializing Database...');
    const mongoStarted = await startMongoDB();

    if (mongoStarted) {
        console.log('Database initialized successfully.');
    } else {
        console.warn('Database initialization warning. Checking connection...');
    }

    startServer();
    const backendReady = await waitForServerHealth(45000, 700);
    if (!backendReady) {
        console.warn('Backend did not report a healthy database connection before UI launch.');
    }
    createWindow();

    // Start monitoring after a short delay
    setTimeout(() => {
        if (!isMonitoringStarted) {
            startBackupMonitoring();
            isMonitoringStarted = true;
        }
    }, 15000); // 15s after startup
});

// Monitoring is started in app.on('ready')

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
    // MongoDB service is now managed by Windows, no process to kill
    console.log('Application shutting down...');
});

// ========== LICENSE SYSTEM DISABLED ==========
// All licensing logic below is commented out.
// Stub IPC handlers are provided so the app doesn't crash if anything calls them.

// const { machineIdSync } = require('node-machine-id');
// const axios = require('axios');
// const crypto = require('crypto');
// const LICENSE_SERVER_URL = 'http://localhost:5001/api/license';
// const LICENSE_FILE = path.join(app.getPath('userData'), 'license.json');
// ... all license functions and IPC handlers commented out ...

// Stub IPC handlers (LICENSE DISABLED)
ipcMain.handle('check-license', async () => {
    return { valid: true, license: { status: 'active', type: 'Lifetime', clientName: 'Licensed User' } };
});

ipcMain.handle('activate-license', async () => {
    return { success: true };
});

ipcMain.handle('get-machine-id', () => {
    return 'LICENSE-DISABLED';
});

// ========== ORIGINAL LICENSE CODE (COMMENTED OUT) ==========
/*
function getMachineId() {
    try {
        return machineIdSync();
    } catch (e) {
        console.error('Failed to get machine ID', e);
        return 'UNKNOWN-MACHINE-ID';
    }
}

const ALGORITHM = 'aes-256-cbc';

function getEncryptionKey() {
    const machineId = getMachineId();
    return crypto.createHash('sha256').update(machineId).digest();
}

function encryptData(dataObject) { ... }
function decryptData(encryptedObject) { ... }

ipcMain.handle('check-license', async () => { ... });
ipcMain.handle('activate-license', async (event, key) => { ... });
ipcMain.handle('get-machine-id', () => { ... });
*/

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});
