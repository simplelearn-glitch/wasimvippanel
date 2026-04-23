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

// --- ADMIN API ---
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

// --- 4. MEGA LOADER VERIFY (SAB FIELDS ADD KAR DI HAIN) ---
app.all('/api/ve*', async (req, res) => {
    try {
        const key = req.query.key || req.body.key || "";
        const expStr = "2026-12-31"; // Default expiry string

        // Ye hai woh "Power" wala response jo har field ko fill karega
        let megaResponse = {
            "status": "INVALID",
            "auth": "false",
            "message": "Invalid Key",
            "expiry": "0000-00-00",
            "user": "Guest",
            "user_user": "Guest",
            "token": "none",
            "game": "GameZone",
            "game_name": "GameZone",
            "plan": "None",
            "credits": "0",
            "rank": "Member",
            "level": "1",
            "mod_status": "none",
            "device_id": "none"
        };

        if (!key) {
            megaResponse.message = "Enter Your Key";
            return res.status(200).json(megaResponse);
        }

        const foundKey = await Key.findOne({ key: key });
        if (!foundKey) return res.status(200).json(megaResponse);

        const now = new Date();
        const currentExp = foundKey.expiresAt ? foundKey.expiresAt.toISOString().split('T')[0] : expStr;

        if (foundKey.expiresAt && now > foundKey.expiresAt) {
            megaResponse.status = "EXPIRED";
            megaResponse.message = "Key Expired";
            megaResponse.expiry = currentExp;
            return res.status(200).json(megaResponse);
        }

        // SUCCESS RESPONSE
        res.status(200).json({ 
            "status": "SUCCESS", 
            "auth": "true",
            "message": "Login Successful",
            "expiry": currentExp,
            "user": "PremiumUser",
            "user_user": "PremiumUser",
            "token": crypto.randomBytes(16).toString('hex'),
            "game": foundKey.game || "GameZone",
            "game_name": foundKey.game || "GameZone",
            "plan": foundKey.plan || "VIP",
            "credits": "9999",
            "rank": "Admin",
            "level": "100",
            "mod_status": "Active",
            "device_id": "verified"
        });

    } catch (err) {
        res.status(200).json({ "status": "ERROR", "auth": "false", "expiry": "0000-00-00" });
    }
});

app.use(express.static('public'));
app.get('*', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });
app.listen(process.env.PORT || 10000);
