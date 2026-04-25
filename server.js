const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// 1. DATABASE (Bypass mode mein connection optional hai par rakhte hain)
mongoose.connect(process.env.MONGO_URI).catch(e => console.log("DB Skip"));

// 2. FORCED LOGIN BYPASS (Isse har key par login hoga)
app.post(['/', '/connect*', '/conne*', '/api*'], (req, res) => {
    const { key } = req.body;
    console.log(`[*] Login Attempt with Key: ${key}`);

    // Hamesha success bhejo chahe key kuch bhi ho
    const fakeExpiry = "2026-12-31 23:59:59";
    
    return res.status(200).json({ 
        status: true,  // Ye 'true' hona sabse zaroori hai
        message: "LOGIN_SUCCESS",
        expiry: fakeExpiry,
        data: {
            username: "WASIM_VIP",
            expiry: fakeExpiry,
            status: "Premium"
        }
    });
});

// 3. SIMPLE STATUS PAGE
app.get('*', (req, res) => {
    res.send("<h1>WASIM ENGINE: BYPASS ACTIVE</h1><p>Ab aap koi bhi key daalein, login ho jayega.</p>");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 BYPASS READY"));

