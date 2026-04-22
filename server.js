const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// 1. Database Connection (FIXED TYPO)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Error:", err));

// 2. Models (FIXED TYPO)
const User = mongoose.model('User', {
    username: String,
    password: String
});

const Key = mongoose.model('Key', {
    key: String,
    game: String,
    plan: String,
    devices: Number,
    expiresAt: Date,
    createdAt: { type: Date, default: Date.now }
});

// 3. Auth Routes
app.post('/register', async (req, res) => {
    try {
        const hash = await bcrypt.hash(req.body.password, 10);
        const user = new User({ username: req.body.username, password: hash });
        await user.save();
        res.json({ message: "User registered" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(400).json({ error: "User not found" });
    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) return res.status(400).json({ error: "Wrong password" });
    const token = jwt.sign({ id: user._id }, "SECRET_KEY");
    res.json({ token });
});

// 4. Generate Key Route (UPDATED WITH ALL YOUR TIME OPTIONS)
app.post('/generate', async (req, res) => {
    const { plan, game, devices } = req.body;
    const keyVal = "WASIM-" + crypto.randomBytes(4).toString('hex').toUpperCase();

    let durationHours = 2; 
    if (plan === "5 Hours") durationHours = 5;
    if (plan === "6 Hours") durationHours = 6;
    if (plan === "1 Day") durationHours = 24;
    if (plan === "7 Days") durationHours = 168;
    if (plan === "30 Days") durationHours = 720;
    if (plan === "60 Days") durationHours = 1440;
    
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + durationHours);

    const newKey = new Key({
        key: keyVal,
        game: game || "PUBG Mobile",
        plan: plan,
        devices: devices || 1,
        expiresAt: expiryDate
    });

    await newKey.save();
    res.json({ key: keyVal, expiresAt: expiryDate });
});

// 5. Serve Frontend
app.use(express.static('public'));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 6. Start Server
const PORT = process.env.PORT || 10000; 
app.listen(PORT, () => console.log("🚀 Server running on port " + PORT));
