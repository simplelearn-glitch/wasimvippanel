const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// 1. DATABASE (Bypass mode mein connection optional hai)
mongoose.connect(process.env.MONGO_URI).catch(e => console.log("DB Skip"));

// 2. FORCED LOGIN & MENU BYPASS
app.post(['/', '/connect*', '/conne*', '/api*'], (req, res) => {
    console.log("[*] Final Menu Bypass Attempt...");
    
    const fakeExpiry = "2026-12-31 23:59:59";
    
    // Ye hai wo exact response jo menu ko "Trigger" karta hai
    return res.status(200).json({ 
        status: true,
        auth: true, 
        message: "LOGIN_SUCCESS",
        expiry: fakeExpiry,
        user: "WASIM_PREMIUM",
        mod_name: "WASIM VIP",
        data: {
            username: "WASIM_VIP",
            expiry: fakeExpiry,
            status: "Premium",
            mod: "WASIM ENGINE",
            is_active: true
        }
    });
});

// 3. ADMIN PANEL UI (Keeping it for you)
app.get('/', (req, res) => {
    res.send("<h1>WASIM ENGINE: MENU BYPASS ACTIVE</h1><p>Status: True | Message: Success</p>");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 FINAL BYPASS READY"));
