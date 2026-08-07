const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ======================= MOCK DATABASE =======================
let rooms = [
    { id: 101, type: "Single Deluxe", category: "Single", price: 3500, status: "Available", housekeeping: "Clean" },
    { id: 102, type: "Executive Double", category: "Double", price: 5500, status: "Occupied", housekeeping: "Clean" },
    { id: 201, type: "Royal Ocean Suite", category: "Suite", price: 12000, status: "Available", housekeeping: "Dirty" },
    { id: 202, type: "Luxury Garden Cottage", category: "Cottage", price: 8500, status: "Available", housekeeping: "Clean" },
    { id: 301, type: "Presidential Villa", category: "Villa", price: 25000, status: "Maintenance", housekeeping: "Under Repair" }
];

let bookings = [
    { id: "BK-1001", guestName: "Tanvir Ahmed", roomNumber: 102, checkIn: "2026-08-05", checkOut: "2026-08-08", totalAmount: 16500, status: "Checked-In", paymentStatus: "Paid" }
];

let orders = [
    { id: "ORD-501", roomNumber: 102, items: "Club Sandwich, Fresh Mango Juice", total: 850, status: "Delivered" }
];

// ======================= REST API ENDPOINTS =======================

// 1. Get All Rooms
app.get('/api/rooms', (req, res) => {
    res.json({ success: true, data: rooms });
});

// 2. Create Booking (With Concurrency Lock to Prevent Double Booking)
app.post('/api/bookings', (req, res) => {
    const { guestName, roomId, checkIn, checkOut } = req.body;

    const room = rooms.find(r => r.id === parseInt(roomId));

    if (!room) {
        return res.status(404).json({ success: false, message: "Room not found!" });
    }

    // CONCURRENCY CONTROL CHECK
    if (room.status === "Occupied" || room.status === "Booked") {
        return res.status(400).json({ 
            success: false, 
            message: `Double Booking Error: Room ${room.id} is already occupied or booked!` 
        });
    }

    // Lock the room status
    room.status = "Booked";

    const newBooking = {
        id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
        guestName,
        roomNumber: room.id,
        checkIn,
        checkOut,
        totalAmount: room.price * 2, // Fixed 2-night calculation sample
        status: "Confirmed",
        paymentStatus: "Paid"
    };

    bookings.push(newBooking);

    res.status(201).json({
        success: true,
        message: "Booking successfully confirmed!",
        booking: newBooking
    });
});

// 3. Front Desk Check-in / Check-out Operations
app.post('/api/frontdesk/action', (req, res) => {
    const { roomId, action } = req.body;
    const room = rooms.find(r => r.id === parseInt(roomId));

    if (!room) return res.status(404).json({ success: false, message: "Room not found" });

    if (action === "check-in") {
        room.status = "Occupied";
    } else if (action === "check-out") {
        room.status = "Available";
        room.housekeeping = "Dirty"; // Automatically requires cleaning after check-out
    }

    res.json({ success: true, message: `Room ${roomId} ${action} completed successfully!`, room });
});

// 4. Housekeeping Status Update
app.post('/api/housekeeping/update', (req, res) => {
    const { roomId, status } = req.body;
    const room = rooms.find(r => r.id === parseInt(roomId));

    if (!room) return res.status(404).json({ success: false, message: "Room not found" });

    room.housekeeping = status;
    res.json({ success: true, message: `Housekeeping status updated to ${status}`, room });
});

// 5. Room Service Food Order API
app.post('/api/restaurant/order', (req, res) => {
    const { roomNumber, items, total } = req.body;
    const newOrder = {
        id: `ORD-${Math.floor(100 + Math.random() * 900)}`,
        roomNumber: parseInt(roomNumber),
        items,
        total: parseFloat(total),
        status: "Preparing"
    };
    orders.push(newOrder);
    res.status(201).json({ success: true, message: "Food order sent to kitchen!", order: newOrder });
});

// 6. Analytics Engine (Real-Time Metrics)
app.get('/api/analytics', (req, res) => {
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === "Occupied" || r.status === "Booked").length;
    const occupancyRate = ((occupiedRooms / totalRooms) * 100).toFixed(1);
    
    const roomRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const diningRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalRevenue = roomRevenue + diningRevenue;

    res.json({
        success: true,
        analytics: {
            totalRooms,
            occupiedRooms,
            occupancyRate: `${occupancyRate}%`,
            totalRevenue: `BDT ${totalRevenue.toLocaleString()}`,
            activeOrders: orders.length
        }
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`Grand Luxe Resort Backend running at: http://localhost:${PORT}`);
    console.log(`=======================================================`);
    module.exports = app;
});
