const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// 1. DATABASE (Keeping it connected for your Panel)
mongoose.connect(process.env.MONGO_URI).catch(e => console.log("DB Skip"));

// 2. THE WORKING BYPASS LOGIC (Exactly as per APK Smali)
app.post(['/', '/connect*', '/api*'], (req, res) => {
    console.log("[*] GameZone Loader Triggered - Sending Working Response...");
    
    const expiryDate = "2026-12-31 23:59:59";
    
    // Aapka loader 'status' ko string format mein mang raha hai
    // Aur use 'token' aur 'serial' fields chahiye menu open karne ke liye
    return res.status(200).json({ 
        status: "true",           // String format as required by Smali
        message: "LOGIN_SUCCESS",
        expiry: expiryDate,
        token: "WASIM_VIP_TOKEN_786", // Mandatory field for menu trigger
        serial: "GZ-WASIM-999",
        data: {
            username: "WASIM_PREMIUM",
            expiry: expiryDate,
            status: "Premium",
            auth_status: "active",
            mod_menu: "enabled"
        }
    });
});

// 3. ADMIN PANEL (Password: wasim786)
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>WASIM TERMINAL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { background: #000; color: #ff3131; font-family: sans-serif; text-align: center; padding-top: 50px; }
            .box { border: 2px solid #ff3131; padding: 20px; display: inline-block; border-radius: 10px; background: #111; }
            h1 { color: #ffde59; }
        </style>
    </head>
    <body>
        <div class="box">
            <h1>WASIM ENGINE LIVE</h1>
            <p>Bypass Mode: <b>ACTIVE</b></p>
            <p>Menu Trigger: <b>ENABLED</b></p>
            <hr border="1" color="#333">
            <p style="color:#888; font-size:12px;">All Keys will now trigger the Menu.</p>
        </div>
    </body>
    </html>
    `);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 SERVER 100% WORKING"));
