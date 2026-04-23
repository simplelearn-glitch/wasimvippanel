const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI).then(() => console.log("✅ DB Connected"));

// --- 1. SCHEMA UPDATE (Adding hwid) ---
const KeySchema = new mongoose.Schema({
    key: String, 
    game: String, 
    plan: String, 
    hwid: { type: String, default: null }, // Pehli baar login par save hoga
    isUsed: { type: Boolean, default: false },
    expiresAt: Date, 
    createdAt: { type: Date, default: Date.now }
});
const Key = mongoose.model('Key', KeySchema);

// --- 2. SERVER REAL-TIME STATUS API ---
// Isse aapka loader/dashboard check karega server online hai ya nahi
app.get('/api/server-status', (req, res) => {
    res.status(200).json({ 
        status: "Online", 
        maintenance: false, 
        time: new Date().toISOString() 
    });
});

// --- 3. UPDATED VERIFY API (With HWID Lock) ---
app.all(['/api/verify', '/verify'], async (req, res) => {
    const { key, hwid } = req.query; // Loader se 'key' aur 'hwid' query param mein aayenge

    if (!key) return res.json({ status: "FAILED", message: "Key is missing!" });

    try {
        const foundKey = await Key.findOne({ key: key });

        if (!foundKey) {
            return res.json({ status: "FAILED", message: "Invalid License Key" });
        }

        // Expiry Check
        if (new Date() > foundKey.expiresAt) {
            return res.json({ status: "FAILED", message: "Key Expired!" });
        }

        // HWID LOCK LOGIC (Single Device)
        if (foundKey.hwid && foundKey.hwid !== hwid) {
            return res.json({ status: "FAILED", message: "Key already used in another device!" });
        }

        // Agar pehli baar use ho rahi hai toh HWID lock kar do
        if (!foundKey.hwid && hwid) {
            foundKey.hwid = hwid;
            foundKey.isUsed = true;
            await foundKey.save();
        }

        // Calculate days left
        const daysLeft = Math.ceil((foundKey.expiresAt - new Date()) / (1000 * 60 * 60 * 24));

        return res.json({
            "status": "SUCCESS",
            "auth": "true",
            "message": "Login Success",
            "expiry": foundKey.expiresAt.toISOString().split('T')[0],
            "game": foundKey.game,
            "device_id": foundKey.hwid ? "Locked" : "Verified",
            "days_left": daysLeft.toString(),
            "subscription": foundKey.plan
        });

    } catch (err) {
        res.json({ status: "ERROR", message: "Server Error" });
    }
});

// --- 4. ADMIN API (Jaisa tha waisa hi hai) ---
app.get('/api/admin/keys', async (req, res) => {
    const keys = await Key.find().sort({ createdAt: -1 });
    res.json(keys);
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
        res.status(500).json({ error: "Failed" });
    }
});

app.delete('/api/admin/keys/:id', async (req, res) => {
    await Key.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
    const url = req.url.toLowerCase();
    if (url.includes('verify') || url.includes('/api')) return;
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 SECURE SERVER LIVE`));
