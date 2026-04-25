const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// --- 1. SABSE ZAROORI: LOGGING & MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ye line har request ko FORCEFULLY logs mein dikhayegi
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] incoming: ${req.method} ${req.url}`);
    next();
});

// --- 2. DATABASE ---
mongoose.connect(process.env.MONGO_URI).then(() => console.log("✅ DB Connected"));

const Key = mongoose.model('Key', {
    key: String,
    hwid: { type: String, default: "NOT_SET" },
    isBlocked: { type: Boolean, default: false },
    expiryDate: Date
});

// --- 3. RESPONSE LOGIC (FIXED) ---
app.post(['/connect*', '/conne*', '/api*'], async (req, res) => {
    try {
        const { key, hwid } = req.body;
        console.log(`[*] Login Data -> Key: ${key}, HWID: ${hwid}`);

        if (!key) return res.status(400).json({ status: false, message: "KEY_MISSING" });

        const foundKey = await Key.findOne({ key: key });
        if (!foundKey) return res.status(404).json({ status: false, message: "INVALID_KEY" });

        // HWID Check
        if (foundKey.hwid === "NOT_SET") {
            foundKey.hwid = hwid || "UNKNOWN";
            await foundKey.save();
        } else if (foundKey.hwid !== hwid) {
            return res.status(401).json({ status: false, message: "HWID_MISMATCH" });
        }

        // Final JSON Response
        return res.status(200).json({ 
            status: true, 
            data: { 
                mod: "WASIM VIP", 
                status: "SAFE", 
                expiry: foundKey.expiryDate 
            } 
        });

    } catch (e) {
        console.log("❌ Error:", e.message);
        res.status(500).json({ status: false });
    }
});

// Browser status check
app.get('*', (req, res) => {
    res.send(`<h1>WASIM SERVER IS LIVE</h1><p>Time: ${new Date().toLocaleString()}</p>`);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 DEBUG MODE ACTIVE"));
