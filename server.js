const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ Connection Error:", err));

// Key Schema
const Key = mongoose.model('Key', {
    key: String,
    game: String,
    plan: String,
    expiresAt: Date,
    createdAt: { type: Date, default: Date.now }
});

// --- ADMIN ROUTES ---

// Get all keys for the Dashboard
app.get('/api/admin/keys', async (req, res) => {
    try {
        const keys = await Key.find().sort({ createdAt: -1 });
        res.json(keys);
    } catch (err) { res.status(500).send(err); }
});

// Delete (Block) a key
app.delete('/api/admin/keys/:id', async (req, res) => {
    try {
        await Key.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).send(err); }
});

// Generate Key
app.post('/api/generate', async (req, res) => {
    const { plan, game } = req.body;
    const keyVal = "WASIM-" + crypto.randomBytes(3).toString('hex').toUpperCase();

    let hours = 2;
    const planMap = { "2 Hours": 2, "5 Hours": 5, "6 Hours": 6, "1 Day": 24, "7 Days": 168, "30 Days": 720, "60 Days": 1440 };
    hours = planMap[plan] || 2;

    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + hours);

    const newKey = new Key({ key: keyVal, game, plan, expiresAt: expiryDate });
    await newKey.save();
    res.json(newKey);
});

// Serve Frontend
app.use(express.static('public'));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
