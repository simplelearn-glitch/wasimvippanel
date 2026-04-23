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
    key: String,
    game: String,
    plan: String,
    expiresAt: Date,
    createdAt: { type: Date, default: Date.now }
}));

// --- 3. LOADER API (BYPASS & DATA TYPE FIX) ---
app.all(['/api/ve*', '/verify', '/verify/'], async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    // Yahan hum response ko bilkul waisa rakh rahe hain jo loader ko chahiye
    const responseData = {
        status: 1,
        auth: true,
        message: "Login Success",
        expiry: "2026-12-31",
        user: "PremiumUser",
        token: "72922806",
        game: "GameZone",
        rank: "VipUser",
        device_id: "Verified",
        mod_status: "Active"
    };

    return res.status(200).send(JSON.stringify(responseData));
});

// --- 4. ADMIN API (FIXED GENERATION) ---
app.get('/api/admin/keys', async (req, res) => {
    try {
        const keys = await Key.find().sort({ createdAt: -1 });
        res.json(keys);
    } catch (err) { res.status(500).json(err); }
});

app.post('/api/generate', async (req, res) => {
    try {
        const { plan, game, customKey } = req.body;
        const keyVal = customKey || ("WASIM-" + crypto.randomBytes(4).toString('hex').toUpperCase());
        
        const planMap = { "2 Hours": 2, "5 Hours": 5, "24 Hours": 24, "7 Days": 168, "30 Days": 720 };
        const hours = planMap[plan] || 2;
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + hours);

        const newKey = new Key({ key: keyVal, game: game || "PUBG Mobile", plan: plan || "2 Hours", expiresAt: expiryDate });
        await newKey.save();
        res.json(newKey); // Ye line dashboard ko wapas data bhejti hai
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to generate key" });
    }
});

app.delete('/api/admin/keys/:id', async (req, res) => {
    await Key.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// --- 5. DASHBOARD STATIC FILES ---
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
    const url = req.url.toLowerCase();
    if (url.includes('verify') || url.includes('/api')) return;
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 WASIM MASTER SERVER LIVE`));
