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

// --- 4. FINAL UNIVERSAL FIX (NO MORE CRASH) ---
app.all('/api/ve*', async (req, res) => {
    try {
        const key = req.query.key || req.body.key;
        const fallbackDate = "2099-01-01T00:00:00.000Z"; // Fake date to prevent app crash

        if (!key) {
            return res.status(400).json({ status: "INVALID", expiresAt: fallbackDate });
        }

        const foundKey = await Key.findOne({ key: key });

        if (!foundKey) {
            // App crashes if this isn't a date, so we send the fallbackDate
            return res.json({ status: "INVALID", expiresAt: fallbackDate });
        }
        
        const now = new Date();
        const formattedExpiry = foundKey.expiresAt.toISOString();

        if (now > foundKey.expiresAt) {
            return res.json({ status: "EXPIRED", expiresAt: formattedExpiry });
        }

        // SUCCESS
        res.json({ 
            status: "SUCCESS", 
            expiresAt: formattedExpiry 
        });
    } catch (err) {
        res.status(500).json({ status: "ERROR", expiresAt: "2099-01-01T00:00:00.000Z" });
    }
});




app.use(express.static('public'));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 WASIM PANEL LIVE ON PORT ${PORT}`));
