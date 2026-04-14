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

// Schema
const bookingSchema = new mongoose.Schema({
    name: String,
    email: String,
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

// API Route
app.post("/api/book", async (req, res) => {
    try {
        const { name, email, service, date, time, notes } = req.body;

        if (!name || !email || !service || !date || !time) {
            return res.status(400).json({ message: "All fields required" });
        }

        const newBooking = new Booking({ name, email, service, date, time, notes });
        await newBooking.save();

        res.json({ message: "Booking saved successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.get("/api/bookings", async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: "Error fetching bookings" });
    }
});



app.delete("/api/book/:id", async (req, res) => {
    try {
        await Booking.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch {
        res.status(500).json({ message: "Error deleting" });
    }
});

app.put("/api/book/:id", async (req, res) => {
    try {
        const { name, service, date, time } = req.body;

        await Booking.findByIdAndUpdate(req.params.id, {
            name,
            service,
            date,
            time
        });

        res.json({ message: "Updated" });
    } catch {
        res.status(500).json({ message: "Error updating" });
    }
});

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

// Modified POST endpoint with conflict detection
app.post("/api/book", async (req, res) => {
    try {
        const { name, email, service, date, time, notes } = req.body;

        if (!name || !email || !service || !date || !time) {
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

        const newBooking = new Booking({ name, email, service, date, time, notes });
        await newBooking.save();

        res.json({ message: "Booking saved successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});