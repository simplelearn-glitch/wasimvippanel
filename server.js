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
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ DB Error:", err));

// 2. Schema
const KeySchema = new mongoose.Schema({
    key: String,
    game: String,
    plan: String,
    expiresAt: Date,
    createdAt: { type: Date, default: Date.now }
});
const Key = mongoose.model('Key', KeySchema);

// 3. ADMIN API ROUTES (For Dashboard)
app.get('/api/admin/keys', async (req, res) => {
    try {
        const keys = await Key.find().sort({ createdAt: -1 });
        res.json(keys);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/keys/:id', async (req, res) => {
    try {
        await Key.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/generate', async (req, res) => {
    try {
        const { plan, game, customKey } = req.body;
        const keyVal = customKey || ("WASIM-" + crypto.randomBytes(3).toString('hex').toUpperCase());
        const planMap = { "2 Hours": 2, "5 Hours": 5, "24 Hours": 24, "7 Days": 168, "30 Days": 720 };
        const hours = planMap[plan] || 2;
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + hours);

        const newKey = new Key({ key: keyVal, game, plan, expiresAt: expiryDate });
        await newKey.save();
        res.json(newKey);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 4. THE LOADER VERIFY LOGIC (FIXED ROUTING) ---
// Note: Is raste ko Dashboard ke raste se alag rakha hai
app.all('/api/verify*', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    try {
        const key = req.query.key || req.body.key;

        // Base Response to prevent null crashes
        let response = {
            "status": "INVALID",
            "auth": "false",
            "message": "Key Required",
            "expiry": "0000-00-00",
            "user": "Guest",
            "token": "00000000",
            "game": "GameZone",
            "rank": "Member"
        };

        if (!key) return res.status(200).json(response);

        const foundKey = await Key.findOne({ key: key });
        if (!foundKey) {
            response.message = "Invalid Key";
            return res.status(200).json(response);
        }

        const now = new Date();
        const expStr = foundKey.expiresAt ? foundKey.expiresAt.toISOString().split('T')[0] : "2026-12-31";

        if (foundKey.expiresAt && now > foundKey.expiresAt) {
            response.status = "EXPIRED";
            response.message = "Key Expired";
            response.expiry = expStr;
            return res.status(200).json(response);
        }

        // SUCCESS RESPONSE
        return res.status(200).json({ 
            "status": "SUCCESS", 
            "auth": "true",
            "message": "Login Success",
            "expiry": expStr,
            "user": "PremiumUser",
            "token": "72922806",
            "game": foundKey.game || "GameZone",
            "rank": "VipUser"
        });

    } catch (err) {
        return res.status(200).json({ "status": "ERROR", "message": "Server Busy" });
    }
});

// --- 5. DASHBOARD & STATIC FILES (STRICT ORDER) ---
// Dashboard ki files serve karein
app.use(express.static(path.join(__dirname, 'public')));

// Sirf wahi routes redirect karein jo API nahi hain
app.get('*', (req, res) => {
    if (!req.url.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Server Start
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 WASIM SERVER LIVE ON PORT ${PORT}`);
});
