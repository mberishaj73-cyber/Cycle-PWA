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
    const cd = calculateCycleDay(selectedDate);
    
    // 1. To Do Logic
    let todo = "None";
    let isFertile = document.querySelector('.day-cell.selected .fertile-number');
    let ovDate = findEstimatedOvulation();
    
    if (isFertile) todo = "Test Lh";
    
    // PdG Logic: 3 days after ovulation
    if (ovDate) {
        let diff = Math.floor((selectedDate - ovDate) / 86400000);
        if (diff >= 3 && !hasThreePositivePdg()) {
            todo = "Test PdG";
        }
    }
    document.getElementById('todo-item').innerText = todo;

    // 2. Prediction Logic
    let pred = "--";
    if (ovDate) {
        let diff = Math.floor((ovDate - selectedDate) / 86400000);
        if (diff > 0) pred = `Ovulation in ${diff} days`;
        else {
            let periodDiff = 14 + diff; // Simple 14 day luteal phase
            pred = `Period in ${periodDiff} days`;
        }
    }
    document.getElementById('prediction-text').innerText = pred;

    // Update Input Values in UI
    document.getElementById('temp-input').value = log.temp || '';
    document.getElementById('cm-select').value = log.cm || 'none';
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


