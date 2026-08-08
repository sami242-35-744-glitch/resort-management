// ==========================================
// GRAND PALACE RESORT & SPA - SCRIPT (FETCH CONNECTED)
// ==========================================

let currentRole = 'admin'; // 'admin' or 'guest'

let currentUser = {
    role: 'ADMINISTRATOR',
    name: 'MD. EMTIAZ HOSSAIN SAMI',
    email: 'admin@grandpalace.com',
    phone: '+8801700000000',
    avatar: 'Md. EmTIAZ hOSSAIN sAMI LOGO.png'
};

// Global Data Arrays (Loaded from Node.js Backend)
let roomList = [];
let bookings = [];
let guests = [];

// Helper Functions
function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getNightsBetween(cIn, cOut) {
    if (!cIn || !cOut) return 1;
    const start = new Date(cIn);
    const end = new Date(cOut);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
}

function autoFillGuestInfo() {
    if (currentUser && currentUser.name && currentUser.name !== 'Valued Guest') {
        const nameInput = document.getElementById('bookingGuestName');
        const emailInput = document.getElementById('bookingGuestEmail');
        const phoneInput = document.getElementById('bookingGuestPhone');

        if (nameInput) nameInput.value = currentUser.name;
        if (emailInput && currentUser.email) emailInput.value = currentUser.email;
        if (phoneInput && currentUser.phone) phoneInput.value = currentUser.phone;
    }
}

// ==========================================
// FETCH ALL DATA FROM NODE.JS BACKEND
// ==========================================
async function fetchAllData() {
    try {
        const [roomsRes, bookingsRes, guestsRes] = await Promise.all([
            fetch('/api/rooms'),
            fetch('/api/bookings'),
            fetch('/api/guests')
        ]);

        roomList = await roomsRes.json();
        bookings = await bookingsRes.json();
        guests = await guestsRes.json();

        populateRoomDropdown();
        renderAll();
        calculateTotal();
    } catch (error) {
        console.error('Error fetching data from Node.js server:', error);
    }
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async function () {
    const savedRole = localStorage.getItem('currentRole');
    const savedUser = localStorage.getItem('currentUser');

    if (savedRole && savedUser) {
        try {
            currentRole = savedRole;
            currentUser = JSON.parse(savedUser);

            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                loginModal.classList.remove('active');
            }
        } catch (e) {
            console.error('Failed to parse saved session user', e);
        }
    }

    initClock();
    setupDefaultDates();
    await fetchAllData();

    const resForm = document.getElementById('reservationForm');
    if (resForm) {
        resForm.addEventListener('change', calculateTotal);
        resForm.addEventListener('input', calculateTotal);
    }

    switchUserRole(currentRole);
});

function initClock() {
    const clockEl = document.getElementById('currentDateDisplay');
    const update = function () {
        const now = new Date();
        if (clockEl) {
            clockEl.innerHTML = '<i class="fa-regular fa-clock"></i> ' +
                now.toLocaleDateString('en-GB') + ' | ' + now.toLocaleTimeString();
        }
    };
    update();
    setInterval(update, 1000);
}

function setupDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const cIn = document.getElementById('checkIn');
    const cOut = document.getElementById('checkOut');

    if (cIn) {
        cIn.min = today;
        if (!cIn.value) cIn.value = today;
    }
    if (cOut) {
        cOut.min = tomorrow;
        if (!cOut.value) cOut.value = tomorrow;
    }
}

function renderAll() {
    renderGuestRooms();
    renderAdminRooms();
    renderDashboard();
    renderFrontDesk();
    renderHousekeeping();
    renderFinance();
    renderGuests();
}

