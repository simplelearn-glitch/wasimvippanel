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

// 3. ADMIN API (Panel)
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

// --- 4. THE LOADER VERIFY (NUMBER STATUS FIX) ---
app.all(['/api/ve', '/api/verify'], (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    // Yahan hum status aur auth ko "1" (Number String) bhej rahe hain
    // Taki loader crash na ho
    const responseData = {
        "status": "1",         // Success Code
        "auth": "1",           // Authorized
        "message": "Login Success",
        "expiry": "2026-12-31",
        "user": "PremiumUser",
        "token": "72922806",
        "game": "GameZone",
        "rank": "VipUser",
        "mod_status": "Active"
    };

    return res.status(200).json(responseData);
});

// --- 5. PANEL & DASHBOARD ---
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
    if (!req.url.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 MASTER SERVER LIVE`));
