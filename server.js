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

// ADMIN API
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

// --- 4. THE ULTIMATE BYPASS (CRASH-PROOF) ---
app.all('/api/ve*', (req, res) => {
    // Header set karna bohot zaruri hai
    res.setHeader('Content-Type', 'application/json');
    
    // Sirf wahi bhej rahe hain jo loader pakka mangta hai
    res.status(200).send(JSON.stringify({
        "status": "SUCCESS",
        "auth": "true",
        "message": "Login Success",
        "expiry": "2026-12-31",
        "user": "PremiumUser",
        "token": "72922806"
    }));
});

app.use(express.static('public'));
app.get('*', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });
app.listen(process.env.PORT || 10000);
