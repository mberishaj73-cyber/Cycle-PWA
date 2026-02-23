let currentViewDate = new Date();
let selectedDate = new Date();
let userData = JSON.parse(localStorage.getItem('cycleData')) || { dailyLogs: {}, history: [] };

function renderWeek() {
    const grid = document.getElementById('week-grid');
    const monthDisplay = document.getElementById('month-display');
    const dateDisplay = document.getElementById('selected-date-display');
    
    grid.innerHTML = '';

    // 1. Update the Month/Year at the very top
    let startOfWeek = new Date(currentViewDate);
    startOfWeek.setDate(currentViewDate.getDate() - currentViewDate.getDay());
    monthDisplay.innerText = startOfWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // 2. Update the "Friday, February 27" display for the SELECTED day
    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    dateDisplay.innerText = selectedDate.toLocaleDateString('en-US', dateOptions);

    // 3. Draw the week
    for (let i = 0; i < 7; i++) {
        let day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        const dateKey = day.toISOString().split('T')[0];
        
        const isToday = day.toDateString() === new Date().toDateString();
        const isSelected = day.toDateString() === selectedDate.toDateString();
        
        const dayCell = document.createElement('div');
        dayCell.className = `day-cell ${isSelected ? 'selected' : ''}`;
        
        // This makes the date change when you click
        dayCell.onclick = () => { 
            selectedDate = new Date(day); 
            renderWeek(); 
            updateStatus(); 
        };

        let cd = calculateCycleDay(day);
        let statusClasses = getStatusClasses(day, dateKey, cd);

        dayCell.innerHTML = `
            <span class="day-number ${isToday ? 'bold' : ''} ${statusClasses}">${day.getDate()}</span>
            <span class="cycle-day">${cd > 0 ? cd : ''}</span>
        `;
        grid.appendChild(dayCell);
    }
}

function calculateCycleDay(targetDate) {
    let latestStart = null;
    Object.keys(userData.dailyLogs).forEach(dateStr => {
        if (userData.dailyLogs[dateStr].period) {
            let d = new Date(dateStr);
            if (d <= targetDate && (!latestStart || d > latestStart)) latestStart = d;
        }
    });
    if (!latestStart) return 0;
    return Math.floor((targetDate - latestStart) / (86400000)) + 1;
}

function getStatusClasses(day, dateKey, cd) {
    let classes = [];
    const log = userData.dailyLogs[dateKey] || {};
    
    if (log.period) classes.push('confirmed-period');
    if (log.lh && log.temp && log.pdg) classes.push('confirmed-ovulation');
    
    // Logic for Fertile Days (Shortest - 20)
    let shortest = 28; 
    if (userData.history.length >= 6) {
        shortest = Math.min(...userData.history.map(h => h.length));
    }
    if (cd >= (shortest - 20) && cd <= 16) classes.push('fertile-number');

    return classes.join(' ');
}

function logSymptom(type) {
    const key = selectedDate.toISOString().split('T')[0];
    if (!userData.dailyLogs[key]) userData.dailyLogs[key] = {};
    userData.dailyLogs[key][type] = !userData.dailyLogs[key][type];
    localStorage.setItem('cycleData', JSON.stringify(userData));
    renderWeek();
}

function changeWeek(dir) {
    currentViewDate.setDate(currentViewDate.getDate() + (dir * 7));
    renderWeek();
}

function updateStatus() {
    const dateKey = selectedDate.toISOString().split('T')[0];
    const log = userData.dailyLogs[dateKey] || {};
    
    // 1. Calculate To-Do
    let todo = "None";
    const cd = calculateCycleDay(selectedDate);
    const metrics = calculateMetrics();

    // Check if it's a fertile day (Shortest - 20)
    if (cd >= metrics.fertileStart && cd <= 17) {
        todo = "Test Lh";
    }

    // Check for PdG: 3 days after suspected ovulation
    const peakDay = findLhPeakDay();
    if (peakDay) {
        const daysSincePeak = Math.floor((selectedDate - peakDay) / 86400000);
        if (daysSincePeak >= 2 && !hasThreePositivePdg()) {
            todo = "Test PdG";
        }
    }
    
    document.getElementById('todo-item').innerText = todo;

    // 2. Prediction Logic
    let prediction = "Data needed";
    const cycleDay = calculateCycleDay(selectedDate);
    
    if (peakDay) {
        const diff = Math.floor((selectedDate - peakDay) / 86400000);
        if (diff < 1) prediction = `Ovulation in ${Math.abs(diff) + 1} days`;
        else prediction = `Period in ${14 - diff} days`;
    } else if (cycleDay > 0) {
        prediction = `Ovulation expected CD14`;
    }

    document.getElementById('prediction-text').innerText = prediction;
}

// Helper: Scans logs for 3 consecutive positive PdG tests
function hasThreePositivePdg() {
    let count = 0;
    const dates = Object.keys(userData.dailyLogs).sort();
    for (let date of dates) {
        if (userData.dailyLogs[date].pdg === 'pos') {
            count++;
            if (count >= 3) return true;
        } else {
            count = 0;
        }
    }
    return false;
}

// Helper: Finds the date of the most recent LH positive
function findLhPeakDay() {
    let peak = null;
    for (let date in userData.dailyLogs) {
        if (userData.dailyLogs[date].lh === 'pos') {
            const d = new Date(date);
            if (!peak || d > peak) peak = d;
        }
    }
    return peak;
}

function logVal(field, val) {
    const key = selectedDate.toISOString().split('T')[0];
    if (!userData.dailyLogs[key]) userData.dailyLogs[key] = {};
    userData.dailyLogs[key][field] = val;
    localStorage.setItem('cycleData', JSON.stringify(userData));
    renderWeek();
    updateStatus();
}

function hasThreePositivePdg() {
    // Logic to scan last 3 days for 'pos' PdG
    return false; // Placeholder
}

function findEstimatedOvulation() {
    // Logic to find the CD14 or LH Peak
    return null; // Placeholder
}

window.onload = renderWeek;



