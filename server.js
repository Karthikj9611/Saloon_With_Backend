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