// ==========================================
// GUEST & ADMIN ROOMS RENDER
// ==========================================
function renderGuestRooms() {
    const container = document.getElementById('guestRoomsCardsGrid');
    if (!container) return;

    container.innerHTML = roomList.map(function (room) {
        const isAvailable = room.status === 'available';
        let statusClass = isAvailable ? 'badge-success' : 'badge-danger';

        return `
            <div class="room-card">
                <div class="room-card-img-wrapper">
                    <img src="${escapeHTML(room.img)}" alt="Room ${escapeHTML(room.id)}">
                </div>
                <div style="padding:15px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <h4 style="color:var(--gold);margin:0;">Room ${escapeHTML(room.id)}</h4>
                        <span class="badge ${statusClass}">${escapeHTML(room.status.toUpperCase())}</span>
                    </div>

                    <h5 style="margin:0 0 8px 0; font-size:1rem; color:var(--text-main);">${escapeHTML(room.title)}</h5>
                    <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:12px; min-height:36px;">${escapeHTML(room.desc)}</p>

                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:10px;">
                        <strong style="font-size:1.1rem; color:var(--gold);">
                            ৳${room.price.toLocaleString()} <small style="font-size:0.75rem; color:var(--text-muted);">/night</small>
                        </strong>
                    </div>

                    <div style="margin-top:12px;">
                        ${isAvailable ? `
                            <button type="button" class="btn-primary" style="width:100%;" onclick="bookRoomFromBrowse('${escapeHTML(room.id)}')">
                                <i class="fa-solid fa-calendar-check"></i> Book Now
                            </button>
                        ` : `
                            <button type="button" class="btn-disabled" style="width:100%; opacity:0.6; cursor:not-allowed;" disabled>
                                <i class="fa-solid fa-ban"></i> Room Not Available
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderAdminRooms() {
    const container = document.getElementById('adminRoomsCardsGrid');
    if (!container) return;

    container.innerHTML = roomList.map(function (room) {
        let statusClass = 'badge-danger';
        if (room.status === 'available') statusClass = 'badge-success';
        else if (room.status === 'dirty' || room.status === 'maintenance') statusClass = 'badge-gold';

        return `
            <div class="room-card">
                <div class="room-card-img-wrapper">
                    <img src="${escapeHTML(room.img)}" alt="Room ${escapeHTML(room.id)}">
                </div>
                <div style="padding:15px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <h4 style="color:var(--gold);margin:0;">Room ${escapeHTML(room.id)}</h4>
                        <span class="badge ${statusClass}">${escapeHTML(room.status.toUpperCase())}</span>
                    </div>

                    <h5 style="margin:0 0 8px 0; font-size:1rem; color:var(--text-main);">${escapeHTML(room.title)}</h5>
                    <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:12px; min-height:36px;">${escapeHTML(room.desc)}</p>

                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-color); padding-top:10px;">
                        <strong style="font-size:1.1rem; color:var(--gold);">
                            ৳${room.price.toLocaleString()} <small style="font-size:0.75rem; color:var(--text-muted);">/night</small>
                        </strong>
                        
                        <div class="admin-room-controls">
                            <button type="button" class="btn-secondary-sm" onclick="editRoomPrice('${escapeHTML(room.id)}')">
                                <i class="fa-solid fa-pen"></i> Price
                            </button>
                            <button type="button" class="btn-secondary-sm" onclick="toggleRoomStatus('${escapeHTML(room.id)}')">
                                <i class="fa-solid fa-rotate"></i> Status
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function orderAddonService(serviceName) {
    const checkbox = document.getElementById('addon-' + serviceName);
    if (checkbox) checkbox.checked = true;
    
    autoFillGuestInfo();
    switchTab('tabBooking');
    calculateTotal();
    alert('✅ "' + serviceName + '" has been added to your booking list!');
}

// ==========================================
// ADMIN ACTIONS (CONNECTED TO SERVER)
// ==========================================
async function promptAddNewRoom() {
    if (currentRole !== 'admin') return;

    const id = prompt('Enter Room ID (e.g. 701):');
    if (!id) return;
    const title = prompt('Enter Room Title:');
    if (!title) return;
    const price = parseFloat(prompt('Enter Room Price per night (BDT):'));
    if (isNaN(price)) return;

    const newRoom = {
        id: id,
        title: title,
        price: price,
        status: 'available',
        img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500',
        desc: 'Newly added room accommodation.'
    };

    const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoom)
    });

    if (res.ok) {
        await fetchAllData();
        alert('✅ New Room Added Successfully!');
    }
}

async function editRoomPrice(roomId) {
    if (currentRole !== 'admin') return;
    const room = roomList.find(r => r.id === roomId);
    if (!room) return;

    const newPrice = parseFloat(prompt('Enter new price for Room ' + room.id + ':', room.price));
    if (!isNaN(newPrice) && newPrice >= 0) {
        const res = await fetch(`/api/rooms/${roomId}/price`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ price: newPrice })
        });

        if (res.ok) {
            await fetchAllData();
            alert('✅ Room ' + room.id + ' price updated to ৳' + newPrice.toLocaleString());
        }
    }
}

async function toggleRoomStatus(roomId) {
    const res = await fetch(`/api/rooms/${roomId}/status`, { method: 'PATCH' });
    if (res.ok) {
        await fetchAllData();
    }
}

// ==========================================
// AUTH & ROLE MANAGEMENT (LOGIN API)
// ==========================================
function switchAuthForm(type) {
    const guestForm = document.getElementById('guestLoginForm');
    const staffForm = document.getElementById('staffLoginForm');
    const btnGuest = document.getElementById('btnGuestAuth');
    const btnStaff = document.getElementById('btnStaffAuth');

    if (type === 'staff') {
        if (guestForm) guestForm.style.display = 'none';
        if (staffForm) staffForm.style.display = 'block';
        if (btnGuest) btnGuest.classList.remove('active');
        if (btnStaff) btnStaff.classList.add('active');
    } else {
        if (guestForm) guestForm.style.display = 'block';
        if (staffForm) staffForm.style.display = 'none';
        if (btnGuest) btnGuest.classList.add('active');
        if (btnStaff) btnStaff.classList.remove('active');
    }
}

async function handleStaffLogin(event) {
    if (event) event.preventDefault();
    const email = document.getElementById('loginEmail')?.value.trim() || '';
    const password = document.getElementById('loginPasswordInput')?.value || '';

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.success) {
        currentRole = 'admin';
        currentUser = data.user;

        localStorage.setItem('currentRole', currentRole);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        document.getElementById('loginModal')?.classList.remove('active');
        switchUserRole('admin');
        alert('Welcome Back, Admin!');
    } else {
        alert('❌ Invalid Credentials! (Use: admin@grandpalace.com / admin123)');
    }
}

function handleGuestLoginSubmit(event) {
    if (event) event.preventDefault();
    const name = document.getElementById('guestAuthName')?.value.trim() || 'Valued Guest';
    const email = document.getElementById('guestAuthEmail')?.value.trim() || '';
    const phone = document.getElementById('guestAuthPhone')?.value.trim() || '';

    currentUser = {
        role: 'GUEST',
        name: name,
        email: email,
        phone: phone,
        avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=c5a880&color=fff'
    };

    currentRole = 'guest';

    localStorage.setItem('currentRole', currentRole);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    document.getElementById('loginModal')?.classList.remove('active');
    switchUserRole('guest');
    autoFillGuestInfo();
    alert('🎉 Welcome ' + name + '!');
}

function switchUserRole(role) {
    currentRole = role;

    localStorage.setItem('currentRole', currentRole);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    const selector = document.getElementById('roleSelector');
    if (selector) selector.value = role;

    document.body.className = 'role-' + role;

    const nameEl = document.getElementById('sidebarUserName');
    const roleEl = document.getElementById('sidebarUserRole');
    const avatarEl = document.getElementById('sidebarUserAvatar');
    const topbarAvatar = document.getElementById('topbarAvatar');

    if (role === 'admin') {
        if (nameEl) nameEl.textContent = 'MD. EMTIAZ HOSSAIN SAMI';
        if (roleEl) roleEl.textContent = 'Role: ADMINISTRATOR';
        if (avatarEl) avatarEl.src = 'Md. EmTIAZ hOSSAIN sAMI LOGO.png';
        if (topbarAvatar) topbarAvatar.src = 'Md. EmTIAZ hOSSAIN sAMI LOGO.png';
        switchTab('tabAdminRooms');
    } else {
        if (nameEl) nameEl.textContent = currentUser.name || 'Valued Guest';
        if (roleEl) roleEl.textContent = 'Role: GUEST';
        if (avatarEl) avatarEl.src = currentUser.avatar;
        if (topbarAvatar) topbarAvatar.src = currentUser.avatar;
        switchTab('tabRooms');
    }
}

function logoutUser() {
    localStorage.removeItem('currentRole');
    localStorage.removeItem('currentUser');

    currentRole = 'guest';
    currentUser = {
        role: 'GUEST',
        name: 'Valued Guest',
        email: '',
        phone: '',
        avatar: 'https://ui-avatars.com/api/?name=Guest&background=c5a880&color=fff'
    };

    document.getElementById('loginModal')?.classList.add('active');
    switchAuthForm('guest');
}

// ==========================================
// NAVIGATION & BOOKING CALCULATOR
// ==========================================
function switchTab(tabId) {
    document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const page = document.getElementById(tabId);
    if (page) page.classList.add('active');

    const nav = document.querySelector(`.nav-item[onclick*="${tabId}"]`);
    if (nav) nav.classList.add('active');

    toggleSidebar(false);
}

function toggleSidebar(forceState) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    if (forceState !== undefined) {
        if (forceState) sidebar.classList.add('open');
        else sidebar.classList.remove('open');
    } else {
        sidebar.classList.toggle('open');
    }
}

function populateRoomDropdown() {
    const select = document.getElementById('roomTypeSelect');
    if (!select) return;

    select.innerHTML = roomList.map(r => `
        <option value="${r.id}|${r.title}|${r.price}">
            Room ${r.id} - ${r.title} (৳${r.price.toLocaleString()}/night)
        </option>
    `).join('');
}

function calculateTotal() {
    const cIn = document.getElementById('checkIn')?.value;
    const cOut = document.getElementById('checkOut')?.value;
    const roomSelect = document.getElementById('roomTypeSelect')?.value;

    const nights = getNightsBetween(cIn, cOut);
    const roomPrice = roomSelect ? parseFloat(roomSelect.split('|')[2]) || 0 : 0;
    const roomTotal = roomPrice * nights;

    let addonsTotal = 0;
    document.querySelectorAll('input[name="foodMenu"]:checked, input[name="amenities"]:checked').forEach(cb => {
        addonsTotal += parseFloat(cb.getAttribute('data-price')) || 0;
    });

    const grandTotal = roomTotal + addonsTotal;

    if (document.getElementById('billNights')) document.getElementById('billNights').textContent = nights + ' Night(s)';
    if (document.getElementById('billRoom')) document.getElementById('billRoom').textContent = '৳' + roomTotal.toLocaleString();
    if (document.getElementById('billAddons')) document.getElementById('billAddons').textContent = '৳' + addonsTotal.toLocaleString();
    if (document.getElementById('billTotal')) document.getElementById('billTotal').textContent = '৳' + grandTotal.toLocaleString();

    return grandTotal;
}

function bookRoomFromBrowse(roomId) {
    const room = roomList.find(r => r.id === roomId);
    if (!room || room.status !== 'available') {
        alert('⚠️ Sorry! This room is currently unavailable.');
        return;
    }

    const select = document.getElementById('roomTypeSelect');
    if (select) select.value = `${room.id}|${room.title}|${room.price}`;

    autoFillGuestInfo();
    switchTab('tabBooking');
    calculateTotal();
}

async function handleBookingSubmit(event) {
    if (event) event.preventDefault();

    const name = document.getElementById('bookingGuestName')?.value.trim();
    const email = document.getElementById('bookingGuestEmail')?.value.trim() || '';
    const phone = document.getElementById('bookingGuestPhone')?.value.trim() || '';
    const roomSelect = document.getElementById('roomTypeSelect')?.value;

    if (!name || !roomSelect) {
        alert('⚠️ Please fill out all required fields.');
        return;
    }

    const parts = roomSelect.split('|');
    const roomId = parts[0];
    const roomTitle = parts[1];
    const total = calculateTotal();

    const bookingId = 'GP-' + Math.floor(1000 + Math.random() * 9000);

    const bookingData = {
        id: bookingId,
        guestName: name,
        guestEmail: email,
        guestPhone: phone,
        roomNumber: roomId,
        roomType: roomTitle,
        checkIn: document.getElementById('checkIn')?.value,
        checkOut: document.getElementById('checkOut')?.value,
        totalBill: total,
        status: 'Confirmed',
        avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=c5a880&color=fff'
    };

    const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
    });

    if (res.ok) {
        await fetchAllData();
        alert('🎉 Booking Confirmed Successfully!\nInvoice ID: ' + bookingId);
        resetForm();

        if (currentRole === 'guest') switchTab('tabRooms');
        else switchTab('tabDashboard');
    }
}

function resetForm() {
    document.getElementById('reservationForm')?.reset();
    setupDefaultDates();
    calculateTotal();
}

// ==========================================
// TABLES RENDER
// ==========================================
function renderDashboard() {
    const totalEl = document.getElementById('statTotalBookings');
    const revEl = document.getElementById('statRevenue');
    const tbody = document.getElementById('dashboardTableBody');

    const rev = bookings.reduce((sum, b) => sum + b.totalBill, 0);

    if (totalEl) totalEl.textContent = bookings.length;
    if (revEl) revEl.textContent = '৳' + rev.toLocaleString();

    if (tbody) {
        tbody.innerHTML = bookings.map(b => `
            <tr>
                <td><img src="${escapeHTML(b.avatar)}" class="avatar-img" style="width:32px;height:32px;" alt=""></td>
                <td><strong>${escapeHTML(b.id)}</strong></td>
                <td>${escapeHTML(b.guestName)}</td>
                <td>Room ${escapeHTML(b.roomNumber)}</td>
                <td><small>${escapeHTML(b.checkIn)} to ${escapeHTML(b.checkOut)}</small></td>
                <td><strong>৳${b.totalBill.toLocaleString()}</strong></td>
                <td><span class="badge badge-success">${escapeHTML(b.status)}</span></td>
            </tr>
        `).join('');
    }
}

function renderFrontDesk() {
    const container = document.getElementById('frontDeskRoomGrid');
    if (!container) return;

    container.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:15px;" class="mt-15">
            ${roomList.map(r => `
                <div style="padding:15px; border-radius:10px; background:var(--bg-card); border-left:4px solid ${r.status === 'available' ? '#48bb78' : '#f56565'}; border-top:1px solid var(--border-color); border-right:1px solid var(--border-color); border-bottom:1px solid var(--border-color);">
                    <h3 style="margin:0;color:var(--gold);">Room ${escapeHTML(r.id)}</h3>
                    <p style="font-size:0.8rem; color:var(--text-muted); margin:4px 0;">${escapeHTML(r.title)}</p>
                    <span class="badge ${r.status === 'available' ? 'badge-success' : 'badge-danger'}">${escapeHTML(r.status.toUpperCase())}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function renderHousekeeping() {
    const tbody = document.getElementById('housekeepingTableBody');
    if (tbody) {
        tbody.innerHTML = roomList.map(r => `
            <tr>
                <td><strong>Room ${escapeHTML(r.id)}</strong></td>
                <td>${escapeHTML(r.title)}</td>
                <td><span class="badge badge-gold">${escapeHTML(r.status.toUpperCase())}</span></td>
                <td>
                    <button type="button" class="btn-secondary-sm" onclick="toggleRoomStatus('${escapeHTML(r.id)}')">
                        <i class="fa-solid fa-broom"></i> Change Status
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

function renderFinance() {
    const tbody = document.getElementById('financeTableBody');
    if (tbody) {
        tbody.innerHTML = bookings.map(b => `
            <tr>
                <td><strong>${escapeHTML(b.id)}</strong></td>
                <td>${escapeHTML(b.guestName)}</td>
                <td><span class="badge badge-gold">ONLINE</span></td>
                <td><strong style="color:#48bb78;">৳${b.totalBill.toLocaleString()}</strong></td>
                <td>${escapeHTML(b.checkIn)}</td>
            </tr>
        `).join('');
    }
}

function renderGuests() {
    const tbody = document.getElementById('guestsTableBody');
    if (tbody) {
        tbody.innerHTML = guests.map(g => `
            <tr>
                <td><img src="https://ui-avatars.com/api/?name=${encodeURIComponent(g.name)}&background=c5a880&color=fff" class="avatar-img" style="width:32px;height:32px;" alt=""></td>
                <td><strong>${escapeHTML(g.name)}</strong></td>
                <td>${escapeHTML(g.email || 'N/A')}</td>
                <td>${escapeHTML(g.phone || 'N/A')}</td>
            </tr>
        `).join('');
    }
}
