// --- 1. APP SETUP & MEMORY ---
// Track the date the user is currently looking at in the calendar
let currentViewDate = new Date();
// Track the specific day the user has tapped on
let selectedDate = new Date();
// Load saved data from the phone's storage, or create an empty structure if new
let userData = JSON.parse(localStorage.getItem('cycleData')) || { dailyLogs: {}, history: [] };

// This function runs automatically as soon as the website finishes loading
window.onload = () => {
    console.log("App initialized");
    renderWeek();   // Draw the 7-day calendar view
    updateStatus(); // Light up the buttons for the selected day
};

// --- 2. CALENDAR DRAWING LOGIC ---
function renderWeek() {
    // Connect to the "containers" we created in index.html
    const grid = document.getElementById('week-grid');
    const monthDisplay = document.getElementById('month-display');
    const dateDisplay = document.getElementById('selected-date-display');
    
    // If the grid isn't found, stop the function to prevent a crash
    if (!grid) return;

    // Clear the current calendar so we can draw the fresh one
    grid.innerHTML = '';

    // Find the Sunday of the week we are currently viewing
    let startOfWeek = new Date(currentViewDate);
    startOfWeek.setDate(currentViewDate.getDate() - currentViewDate.getDay());
    
    // Update the Month Name at the top (e.g., "February 2026")
    monthDisplay.innerText = startOfWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Update the Header for the selected day (e.g., "Monday, Feb 23")
    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    dateDisplay.innerText = selectedDate.toLocaleDateString('en-US', dateOptions);

    // Loop 7 times to create the 7 days of the week
    for (let i = 0; i < 7; i++) {
        let day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        
        // dateKey is the unique ID for this day (YYYY-MM-DD)
        const dateKey = day.toISOString().split('T')[0];
        // Check if this specific day is the one the user clicked
        const isSelected = day.toDateString() === selectedDate.toDateString();
        // Check if this specific day is actually "Today" on the real-world calendar
        const isToday = day.toDateString() === new Date().toDateString();
        
        // Create the HTML "Box" for this day
        const dayCell = document.createElement('div');
        dayCell.className = `day-cell ${isSelected ? 'selected' : ''}`;
        
        // When this day is tapped, update the selected date and refresh everything
        dayCell.onclick = () => { 
            selectedDate = new Date(day); 
            renderWeek(); 
            updateStatus(); 
        };

        // Calculate the Cycle Day (CD1, CD2, etc.)
        let cd = calculateCycleDay(day);
        
        // Get visual styles (Red for period, blue for fertile) from our helper function
        let statusClasses = getStatusClasses(day, dateKey, cd);

        // Put the numbers into the Day Box
        // We add a new "today-bold" class if isToday is true
        dayCell.innerHTML = `
            <span class="day-number ${statusClasses} ${isToday ? 'today-bold' : ''}">${day.getDate()}</span>
            <span class="cycle-day">${cd > 0 ? cd : ''}</span>
        `;
        
        // Add this day box into the main calendar grid
        grid.appendChild(dayCell);
    }
}

// --- 3. HELPER FUNCTIONS ---

// Calculates how many days it has been since the most recent period started
function calculateCycleDay(targetDate) {
    let latestStart = null;
    // Loop through all saved logs to find the most recent 'period' entry
    Object.keys(userData.dailyLogs).forEach(dateStr => {
        if (userData.dailyLogs[dateStr].period === 'yes') {
            let d = new Date(dateStr);
            if (d <= targetDate && (!latestStart || d > latestStart)) {
                latestStart = d;
            }
        }
    });
    if (!latestStart) return 0;
    // Math to convert time difference into a number of days
    return Math.floor((targetDate - latestStart) / (86400000)) + 1;
}

// Decides which colors to show on the calendar dates
function getStatusClasses(day, dateKey, cd) {
    let classes = [];
    const log = userData.dailyLogs[dateKey] || {};
    
    // If the user logged a period, add the red color class
    if (log.period === 'yes') classes.push('confirmed-period');
    
    // If user has saved cycle history, calculate a basic fertility window
    let shortest = 28; 
    if (userData.history && userData.history.length >= 6) {
        shortest = Math.min(...userData.history.map(h => h.length));
    }
    // Highlight days in blue that are likely fertile
    if (cd >= (shortest - 20) && cd <= 16) classes.push('fertile-number');

    return classes.join(' ');
}

// Allows the user to skip to the next or previous week
function changeWeek(dir) {
    currentViewDate.setDate(currentViewDate.getDate() + (dir * 7));
    renderWeek();
}

// Handles saving data (Period, LH, etc.) when a button is clicked
function logVal(key, val) {
    const dateStr = selectedDate.toISOString().split('T')[0];
    if (!userData.dailyLogs[dateStr]) userData.dailyLogs[dateStr] = {};

    // If the value clicked is already the saved value, clear it (Toggle Off)
    if (userData.dailyLogs[dateStr][key] === val) {
        delete userData.dailyLogs[dateStr][key];
    } else {
        // Otherwise, save the new value (Toggle On)
        userData.dailyLogs[dateStr][key] = val;
    }

    saveData();
    renderWeek();
    updateStatus();
}

// Updates the buttons and inputs to reflect what is saved for the selected day
function updateStatus() {
    const dateKey = selectedDate.toISOString().split('T')[0];
    const log = userData.dailyLogs[dateKey] || {};
    
    // Reset all buttons to grey first
    document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
    // Highlight Period
    if (log.period) {
        document.querySelector(`button[onclick*="period', '${log.period}'"]`)?.classList.add('active');
    }
    // Highlight LH
    if (log.lh) {
        document.querySelector(`button[onclick*="lh', '${log.lh}'"]`)?.classList.add('active');
    }
    // Highlight Clearblue (cb)
    if (log.cb) {
        document.querySelector(`button[onclick*="cb', '${log.cb}'"]`)?.classList.add('active');
    }
    // Highlight PdG
    if (log.pdg) {
        document.querySelector(`button[onclick*="pdg', '${log.pdg}'"]`)?.classList.add('active');
    }
    // Update the text input and dropdown
    const tempInput = document.getElementById('temp-input');
    const cmSelect = document.getElementById('cm-select');
    if (tempInput) tempInput.value = log.temp || '';
    if (cmSelect) cmSelect.value = log.cm || 'none';
}

// --- 4. DATA EXPORT ---

// Saves a CSV file for opening in Excel or Google Sheets
function downloadCSV() {
    const logs = userData.dailyLogs;
    if (Object.keys(logs).length === 0) return alert("No data yet!");
    const headers = ["Date", "Period", "LH", "Temp", "CM"];
    let csvRows = [headers.join(",")];
    const sortedDates = Object.keys(logs).sort();
    for (const date of sortedDates) {
        const d = logs[date];
        csvRows.push([date, d.period||"", d.lh||"", d.temp||"", d.cm||""].join(","));
    }
    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cycle_analytics.csv`;
    a.click();
}

// Saves a JSON file for technical backup
function downloadBackup() {
    const data = localStorage.getItem('cycleData');
    if (!data) return alert("No data yet!");
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cycle_backup.json`;
    a.click();
}





