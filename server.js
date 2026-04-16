const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
//mongoose.connect("mongodb://127.0.0.1:27017/bookingDB")
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

// Schema - WITH phone field
const bookingSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    service: String,
    date: String,
    time: String,
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Booking = mongoose.model("Booking", bookingSchema);

// Check if slot is already booked (for duplicate prevention)
app.get("/api/check-slot", async (req, res) => {
    try {
        const { date, time } = req.query;
        if (!date || !time) {
            return res.json({ available: true });
        }
        const existing = await Booking.findOne({ date, time });
        res.json({ available: !existing });
    } catch (err) {
        res.status(500).json({ available: true });
    }
});

// POST endpoint with conflict detection AND phone field
app.post("/api/book", async (req, res) => {
    try {
        const { name, email, phone, service, date, time, notes } = req.body;

        if (!name || !service || !date || !time) {
            return res.status(400).json({ message: "All fields required" });
        }

        // Check for duplicate slot
        const existingBooking = await Booking.findOne({ date, time });
        if (existingBooking) {
            return res.status(409).json({ 
                conflict: true, 
                message: `Slot on ${date} at ${time} is already booked. Please choose a different time.` 
            });
        }

        // Save with phone field
        const newBooking = new Booking({ name, email, phone, service, date, time, notes });
        await newBooking.save();

        res.json({ message: "Booking saved successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get all bookings
app.get("/api/bookings", async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: "Error fetching bookings" });
    }
});

// Delete booking
app.delete("/api/book/:id", async (req, res) => {
    try {
        await Booking.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch {
        res.status(500).json({ message: "Error deleting" });
    }
});

// Update booking
app.put("/api/book/:id", async (req, res) => {
    try {
        const { name, service, date, time, phone } = req.body;
        await Booking.findByIdAndUpdate(req.params.id, {
            name,
            service,
            date,
            time,
            phone
        });
        res.json({ message: "Updated" });
    } catch {
        res.status(500).json({ message: "Error updating" });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});