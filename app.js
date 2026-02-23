// Data structure to store in LocalStorage
let userData = JSON.parse(localStorage.getItem('cycleData')) || {
    history: [], // Previous cycles
    dailyLogs: {} // Keyed by date: { temp: 98.2, lh: true, pdg: true, period: true }
};

function calculateMetrics() {
    const history = userData.history.filter(h => !h.abnormal);
    
    // Average cycle length
    const avgLength = history.reduce((a, b) => a + b.length, 0) / history.length || 28;
    
    // Rule 6: Shortest cycle - 20 for fertile start
    const shortest = history.length >= 6 
        ? Math.min(...history.slice(-6).map(h => h.length)) 
        : 28;
    const fertileStartDay = shortest - 20;

    return { avgLength, fertileStartDay };
}

function getDayStatus(dateStr) {
    const logs = userData.dailyLogs[dateStr] || {};
    const metrics = calculateMetrics();
    
    // Logic for confirmed vs predicted
    let status = "";
    
    // 8. Confirmed Ovulation Logic
    if (logs.lhPositive && logs.tempRise && logs.pdgThreeDays) {
        status = "confirmed-ovulation";
    }
    
    // 7. Pushing predicted ovulation
    // (This would be handled in a loop checking for LH tests)
    
    return status;
}

// Load data when app opens

window.onload = calculateNext;
