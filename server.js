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

const Key = mongoose.model('Key', new mongoose.Schema({
    key: String, game: String, plan: String, expiresAt: Date, createdAt: { type: Date, default: Date.now }
}));

// --- 3. LOADER API (HAR EK FIELD JO LOADER MANG SAKTA HAI) ---
app.all(['/api/ve*', '/verify', '/verify/'], (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    // In saari fields ko dhyan se dekho, ye standard Nitro/Global format hai
    const response = {
        "status": "SUCCESS",
        "auth": "true",
        "message": "Login Success",
        "expiry": "2026-12-31",
        "user": "PremiumUser",
        "user_user": "PremiumUser",
        "token": "72922806",
        "game": "GameZone",
        "game_name": "GameZone",
        "rank": "VipUser",
        "level": "100",         // String format wapas kar diya
        "credits": "9999",      // String format wapas kar diya
        "mod_status": "Active",
        "device_id": "Verified",
        "maintenance": "false",
        "is_admin": "false",
        "start_date": "2026-04-01", // Missing Field 1
        "end_date": "2026-12-31",   // Missing Field 2
        "days_left": "250",         // Missing Field 3
        "subscription": "Lifetime"  // Missing Field 4
    };

    return res.status(200).json(response);
});

// --- 4. ADMIN API (DASHBOARD FIX) ---
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

        const newKey = new Key({ key: keyVal, game: game || "PUBG Mobile", plan: plan || "2 Hours", expiresAt: expiryDate });
        const savedKey = await newKey.save();
        res.status(200).json(savedKey);
    } catch (err) {
        res.status(500).json({ error: "Failed" });
    }
});

app.delete('/api/admin/keys/:id', async (req, res) => {
    await Key.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// --- 5. STATIC FILES ---
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
    const url = req.url.toLowerCase();
    if (url.includes('verify') || url.includes('/api')) return;
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 ULTIMATE BYPASS LIVE`));
