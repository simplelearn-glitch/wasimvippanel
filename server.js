const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// 1. Database Connection
mongoose.connect(process.env.MONGO_URI).then(() => console.log("✅ DB Connected"));

// 2. Schema
const Key = mongoose.model('Key', new mongoose.Schema({
    key: String, game: String, plan: String, expiresAt: Date
}));

// --- 3. LOADER API (SABSE PEHLE - NO REDIRECT) ---
// Yahan humne rasta ekdam clear kar diya hai
app.all(['/api/ve', '/api/verify', '/api/ve*'], (req, res) => {
    // Ye line browser aur loader ko batati hai ki ye sirf JSON hai
    res.setHeader('Content-Type', 'application/json');
    
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

// --- 4. ADMIN API ---
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

// --- 5. DASHBOARD (SIRF NON-API ROUTES KE LIYE) ---
// Static files serve karein
app.use(express.static(path.join(__dirname, 'public')));

// Agar link /api se shuru NAHI hota, tabhi index.html bhejien
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Home page direct access
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 WASIM SERVER LIVE`));
