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
    key: String, game: String, plan: String, expiresAt: Date
}));

// --- 3. LOADER API (HAR EK FIELD COVERED) ---
app.all(['/api/ve*', '/verify', '/verify/'], (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    // Sab fields ko string mein rakhte hain, sirf status/auth ko number/boolean
    const responseData = {
        status: 1,
        auth: true,
        message: "Login Success",
        expiry: "2026-12-31",
        user: "PremiumUser",
        token: "72922806",
        game: "GameZone",
        rank: "VipUser",
        // Ye niche wali fields aksar crash ki wajah banti hain
        device_id: "VerifiedDevice", 
        hwid: "FixedHWID",
        mod_status: "Active",
        credits: "1000",
        plan: "Lifetime"
    };

    return res.status(200).send(JSON.stringify(responseData));
});

// --- 4. ADMIN API ---
app.get('/api/admin/keys', async (req, res) => { res.json(await Key.find().sort({ createdAt: -1 })); });
app.delete('/api/admin/keys/:id', async (req, res) => { await Key.findByIdAndDelete(req.params.id); res.json({ success: true }); });
app.post('/api/generate', async (req, res) => {
    const { plan, game, customKey } = req.body;
    const keyVal = customKey || ("WASIM-" + crypto.randomBytes(3).toString('hex').toUpperCase());
    const hours = { "2 Hours": 2, "5 Hours": 5, "24 Hours": 24, "7 Days": 168, "30 Days": 720 }[plan] || 2;
    const expiryDate = new Date(); expiryDate.setHours(expiryDate.getHours() + hours);
    const newKey = new Key({ key: keyVal, game, plan, expiresAt: expiryDate });
    await newKey.save(); res.json(newKey);
});

// --- 5. DASHBOARD ---
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
    const url = req.url.toLowerCase();
    if (url.includes('verify') || url.includes('/api')) return;
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 MASTER SERVER LIVE`));
