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
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ DB Error:", err));

// 2. Database Schema
const KeySchema = new mongoose.Schema({
    key: String,
    game: String,
    plan: String,
    expiresAt: Date,
    createdAt: { type: Date, default: Date.now }
});
const Key = mongoose.model('Key', KeySchema);

// 3. ADMIN PANEL API ROUTES
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
    const planMap = { "2 Hours": 2, "5 Hours": 5, "24 Hours": 24, "7 Days": 168, "30 Days": 720 };
    const hours = planMap[plan] || 2;
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + hours);

    const newKey = new Key({ key: keyVal, game, plan, expiresAt: expiryDate });
    await newKey.save();
    res.json(newKey);
});

// --- 4. THE LOADER VERIFY LOGIC (CRASH PROOF & COMPLETE) ---
app.all('/api/ve*', async (req, res) => {
    try {
        const key = req.query.key || req.body.key || "";

        // Sabhi fields ko String mein rakha hai taaki "null" error na aaye
        let response = {
            status: "INVALID",
            auth: "false",
            message: "Invalid License",
            expiry: "0000-00-00",
            user: "Guest",
            token: "none",
            game: "GameZone",
            plan: "None",
            user_user: "none", // Kuch loaders ise mangte hain
            game_name: "GameZone"
        };

        if (!key) {
            response.message = "Key Required";
            return res.status(200).json(response);
        }

        const foundKey = await Key.findOne({ key: key });
        if (!foundKey) return res.status(200).json(response);

        const now = new Date();
        const expiryStr = foundKey.expiresAt ? foundKey.expiresAt.toISOString().split('T')[0] : "2026-12-31";

        if (foundKey.expiresAt && now > foundKey.expiresAt) {
            response.status = "EXPIRED";
            response.message = "Key Expired";
            response.expiry = expiryStr;
            return res.status(200).json(response);
        }

        // SUCCESS RESPONSE
        res.status(200).json({ 
            status: "SUCCESS", 
            auth: "true",
            message: "Login Success",
            expiry: expiryStr,
            user: "Premium_User",
            user_user: "Premium_User",
            token: "Auth_" + crypto.randomBytes(4).toString('hex'),
            game: foundKey.game || "GameZone",
            game_name: foundKey.game || "GameZone",
            plan: foundKey.plan || "VIP"
        });

    } catch (err) {
        res.status(200).json({ status: "ERROR", auth: "false", expiry: "0000-00-00" });
    }
});

// --- 5. PANEL RESTORE & STATIC FILES ---
app.use(express.static('public'));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 PANEL LIVE ON PORT ${PORT}`));

