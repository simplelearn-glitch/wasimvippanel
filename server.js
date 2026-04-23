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

// 3. ADMIN API (Dashboard ke liye JSON hi rahega)
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

// --- 4. LOADER VERIFY (PLAIN TEXT STYLE - WASIM786) ---
app.all('/api/ve*', async (req, res) => {
    try {
        const key = req.query.key || req.body.key || "";
        
        if (!key) return res.send("INVALID|Key Required|0000-00-00");

        const foundKey = await Key.findOne({ key: key });
        if (!foundKey) return res.send("INVALID|Invalid License|0000-00-00");

        const now = new Date();
        const exp = foundKey.expiresAt ? foundKey.expiresAt.toISOString().split('T')[0] : "2026-12-31";

        if (foundKey.expiresAt && now > foundKey.expiresAt) {
            return res.send(`EXPIRED|License Expired|${exp}`);
        }

        // SUCCESS RESPONSE (No Brackets, No JSON)
        // Format: STATUS|MESSAGE|EXPIRY
        res.send(`SUCCESS|Login Successful|${exp}`);

    } catch (err) {
        res.send("ERROR|Server Error|0000-00-00");
    }
});

// --- 5. DASHBOARD RESTORE ---
app.use(express.static('public'));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(process.env.PORT || 10000, () => console.log("🚀 Server Live"));
});

// --- 5. PANEL RESTORE & STATIC FILES ---
app.use(express.static('public'));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 PANEL LIVE ON PORT ${PORT}`));

