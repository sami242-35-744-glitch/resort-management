const API_BASE = '/api';

// On Application Load
document.addEventListener('DOMContentLoaded', () => {
    fetchAnalytics();
    fetchRooms();
});

// Dynamic Tab Switching System
function switchTab(tabId, event) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(`tab-${tabId}`).classList.add('active');
    if (event) event.currentTarget.classList.add('active');

    if (tabId === 'dashboard') fetchAnalytics();
    fetchRooms();
}

// Fetch Analytics Metrics
async function fetchAnalytics() {
    try {
        const res = await fetch(`${API_BASE}/analytics`);
        const result = await res.json();
        if (result.success) {
            const data = result.analytics;
            document.getElementById('metric-total-rooms').innerText = data.totalRooms;
            document.getElementById('metric-occupied-rooms').innerText = data.occupiedRooms;
            document.getElementById('metric-occupancy-rate').innerText = data.occupancyRate;
            document.getElementById('metric-revenue').innerText = data.totalRevenue;
        }
    } catch (err) {
        console.error("Error fetching analytics:", err);
    }
}

// Fetch Rooms & Render Tables
async function fetchRooms() {
    try {
        const res = await fetch(`${API_BASE}/rooms`);
        const result = await res.json();
        
        if (result.success) {
            const rooms = result.data;

            // 1. Render Dashboard Rooms
            const dashTable = document.getElementById('dashboard-room-list');
            dashTable.innerHTML = rooms.map(r => `
                <tr>
                    <td><strong>#${r.id}</strong></td>
                    <td>${r.type}</td>
                    <td>${r.category}</td>
                    <td>BDT ${r.price}</td>
                    <td><span class="badge ${r.status.toLowerCase()}">${r.status}</span></td>
                    <td><span class="badge ${r.housekeeping.toLowerCase()}">${r.housekeeping}</span></td>
                </tr>
            `).join('');

            // 2. Populate Booking Dropdown
            const select = document.getElementById('bookingRoomSelect');
            const availableRooms = rooms.filter(r => r.status === 'Available');
            
            if (availableRooms.length === 0) {
                select.innerHTML = `<option value="">No Available Rooms</option>`;
            } else {
                select.innerHTML = availableRooms.map(r => 
                    `<option value="${r.id}">Room ${r.id} - ${r.type} (BDT ${r.price}/night)</option>`
                ).join('');
            }

            // 3. Render Front Desk Table
            const fdTable = document.getElementById('frontdesk-table');
            fdTable.innerHTML = rooms.map(r => `
                <tr>
                    <td><strong>#${r.id}</strong></td>
                    <td>${r.type}</td>
                    <td><span class="badge ${r.status.toLowerCase()}">${r.status}</span></td>
                    <td>
                        ${r.status === 'Available' ? `<button class="btn btn-sm btn-primary" onclick="triggerFrontDeskAction(${r.id}, 'check-in')">Check In</button>` : ''}
                        ${r.status === 'Occupied' || r.status === 'Booked' ? `<button class="btn btn-sm btn-secondary" onclick="triggerFrontDeskAction(${r.id}, 'check-out')">Check Out</button>` : ''}
                    </td>
                </tr>
            `).join('');

            // 4. Render Housekeeping Table
            const hkTable = document.getElementById('housekeeping-table');
            hkTable.innerHTML = rooms.map(r => `
                <tr>
                    <td><strong>#${r.id}</strong></td>
                    <td>${r.type}</td>
                    <td><span class="badge ${r.housekeeping.toLowerCase()}">${r.housekeeping}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="updateHousekeeping(${r.id}, 'Clean')">Set Clean</button>
                        <button class="btn btn-sm btn-secondary" onclick="updateHousekeeping(${r.id}, 'Dirty')">Set Dirty</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (err) {
        showAlert("Server Connection Failed!", "error");
    }
}

// Handle Room Booking Submission
async function handleBookingSubmit(e) {
    e.preventDefault();
    const guestName = document.getElementById('guestName').value;
    const roomId = document.getElementById('bookingRoomSelect').value;
    const checkIn = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;

    if (!roomId) {
        showAlert("Please select a valid room!", "error");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guestName, roomId, checkIn, checkOut })
        });
        const data = await res.json();

        if (data.success) {
            showAlert(`Booking Reserved! ID: ${data.booking.id}`, "success");
            fetchRooms();
            e.target.reset();
        } else {
            showAlert(data.message, "error");
        }
    } catch (err) {
        showAlert("Failed to process booking.", "error");
    }
}

// Execute Front Desk Actions
async function triggerFrontDeskAction(roomId, action) {
    const res = await fetch(`${API_BASE}/frontdesk/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, action })
    });
    const data = await res.json();
    if (data.success) {
        showAlert(data.message, "success");
        fetchRooms();
    }
}

// Execute Housekeeping Updates
async function updateHousekeeping(roomId, status) {
    const res = await fetch(`${API_BASE}/housekeeping/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, status })
    });
    const data = await res.json();
    if (data.success) {
        showAlert(data.message, "success");
        fetchRooms();
    }
}

// Handle Room Service Food Orders
async function handleFoodOrder(e) {
    e.preventDefault();
    const roomNumber = document.getElementById('foodRoomNo').value;
    const items = document.getElementById('foodItems').value;
    const total = document.getElementById('foodTotal').value;

    const res = await fetch(`${API_BASE}/restaurant/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomNumber, items, total })
    });
    const data = await res.json();
    if (data.success) {
        showAlert("Order dispatched to kitchen POS!", "success");
        e.target.reset();
        fetchAnalytics();
    }
}

// Alert Notification Manager
function showAlert(message, type) {
    const alertBox = document.getElementById('alert-banner');
    alertBox.className = `alert ${type}`;
    alertBox.innerText = message;
    alertBox.classList.remove('hidden');

    setTimeout(() => {
        alertBox.classList.add('hidden');
    }, 4000);
}
