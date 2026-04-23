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
    key: String, game: String, plan: String, expiresAt: Date, createdAt: { type: Date, default: Date.now }
}));

// 3. ADMIN API (Panel ke liye)
app.get('/api/admin/keys', async (req, res) => {
    const keys = await Key.find().sort({ createdAt: -1 });
    res.json(keys);
});

app.delete('/api/admin/keys/:id', async (req, res) => {
    await Key.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

app.post('/api/generate', async (req, res) => {
    const { plan, game, customKey } = req.body;
    const keyVal = customKey || ("WASIM-" + crypto.randomBytes(3).toString('hex').toUpperCase());
    const hours = { "2 Hours": 2, "5 Hours": 5, "24 Hours": 24, "7 Days": 168, "30 Days": 720 }[plan] || 2;
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + hours);
    const newKey = new Key({ key: keyVal, game, plan, expiresAt: expiryDate });
    await newKey.save();
    res.json(newKey);
});

// --- 4. LOADER VERIFY (PERFECT JSON - NO CRASH) ---
app.all('/api/ve*', async (req, res) => {
    try {
        const key = req.query.key || req.body.key || "";
        
        // Loader ko "null" aur "parse error" se bachane ke liye complete JSON
        let result = {
            "status": "INVALID",
            "auth": "false",
            "message": "Invalid Key",
            "expiry": "0000-00-00",
            "user": "Guest",
            "token": "none",
            "game": "GameZone",
            "plan": "None",
            "user_user": "none",
            "game_name": "GameZone"
        };

        if (!key) {
            result.message = "Key Required";
            return res.status(200).json(result);
        }

        const foundKey = await Key.findOne({ key: key });
        if (!foundKey) return res.status(200).json(result);

        const now = new Date();
        const expStr = foundKey.expiresAt ? foundKey.expiresAt.toISOString().split('T')[0] : "2026-12-31";

        if (foundKey.expiresAt && now > foundKey.expiresAt) {
            result.status = "EXPIRED";
            result.message = "Key Expired";
            result.expiry = expStr;
            return res.status(200).json(result);
        }

        // SUCCESS RESPONSE
        res.status(200).json({ 
            "status": "SUCCESS", 
            "auth": "true",
            "message": "Login Success",
            "expiry": expStr,
            "user": "PremiumUser",
            "user_user": "PremiumUser",
            "token": "Auth_" + crypto.randomBytes(4).toString('hex'),
            "game": foundKey.game || "GameZone",
            "game_name": foundKey.game || "GameZone",
            "plan": foundKey.plan || "VIP"
        });

    } catch (err) {
        res.status(200).json({ "status": "ERROR", "auth": "false", "expiry": "0000-00-00" });
    }
});

// --- 5. DASHBOARD RESTORE ---
app.use(express.static('public'));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(process.env.PORT || 10000);
