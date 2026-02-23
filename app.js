let currentViewDate = new Date();
let selectedDate = new Date();
let userData = JSON.parse(localStorage.getItem('cycleData')) || { dailyLogs: {}, history: [] };

function renderWeek() {
    const grid = document.getElementById('week-grid');
    const monthDisplay = document.getElementById('month-display');
    grid.innerHTML = '';

    let startOfWeek = new Date(currentViewDate);
    startOfWeek.setDate(currentViewDate.getDate() - currentViewDate.getDay());

    monthDisplay.innerText = startOfWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    for (let i = 0; i < 7; i++) {
        let day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        const dateKey = day.toISOString().split('T')[0];
        
        const isToday = day.toDateString() === new Date().toDateString();
        const isSelected = day.toDateString() === selectedDate.toDateString();
        
        const dayCell = document.createElement('div');
        dayCell.className = `day-cell ${isSelected ? 'selected' : ''}`;
        dayCell.onclick = () => { selectedDate = new Date(day); renderWeek(); };

        let cd = calculateCycleDay(day);
        let statusClasses = getStatusClasses(day, dateKey, cd);

        dayCell.innerHTML = `
            <span class="day-number ${isToday ? 'bold' : ''} ${statusClasses}">${day.getDate()}</span>
            <span class="cycle-day">${cd > 0 ? cd : ''}</span>
        `;
        grid.appendChild(dayCell);
    }
    document.getElementById('selected-date-label').innerText = selectedDate.toDateString();
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

window.onload = renderWeek;
