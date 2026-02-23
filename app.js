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
    
    // Clear all active classes first
    document.querySelectorAll('.btn-group button').forEach(btn => btn.classList.remove('active'));

    // 1. Light up the buttons based on saved data
    if (log.period === true) document.querySelector('button[onclick*="period\', true"]').classList.add('active');
    if (log.period === false) document.querySelector('button[onclick*="period\', false"]').classList.add('active');

    if (log.lh === 'pos') document.querySelector('button[onclick*="lh\', \'pos\'"]').classList.add('active');
    if (log.lh === 'neg') document.querySelector('button[onclick*="lh\', \'neg\'"]').classList.add('active');

    if (log.cb === 'none') document.querySelector('button[onclick*="cb\', \'none\'"]').classList.add('active');
    if (log.cb === 'peak') document.querySelector('button[onclick*="cb\', \'peak\'"]').classList.add('active');
    if (log.cb === 'high') document.querySelector('button[onclick*="cb\', \'high\'"]').classList.add('active');

    if (log.pdg === 'pos') document.querySelector('button[onclick*="pdg\', \'pos\'"]').classList.add('active');
    if (log.pdg === 'neg') document.querySelector('button[onclick*="pdg\', \'neg\'"]').classList.add('active');

    // 2. Update Input fields (Temp and CM)
    const tempInput = document.getElementById('temp-input');
    const cmSelect = document.getElementById('cm-select');
    
    tempInput.value = log.temp || '';
    cmSelect.value = log.cm || 'none';

    // 3. Run your existing To-Do and Prediction math
    runCalculations(log);
}

// Separate the math into its own function for cleanliness
function runCalculations(log) {
    // [Insert your existing To-Do and Prediction logic here]
    // Make sure it still updates 'todo-item' and 'prediction-text'
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
    
    // Get the current value stored in the phone's memory
    const currentValue = userData.dailyLogs[key][field];

    // If what we clicked is EXACTLY what is already there, remove it
    if (currentValue === val) {
        delete userData.dailyLogs[key][field];
    } else {
        // Otherwise, save the new value
        userData.dailyLogs[key][field] = val;
    }
    
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







