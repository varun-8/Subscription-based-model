const { machineIdSync } = require('node-machine-id');

function getMachineId() {
    try {
        return machineIdSync();
    } catch (error) {
        // Fallback or handle error
        console.error("Failed to get machine ID:", error);
        return 'UNKNOWN_MACHINE_ID';
    }
}

module.exports = { getMachineId };
