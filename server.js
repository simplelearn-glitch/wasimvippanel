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

// --- 3. LOADER API (JSON KHATAM, ONLY PLAIN TEXT) ---
app.all(['/api/ve*', '/verify', '/verify/'], (req, res) => {
    // Hum response ko JSON ke bajaye PLAIN TEXT bhej rahe hain
    res.setHeader('Content-Type', 'text/plain');
    
    // Format: status|auth|message|expiry|user|token|game|rank
    // Ye wahi format hai jo 100% loaders read kar lete hain
    const plainResponse = `1|true|Login Success|2026-12-31|PremiumUser|72922806|GameZone|VipUser|Verified|Active`;
    
    return res.status(200).send(plainResponse);
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
app.listen(PORT, () => console.log(`🚀 FINAL BYPASS ACTIVE`));
