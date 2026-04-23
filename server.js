const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
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
const Key = mongoose.model('Key', {
    key: String,
    game: String,
    plan: String,
    expiresAt: Date,
    createdAt: { type: Date, default: Date.now }
});

// 3. --- API ROUTES ---

// Get all keys for Admin Table
app.get('/api/admin/keys', async (req, res) => {
    const keys = await Key.find().sort({ createdAt: -1 });
    res.json(keys);
});

// Delete/Block Key
app.delete('/api/admin/keys/:id', async (req, res) => {
    await Key.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// Generate or Save Manual Key
app.post('/api/generate', async (req, res) => {
    const { plan, game, customKey } = req.body;
    
    // Use manual key if exists, else random
    const keyVal = customKey || ("WASIM-" + crypto.randomBytes(3).toString('hex').toUpperCase());

    const planMap = { 
        "2 Hours": 2, "5 Hours": 5, "6 Hours": 6, 
        "1 Day": 24, "7 Days": 168, "30 Days": 720, "60 Days": 1440 
    };
    const hours = planMap[plan] || 2;

    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + hours);

    const newKey = new Key({ key: keyVal, game, plan, expiresAt: expiryDate });
    await newKey.save();
    res.json(newKey);
});

// --- 4. ADVANCED KEY SYSTEM (CRASH-PROOF & ACCURATE) ---
// Ye section Line 62 se 82 tak replace karega
app.all('/api/ve*', async (req, res) => {
    try {
        const key = req.query.key || req.body.key;

        // 1. Agar key khali hai
        if (!key) {
            return res.status(200).json({ status: "INVALID", message: "Key required" });
        }

        const foundKey = await Key.findOne({ key: key });

        // 2. Agar key database mein nahi mili
        if (!foundKey) {
            return res.status(200).json({ status: "INVALID", message: "Key not found" });
        }

        // 3. Expiry Check logic
        const now = new Date();
        if (foundKey.expiresAt && now > foundKey.expiresAt) {
            return res.status(200).json({ status: "EXPIRED", message: "Key has expired" });
        }

        // 4. Sab sahi hai toh SUCCESS
        res.status(200).json({ 
            status: "SUCCESS", 
            auth: "true",
            expiry: foundKey.expiresAt
        });

    } catch (err) {
        console.error("Server Error:", err);
        // Error mein bhi 200 bhejenge taaki loader crash na ho
        res.status(200).json({ status: "ERROR", message: "Internal server error" });
    }
});





app.use(express.static('public'));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 WASIM PANEL LIVE ON PORT ${PORT}`));
