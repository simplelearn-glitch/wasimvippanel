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

// --- KEY SCHEMA (Updated with HWID) ---
const KeySchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    game: { type: String, default: "GameZone" },
    plan: { type: String, default: "2 Hours" },
    hwid: { type: String, default: null }, // Stores unique device ID
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});
const Key = mongoose.model('Key', KeySchema);

// --- 1. SERVER STATUS API (To check if online) ---
app.get('/api/status', (req, res) => {
    res.status(200).json({ status: "ONLINE", server: "Active", time: new Date() });
});

// --- 2. LOADER VERIFY API (Handles /api/ve, /verify, /api/verify) ---
// Isme POST aur GET dono allow hain taaki loader crash na ho
app.all(['/api/ve*', '/api/verify', '/verify'], async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Data extraction from POST body or GET query
    const key = req.body.key || req.query.key;
    const hwid = req.body.hwid || req.query.hwid;

    if (!key) {
        return res.status(200).json({ status: "FAILED", message: "Key is missing!" });
    }

    try {
        const foundKey = await Key.findOne({ key: key });

        if (!foundKey) {
            return res.status(200).json({ status: "FAILED", message: "Invalid License Key" });
        }

        // 1. Expiry Check
        if (new Date() > foundKey.expiresAt) {
            return res.status(200).json({ status: "FAILED", message: "Key Expired!" });
        }

        // 2. HWID LOCK (Single Device Logic)
        if (foundKey.hwid && hwid && foundKey.hwid !== hwid) {
            return res.status(200).json({ status: "FAILED", message: "Locked to another device!" });
        }

        // 3. Register HWID on first login
        if (!foundKey.hwid && hwid) {
            foundKey.hwid = hwid;
            await foundKey.save();
        }

        // Calculate days left
        const daysLeft = Math.ceil((foundKey.expiresAt - new Date()) / (1000 * 60 * 60 * 24));

        // Response format matching your loader's requirements
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

// --- 3. ADMIN API (For Dashboard) ---
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
        const keyVal = customKey || ("WASIM-" + crypto.randomBytes(4).toString('hex').toUpperCase());
        
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

// --- 4. STATIC FILES & ROUTING ---
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
    const url = req.url.toLowerCase();
    // Prevent HTML serving for API routes
    if (url.includes('/api/') || url.includes('/verify')) {
        return res.status(404).json({ status: "ERROR", message: "Route not found" });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 5. START SERVER ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
    console.log(`🔗 Verify Link: /api/verify?key=YOUR_KEY&hwid=DEVICE_ID`);
});

