// --- GLOBAL SETTINGS & DATA ---
// currentViewDate tracks which week is currently visible on the screen
let currentViewDate = new Date();
// selectedDate tracks which specific day you have tapped on
let selectedDate = new Date();
// userData pulls your saved logs from the phone's memory, or starts fresh if empty
let userData = JSON.parse(localStorage.getItem('cycleData')) || { dailyLogs: {}, history: [] };

// --- INITIALIZATION ---
// This runs automatically the moment the website finishes loading
window.onload = () => {
    renderWeek();   // Draws the calendar grid
    updateStatus(); // Lights up the buttons for the current day
};

// --- CALENDAR DRAWING ---
function renderWeek() {
    const grid = document.getElementById('week-grid');
    const monthDisplay = document.getElementById('month-display');
    const dateDisplay = document.getElementById('selected-date-display');
    
    // Clear the old calendar before drawing the new one
    grid.innerHTML = '';

    // Calculate the start of the current week (Sunday)
    let startOfWeek = new Date(currentViewDate);
    startOfWeek.setDate(currentViewDate.getDate() - currentViewDate.getDay());
    
    // Update the Month and Year text at the top
    monthDisplay.innerText = startOfWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Update the long date display (e.g., "Monday, February 23")
    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    dateDisplay.innerText = selectedDate.toLocaleDateString('en-US', dateOptions);

    // Loop 7 times to create one box for each day of the week
    for (let i = 0; i < 7; i++) {
        let day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        
        // dateKey is the format used to store data in your logs (YYYY-MM-DD)
        const dateKey = day.toISOString().split('T')[0];
        const isSelected = day.toDateString() === selectedDate.toDateString();
        
        // Create the HTML element for the day
        const dayCell = document.createElement('div');
        dayCell.className = `day-cell ${isSelected ? 'selected' : ''}`;
        
        // When you tap a day, update the selected date and refresh the screen
        dayCell.onclick = () => { 
            selectedDate = new Date(day); 
            renderWeek(); 
            updateStatus(); 
        };

        // Calculate the Cycle Day (CD1, CD2, etc.)
        let cd = calculateCycleDay(day);
        
        // Put the date number and cycle day number inside the cell
        dayCell.innerHTML = `
            <span class="day-number">${day.getDate()}</span>
            <span class="cycle-day">${cd > 0 ? cd : ''}</span>
        `;
        grid.appendChild(dayCell);
    }
}

// --- CYCLE CALCULATIONS ---
function calculateCycleDay(targetDate) {
    let latestStart = null;
    // Look through all your logs to find the most recent "Period: Yes"
    Object.keys(userData.dailyLogs).forEach(dateStr => {
        if (userData.dailyLogs[dateStr].period === 'yes') {
            let d = new Date(dateStr);
            // Update latestStart if this period date is closer to the target date
            if (d <= targetDate && (!latestStart || d > latestStart)) latestStart = d;
        }
    });
    // If no period is found, cycle day is 0
    if (!latestStart) return 0;
    // Difference in time divided by milliseconds in a day + 1
    return Math.floor((targetDate - latestStart) / (86400000)) + 1;
}

// This function adds visual colors (like red for period) to the calendar dots
function getStatusClasses(day, dateKey, cd) {
    let classes = [];
    const log = userData.dailyLogs[dateKey] || {};
    
    if (log.period) classes.push('confirmed-period');
    // If all three ovulation markers are present, add the ovulation style
    if (log.lh && log.temp && log.pdg) classes.push('confirmed-ovulation');
    
    // Simple fertility window logic based on your shortest cycle
    let shortest = 28; 
    if (userData.history.length >= 6) {
        shortest = Math.min(...userData.history.map(h => h.length));
    }
    if (cd >= (shortest - 20) && cd <= 16) classes.push('fertile-number');

    return classes.join(' ');
}

// --- LOGGING DATA ---
// Moves the calendar view forward or backward by one week
function changeWeek(dir) {
    currentViewDate.setDate(currentViewDate.getDate() + (dir * 7));
    renderWeek();
}

// This handles the buttons (Period, LH, etc.)
function logVal(field, val) {
    const key = selectedDate.toISOString().split('T')[0];
    if (!userData.dailyLogs[key]) userData.dailyLogs[key] = {};
    
    const currentValue = userData.dailyLogs[key][field];

    // Toggle logic: If you tap the same button twice, it un-selects it
    if (currentValue === val) {
        delete userData.dailyLogs[key][field];
    } else {
        userData.dailyLogs[key][field] = val;
    }
