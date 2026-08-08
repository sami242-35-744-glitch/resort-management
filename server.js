const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ১. রুট ফোল্ডার (Root Directory) থেকে সরাসরি static ফাইল (index.html, style.css, script.js) লোড করার জন্য
app.use(express.static(__dirname));

// ==========================================
// IN-MEMORY DATABASE
// ==========================================
let roomList = [
    { id: "101", title: "Single Standard Room", price: 800, status: "available", img: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500", desc: "Cozy room with free Wi-Fi and king bed." },
    { id: "102", title: "Single Executive Room", price: 1000, status: "occupied", img: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=500", desc: "Executive workspace & smart TV." },
    { id: "201", title: "Deluxe Double Room", price: 5000, status: "dirty", img: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=500", desc: "Spacious luxury room designed for couples." },
    { id: "202", title: "Super Deluxe Double Room", price: 7500, status: "available", img: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500", desc: "Balcony access and complimentary breakfast." },
    { id: "301", title: "Executive Double Ocean View", price: 10000, status: "maintenance", img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500", desc: "Panoramic view with luxury ocean deck." },
    { id: "401", title: "Royal Family Suite", price: 20000, status: "occupied", img: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=500", desc: "Multi-bedroom suite for families." },
    { id: "501", title: "Presidential VIP Suite", price: 35000, status: "available", img: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=500", desc: "VIP suite with private lounge." },
    { id: "601", title: "Royal Palace Villa", price: 50000, status: "available", img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500", desc: "Private villa with infinity pool." }
];

let bookings = [
    {
        id: "GP-8801",
        guestName: "Arif Chowdhury",
        guestEmail: "arif@example.com",
        guestPhone: "+8801711112233",
        roomNumber: "401",
        roomType: "Royal Family Suite",
        checkIn: "2026-08-01",
        checkOut: "2026-08-05",
        totalBill: 80000,
        status: "Confirmed",
        avatar: "https://ui-avatars.com/api/?name=Arif+Chowdhury&background=c5a880&color=fff"
    }
];

let guests = [
    { id: "G-101", name: "Arif Chowdhury", email: "arif@example.com", phone: "+8801711112233" }
];

// ==========================================
// API ROUTES
// ==========================================

// Login API
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (email.toLowerCase() === 'admin@grandpalace.com' && password === 'admin123') {
        res.json({
            success: true,
            user: {
                role: 'ADMINISTRATOR',
                name: 'MD. EMTIAZ HOSSAIN SAMI',
                email: email,
                phone: '+8801700000000',
                avatar: 'Md. EmTIAZ hOSSAIN sAMI LOGO.png'
            }
        });
    } else {
        res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }
});

// GET Data
app.get('/api/rooms', (req, res) => res.json(roomList));
app.get('/api/bookings', (req, res) => res.json(bookings));
app.get('/api/guests', (req, res) => res.json(guests));

// Add Room
app.post('/api/rooms', (req, res) => {
    const newRoom = req.body;
    roomList.push(newRoom);
    res.json({ success: true, room: newRoom });
});

// Update Room Price
app.patch('/api/rooms/:id/price', (req, res) => {
    const { id } = req.params;
    const { price } = req.body;
    const room = roomList.find(r => r.id === id);
    if (room) {
        room.price = price;
        res.json({ success: true, room });
    } else {
        res.status(404).json({ success: false, message: 'Room not found' });
    }
});

// Toggle / Change Room Status
app.patch('/api/rooms/:id/status', (req, res) => {
    const { id } = req.params;
    const room = roomList.find(r => r.id === id);
    if (room) {
        const statuses = ['available', 'occupied', 'dirty', 'maintenance'];
        const idx = statuses.indexOf(room.status);
        room.status = statuses[(idx + 1) % statuses.length];
        res.json({ success: true, room });
    } else {
        res.status(404).json({ success: false, message: 'Room not found' });
    }
});

// Create Booking
app.post('/api/bookings', (req, res) => {
    const newBooking = req.body;
    bookings.unshift(newBooking);

    // Sync Guest
    const existingGuest = guests.find(g => (newBooking.guestEmail && g.email === newBooking.guestEmail) || (newBooking.guestPhone && g.phone === newBooking.guestPhone));
    if (!existingGuest) {
        guests.unshift({
            id: 'G-' + Math.floor(100 + Math.random() * 900),
            name: newBooking.guestName,
            email: newBooking.guestEmail,
            phone: newBooking.guestPhone
        });
    }

    // Update Room Status to Occupied
    const room = roomList.find(r => r.id === newBooking.roomNumber);
    if (room) room.status = 'occupied';

    res.json({ success: true, booking: newBooking });
});

// ২. মূল ওয়েবসাইটে ঢুকলে index.html পেজটি দেখানোর জন্য
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Server Listen / Vercel Export
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Node.js Server running on port ${PORT}`);
    });
}

module.exports = app;
