const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ DB Connected Successfully"))
    .catch((err) => console.log("❌ DB Connection Error:", err));

// --- KEY SCHEMA ---
const KeySchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    game: { type: String, default: "PUBG" },
    plan: { type: String, default: "2 Hours" },
    hwid: { type: String, default: null },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});
const Key = mongoose.model('Key', KeySchema);

// --- 1. SERVER STATUS API ---
app.get('/api/status', (req, res) => {
    res.status(200).json({ status: "ONLINE", server: "Active", time: new Date() });
});

// --- 2. ADMIN LOGIN (PASSWORD FIX) ---
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === "wasim786") {
        res.status(200).json({ success: true, message: "Access Granted" });
    } else {
        res.status(401).json({ success: false, message: "Access Denied!" });
    }
});

// --- 3. LOADER VERIFY API (PERMANENT CASE & TRIM FIX) ---
app.all(['/api/ve*', '/api/verify', '/verify'], async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    let rawKey = req.body.key || req.query.key || "";
    let rawHwid = req.body.hwid || req.query.hwid || "";

    const key = rawKey.toString().toLowerCase().trim();
    const hwid = rawHwid.toString().trim();

    if (!key) {
        return res.status(200).json({ status: "FAILED", message: "Key is missing!" });
    }

    try {
        const foundKey = await Key.findOne({ key: key });

        if (!foundKey) {
            return res.status(200).json({ status: "FAILED", message: "Invalid License Key" });
        }

        if (new Date() > foundKey.expiresAt) {
            return res.status(200).json({ status: "FAILED", message: "Key Expired!" });
        }

        if (foundKey.hwid && hwid && foundKey.hwid !== hwid) {
            return res.status(200).json({ status: "FAILED", message: "Locked to another device!" });
        }

        if (!foundKey.hwid && hwid) {
            foundKey.hwid = hwid;
            await foundKey.save();
        }

        const daysLeft = Math.ceil((foundKey.expiresAt - new Date()) / (1000 * 60 * 60 * 24));

        return res.status(200).json({
            "status": "SUCCESS",
            "auth": "true",
            "message": "Login Success",
            "expiry": foundKey.expiresAt.toISOString().split('T')[0],
            "user": "PremiumUser",
            "token": crypto.randomBytes(4).toString('hex'),
            "game": foundKey.game,
            "mod_status": "Active",
            "device_id": foundKey.hwid ? "Verified" : "New",
            "maintenance": "false",
            "days_left": daysLeft.toString(),
            "subscription": foundKey.plan
        });

    } catch (err) {
        console.error(err);
        return res.status(200).json({ status: "ERROR", message: "Database Issue" });
    }
});

// --- 4. ADMIN API (KEYS & GENERATION) ---
app.get('/api/admin/keys', async (req, res) => {
    try {
        const keys = await Key.find().sort({ createdAt: -1 });
        res.json(keys);
    } catch (err) {
        res.status(500).json({ error: "Fetch Failed" });
    }
});

app.post('/api/generate', async (req, res) => {
    try {
        const { plan, game, customKey } = req.body;
        let keyVal = customKey || ("WASIM-" + crypto.randomBytes(4).toString('hex'));
        keyVal = keyVal.toLowerCase().trim(); 
        
        const planMap = { "2 Hours": 2, "5 Hours": 5, "24 Hours": 24, "7 Days": 168, "30 Days": 720 };
        const hours = planMap[plan] || 2;
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + hours);

        const newKey = new Key({ 
            key: keyVal, 
            game: game || "PUBG Mobile", 
            plan: plan || "2 Hours", 
            expiresAt: expiryDate 
        });
        
        await newKey.save();
        res.status(200).json(newKey);
    } catch (err) {
        res.status(500).json({ error: "Generation Failed" });
    }
});

app.delete('/api/admin/keys/:id', async (req, res) => {
    await Key.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// --- 5. STATIC FILES & ROUTING ---
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
    const url = req.url.toLowerCase();
    if (url.includes('/api/') || url.includes('/verify')) {
        return res.status(404).json({ status: "ERROR", message: "Route not found" });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 6. START SERVER ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
});
