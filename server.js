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

// --- 4. SECURE VERIFICATION (POST) ---
app.post('/api/verify', async (req, res) => {
    try {
        const { key } = req.body;
        const foundKey = await Key.findOne({ key: key });

        if (!foundKey) return res.status(404).json({ status: "INVALID" });
        
        const now = new Date();
        if (now > foundKey.expiresAt) return res.status(410).json({ status: "EXPIRED" });

        res.json({ status: "SUCCESS", expiresAt: foundKey.expiresAt });
    } catch (err) {
        res.status(500).json({ status: "ERROR" });
    }
});

// --- 5. CONNECT STATUS PAGE ---
app.get('/connect', (req, res) => {
    res.send(`
        <body style="background:#0b0f1a; display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif;">
            <div style="text-align:center; padding:50px; background:#161b2c; border-radius:30px; border:1px solid #22c55e; color:white;">
                <h1 style="margin:0; font-size:40px;">WASIM <span style="color:#22c55e;">VIP</span></h1>
                <p style="color:#22c55e; font-weight:bold; letter-spacing:3px; margin-top:20px;">SERVER WORKING ✓</p>
            </div>
        </body>
    `);
});

// Redirect main link to connect page
app.get('/', (req, res) => res.redirect('/connect'));


app.use(express.static('public'));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 WASIM PANEL LIVE ON PORT ${PORT}`));
