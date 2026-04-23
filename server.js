const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// 1. Database Connection
mongoose.connect(process.env.MONGO_URI).then(() => console.log("✅ DB Connected"));

// 2. Schema
const Key = mongoose.model('Key', new mongoose.Schema({
    key: String, game: String, plan: String, expiresAt: Date
}));

// --- 3. LOADER API (ISKO SABSE UPAR RAKHA HAI) ---
// Note: Yahan humne '/verify/' (with slash) ko bhi handle kiya hai
app.all(['/api/ve*', '/verify', '/verify/'], (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    // Sab fields string mein taaki loader crash na ho
    const responseData = {
        "status": "1",
        "auth": "1",
        "message": "Login Success",
        "expiry": "2026-12-31",
        "user": "PremiumUser",
        "token": "72922806",
        "game": "GameZone",
        "rank": "VipUser"
    };

    return res.status(200).json(responseData);
});

// --- 4. ADMIN API (Panel ke liye) ---
app.get('/api/admin/keys', async (req, res) => { res.json(await Key.find().sort({ createdAt: -1 })); });
app.delete('/api/admin/keys/:id', async (req, res) => { await Key.findByIdAndDelete(req.params.id); res.json({ success: true }); });
app.post('/api/generate', async (req, res) => {
    const { plan, game, customKey } = req.body;
    const keyVal = customKey || ("WASIM-" + crypto.randomBytes(3).toString('hex').toUpperCase());
    const hours = { "2 Hours": 2, "5 Hours": 5, "24 Hours": 24, "7 Days": 168, "30 Days": 720 }[plan] || 2;
    const expiryDate = new Date(); expiryDate.setHours(expiryDate.getHours() + hours);
    const newKey = new Key({ key: keyVal, game, plan, expiresAt: expiryDate });
    await newKey.save(); res.json(newKey);
});

// --- 5. DASHBOARD & STATIC FILES (STRICT ORDER) ---
app.use(express.static(path.join(__dirname, 'public')));

// Sirf tab login page dikhao jab link '/verify' ya '/api' se shuru NA hota ho
app.get('*', (req, res) => {
    const url = req.url.toLowerCase();
    if (url.includes('verify') || url.includes('/api')) {
        // Agar galti se yahan aaye toh JSON bhejien na ki login page
        return res.status(200).json({ "status": "1", "message": "API Active" });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 MASTER BYPASS LIVE`));
