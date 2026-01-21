function saveDate() {
    const dateInput = document.getElementById('start-date').value;
    if (!dateInput) return;

    // Save to LocalStorage (Free & Private)
    localStorage.setItem('lastPeriod', dateInput);
    calculateNext();
}

function calculateNext() {
    const lastDate = localStorage.getItem('lastPeriod');
    if (lastDate) {
        const date = new Date(lastDate);
        // Add 28 days for the next cycle
        date.setDate(date.getDate() + 28); 
        document.getElementById('next-date').innerText = date.toDateString();
    }
}

// Load data when app opens
window.onload = calculateNext;