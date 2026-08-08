const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Setup
app.use(cors());
app.use(express.json());

// Public ফোল্ডার থেকে HTML, CSS, JS এবং Images static ভাবে serve করার জন্য
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// IN-MEMORY DATABASE (Initial Mock Data)
// ==========================================

let roomList = [
    {
        id: '101',
        title: 'Deluxe Ocean View',
        price: 8500,
        status: 'available',
        img: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=500',
        desc: 'Spacious room with modern amenities and a private ocean balcony.'
    },
    {
        id: '102',
        title: 'Executive Royal Suite',
        price: 15500,
        status: 'available',
        img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500',
        desc: 'Luxury suite featuring king bed, living space, and jacuzzi.'
    },
    {
        id: '201',
        title: 'Presidential Suite',
        price: 25000,
        status: 'maintenance',
        img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500',
        desc: 'Top tier luxury experience with dedicated butler service.'
    }
];

let bookings = [
    {
        id: 'GP-1001',
        guestName: 'Tanvir Ahmed',
        guestEmail: 'tanvir@gmail.com',
        guestPhone: '+8801811112223',
        roomNumber: '101',
        roomType: 'Deluxe Ocean View',
        checkIn: '2026-03-10',
        checkOut: '2026-03-12',
        totalBill: 17000,
        status: 'Confirmed',
        avatar: 'https://ui-avatars.com/api/?name=Tanvir+Ahmed&background=c5a880&color=fff'
    }
];

let guests = [
    {
        name: 'Tanvir Ahmed',
        email: 'tanvir@gmail.com',
        phone: '+8801811112223'
    }
];

// Admin Credentials
const ADMIN_USER = {
    role: 'ADMINISTRATOR',
    name: 'MD. EMTIAZ HOSSAIN SAMI',
    email: 'admin@grandpalace.com',
    password: 'admin123',
    phone: '+8801700000000',
    avatar: 'Md. EmTIAZ hOSSAIN sAMI LOGO.png'
};

// ==========================================
// API ENDPOINTS
// ==========================================

// 1. Fetch All Rooms
app.get('/api/rooms', (req, res) => {
    res.json(roomList);
});

// 2. Fetch All Bookings
app.get('/api/bookings', (req, res) => {
    res.json(bookings);
});

// 3. Fetch All Guests
app.get('/api/guests', (req, res) => {
    res.json(guests);
});

// 4. Staff Login Endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (email === ADMIN_USER.email && password === ADMIN_USER.password) {
        const { password, ...userWithoutPassword } = ADMIN_USER;
        return res.json({
            success: true,
            user: userWithoutPassword
        });
    }

    return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
    });
});

// 5. Add New Room (Admin)
app.post('/api/rooms', (req, res) => {
    const newRoom = req.body;

    if (!newRoom.id || !newRoom.title || isNaN(newRoom.price)) {
        return res.status(400).json({ error: 'Invalid room details provided.' });
    }

    // Check if room ID already exists
    const exists = roomList.some(r => r.id === newRoom.id);
    if (exists) {
        return res.status(400).json({ error: 'Room ID already exists.' });
    }

    roomList.push(newRoom);
    res.status(201).json({ success: true, room: newRoom });
});

// 6. Update Room Price (Admin)
app.patch('/api/rooms/:id/price', (req, res) => {
    const roomId = req.params.id;
    const { price } = req.body;

    const room = roomList.find(r => r.id === roomId);
    if (!room) {
        return res.status(404).json({ error: 'Room not found.' });
    }

    room.price = parseFloat(price);
    res.json({ success: true, room });
});

// 7. Toggle Room Status (Admin / Housekeeping)
app.patch('/api/rooms/:id/status', (req, res) => {
    const roomId = req.params.id;
    const room = roomList.find(r => r.id === roomId);

    if (!room) {
        return res.status(404).json({ error: 'Room not found.' });
    }

    // Status rotation: available -> dirty -> maintenance -> available
    if (room.status === 'available') {
        room.status = 'dirty';
    } else if (room.status === 'dirty') {
        room.status = 'maintenance';
    } else {
        room.status = 'available';
    }

    res.json({ success: true, room });
});

// 8. Create New Booking
app.post('/api/bookings', (req, res) => {
    const newBooking = req.body;

    if (!newBooking.id || !newBooking.guestName || !newBooking.roomNumber) {
        return res.status(400).json({ error: 'Missing required booking fields.' });
    }

    // Add booking to list
    bookings.push(newBooking);

    // Auto update room status to booked/dirty
    const bookedRoom = roomList.find(r => r.id === newBooking.roomNumber);
    if (bookedRoom) {
        bookedRoom.status = 'dirty'; // or keep as occupied
    }

    // Automatically add guest to guest list if not already present
    const guestExists = guests.some(g => g.email === newBooking.guestEmail || g.phone === newBooking.guestPhone);
    if (!guestExists && newBooking.guestName) {
        guests.push({
            name: newBooking.guestName,
            email: newBooking.guestEmail || 'N/A',
            phone: newBooking.guestPhone || 'N/A'
        });
    }

    res.status(201).json({ success: true, booking: newBooking });
});

// Start Node.js Server
app.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`🏰 Grand Palace Server Running on Port ${PORT}`);
    console.log(`👉 Access URL: http://localhost:${PORT}`);
    console.log(`===========================================`);
});
