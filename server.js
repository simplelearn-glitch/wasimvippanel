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
    key: String, game: String, plan: String, expiresAt: Date, createdAt: { type: Date, default: Date.now }
}));

// --- ADMIN API (Dashboard ke liye JSON zaruri hai) ---
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

// --- 4. THE LOADER FIX (NO JSON, ONLY PLAIN TEXT) ---
app.all('/api/ve*', async (req, res) => {
    try {
        const key = req.query.key || req.body.key || "";
        
        // Agar key nahi hai
        if (!key) return res.send("INVALID|Enter Key|0000-00-00|none|none");

        const foundKey = await Key.findOne({ key: key });

        // Agar key galat hai
        if (!foundKey) return res.send("INVALID|Invalid Key|0000-00-00|none|none");

        const now = new Date();
        const expStr = foundKey.expiresAt ? foundKey.expiresAt.toISOString().split('T')[0] : "2026-12-31";

        // Agar key expire ho gayi hai
        if (foundKey.expiresAt && now > foundKey.expiresAt) {
            return res.send(`EXPIRED|Key Expired|${expStr}|none|none`);
        }

        // AGAR SAB SAHI HAI (SUCCESS)
        // Format: STATUS|MESSAGE|EXPIRY|TOKEN|USER
        const token = crypto.randomBytes(8).toString('hex');
        res.send(`SUCCESS|Login Success|${expStr}|${token}|PremiumUser`);

    } catch (err) {
        res.send("ERROR|Server Error|0000-00-00|none|none");
    }
});

app.use(express.static('public'));
app.get('*', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });
app.listen(process.env.PORT || 10000);
