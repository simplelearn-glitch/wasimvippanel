const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

app.use(cors());
app.use(express.json());

// 1. DATABASE
mongoose.connect(process.env.MONGO_URI).catch(e => console.log("DB Skip"));

// 2. THE ULTIMATE LOGIN BYPASS (Har condition ke liye)
app.post(['/', '/connect*', '/api*'], (req, res) => {
    console.log("[*] Final Menu Trigger Attempt...");
    const expiry = "2026-12-31 23:59:59";
    
    // Sab kuch string aur boolean dono format mein
    return res.status(200).json({ 
        "status": "true",
        "auth": true,
        "message": "LOGIN_SUCCESS",
        "expiry": expiry,
        "token": "WASIM_786_TOKEN",
        "data": {
            "status": "true",
            "user": "WASIM_VIP",
            "expiry": expiry
        }
    });
});

// 3. ADMIN PANEL (Password: wasim786)
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>WASIM TERMINAL</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
    <body style="background:#000; color:red; text-align:center; font-family:sans-serif; padding-top:100px;">
        <div style="border:2px solid red; display:inline-block; padding:20px; border-radius:10px;">
            <h1>WASIM ENGINE LIVE</h1>
            <p style="color:yellow;">MENU BYPASS IS ACTIVE</p>
            <p>Agar menu nahi dikh raha, toh "Display over other apps" permission check karein.</p>
        </div>
    </body>
    </html>
    `);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 Server Ready"));
