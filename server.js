const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
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

// 3. API ROUTES - Get All Keys
app.get('/api/admin/keys', async (req, res) => {
    const keys = await Key.find().sort({ createdAt: -1 });
    res.json(keys);
});

// Delete Key
app.delete('/api/admin/keys/:id', async (req, res) => {
    await Key.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// Generate Key
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

// --- 4. THE FINAL CRASH-PROOF VERIFY LOGIC ---
app.all('/api/ve*', async (req, res) => {
    try {
        const key = req.query.key || req.body.key || "";

        // Default response object to prevent "null" type errors
        let response = {
            status: "INVALID",
            auth: "false",
            message: "Invalid License Key",
            expiry: "0000-00-00",
            user: "none",
            token: "none",
            game: "none",
            plan: "none"
        };

        if (!key) {
            response.message = "Key is Required";
            return res.status(200).json(response);
        }

        const foundKey = await Key.findOne({ key: key });

        if (!foundKey) {
            return res.status(200).json(response);
        }

        const now = new Date();
        const expiryStr = foundKey.expiresAt ? foundKey.expiresAt.toISOString().split('T')[0] : "2026-12-31";

        if (foundKey.expiresAt && now > foundKey.expiresAt) {
            response.status = "EXPIRED";
            response.message = "Key has Expired";
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
            token: crypto.randomBytes(8).toString('hex'),
            game: foundKey.game || "GameZone",
            plan: foundKey.plan || "Premium"
        });

    } catch (err) {
        console.error("Internal Error:", err);
        res.status(200).json({ status: "ERROR", auth: "false", expiry: "0000-00-00" });
    }
});

// Server Start
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 WASIM PANEL LIVE ON PORT ${PORT}`));

