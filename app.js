let currentViewDate = new Date();
let selectedDate = new Date();

// Load data from phone storage
let userData = JSON.parse(localStorage.getItem('cycleData')) || {
    dailyLogs: {}, // e.g., {"2026-02-22": {lh: true, temp: true}}
    history: []    // e.g., [{start: "2026-01-01", length: 28}]
};

function renderWeek() {
    const grid = document.getElementById('week-grid');
    const monthDisplay = document.getElementById('month-display');
    grid.innerHTML = '';

    // Find Sunday of the week
    let startOfWeek = new Date(currentViewDate);
    startOfWeek.setDate(currentViewDate.getDate() - currentViewDate.getDay());
    
    monthDisplay.innerText = startOfWeek.toLocaleString('default', { month: 'long', year: 'numeric' });

    for (let i = 0; i < 7; i++) {
        let day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        const dateKey = day.toISOString().split('T')[0];
        
        const isToday = day.toDateString() === new Date().toDateString();
        const isSelected = day.toDateString() === selectedDate.toDateString();
        
        const dayCell = document.createElement('div');
        dayCell.className = `day-cell ${isSelected ? 'selected' : ''}`;
        dayCell.onclick = () => { selectedDate = day; renderWeek(); updateStatus(); };

        // Determine CD (Cycle Day) - Looking back for the most recent period start
        let cd = calculateCycleDay(day);

        // Apply Logic Markers (Period, Ovulation, Fertile)
        let statusClasses = getStatusClasses(day, dateKey, cd);

        dayCell.innerHTML = `
            <span class="day-letter ${isToday ? 'today-label' : ''}">${isToday ? 'TODAY' : ['S','M','T','W','T','F','S'][i]}</span>
            <span class="day-number ${isToday ? 'bold' : ''} ${statusClasses}">${day.getDate()}</span>
            <span class="cycle-day">${cd > 0 ? 'CD' + cd : '--'}</span>
        `;
        grid.appendChild(dayCell);
    }
}

function getStatusClasses(day, dateKey, cd) {
    let classes = [];
    const log = userData.dailyLogs[dateKey] || {};
    const metrics = calculateMetrics();

    // 3 & 8. Confirmed vs Predicted Period
    if (log.period) classes.push('confirmed-period');
    else if (isPredictedPeriod(day)) classes.push('predicted-period');

    // 3 & 8. Confirmed vs Predicted Ovulation
    if (log.lh && log.temp && log.pdg) classes.push('confirmed-ovulation');
    else if (isPredictedOvulation(day)) classes.push('predicted-ovulation');

    // 6. Fertile Days (Shortest cycle - 20)
    if (cd >= metrics.fertileStart && cd <= metrics.ovulationDay + 2) {
        classes.push('fertile-number');
    }

    return classes.join(' ');
}

function calculateMetrics() {
    const history = userData.history.filter(h => !h.abnormal);
    const shortest = history.length >= 6 
        ? Math.min(...history.slice(-6).map(h => h.length)) 
        : 28;
    
    return {
        fertileStart: shortest - 20,
        ovulationDay: 14 // Placeholder: refine with avg logic later
    };
}

function calculateCycleDay(targetDate) {
    // Finds the latest period start date before the targetDate
    let latestStart = null;
    Object.keys(userData.dailyLogs).forEach(dateStr => {
        if (userData.dailyLogs[dateStr].period) {
            let d = new Date(dateStr);
            if (d <= targetDate && (!latestStart || d > latestStart)) latestStart = d;
        }
    });
    if (!latestStart) return 0;
    return Math.floor((targetDate - latestStart) / (1000*60*60*24)) + 1;
}

function logSymptom(type) {
    const key = selectedDate.toISOString().split('T')[0];
    if (!userData.dailyLogs[key]) userData.dailyLogs[key] = {};
    
    // Toggle the value
    userData.dailyLogs[key][type] = !userData.dailyLogs[key][type];
    
    localStorage.setItem('cycleData', JSON.stringify(userData));
    renderWeek();
}

function changeWeek(dir) {
    currentViewDate.setDate(currentViewDate.getDate() + (dir * 7));
    renderWeek();
}

// Prediction Placeholders (Logic 7 & 9)
function isPredictedOvulation(day) { /* Logic for pushing by 1 day if no LH */ return false; }
function isPredictedPeriod(day) { return false; }

window.onload = renderWeek;
