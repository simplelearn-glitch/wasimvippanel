const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MONGO DB CONNECTED"))
    .catch((err) => console.log("❌ DB ERROR: " + err.message));

// --- 2. DATA MODELS ---
const Key = mongoose.model('Key', {
    key: String,
    hwid: { type: String, default: "NOT_SET" },
    isBlocked: { type: Boolean, default: false },
    expiryDate: Date,
    duration: String,
    createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', {
    username: { type: String, unique: true },
    password: { type: String }
});

// --- 3. UI DESIGN (NEON MULTI-COLOR PROFESSIONAL) ---
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WASIM ULTIMATE TERMINAL</title>
        <style>
            :root { 
                --pink: #ff007f; 
                --cyan: #00f2ff; 
                --purple: #bc13fe;
                --yellow: #ffde59;
                --bg: #020202; 
                --card: rgba(20, 20, 20, 0.8); 
            }
            body { background: var(--bg); color: #fff; font-family: 'Segoe UI', sans-serif; margin: 0; overflow-x: hidden; }
            
            /* Colorful Background Glow */
            body::before { content: ""; position: fixed; top: -10%; left: -10%; width: 40%; height: 40%; background: radial-gradient(circle, rgba(255, 0, 127, 0.15), transparent); z-index: -1; }
            body::after { content: ""; position: fixed; bottom: -10%; right: -10%; width: 40%; height: 40%; background: radial-gradient(circle, rgba(0, 242, 255, 0.1), transparent); z-index: -1; }

            #login-screen { position: fixed; inset: 0; background: rgba(0,0,0,0.98); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(20px); }
            .login-card { background: var(--card); padding: 40px; border: 1px solid var(--pink); border-radius: 20px; width: 320px; text-align: center; box-shadow: 0 0 40px rgba(255, 0, 127, 0.2); }
            
            nav { background: rgba(0, 0, 0, 0.9); padding: 15px 30px; border-bottom: 2px solid var(--pink); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; box-shadow: 0 5px 20px rgba(0,0,0,0.5); }
            .logo { font-size: 1.6rem; font-weight: 900; background: linear-gradient(to right, var(--pink), var(--cyan)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 0 10px rgba(255,0,127,0.3); }
            
            .menu-btn { background: linear-gradient(45deg, var(--pink), var(--purple)); color: #fff; border: none; padding: 10px 20px; border-radius: 12px; cursor: pointer; font-weight: bold; box-shadow: 0 0 15px var(--pink); }

            #drawer { position: fixed; right: -100%; top: 0; width: 320px; height: 100vh; background: rgba(10, 10, 10, 0.95); z-index: 150; transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1); padding: 35px; border-left: 2px solid var(--cyan); backdrop-filter: blur(15px); box-sizing: border-box; }
            #drawer.open { right: 0; }
            .close-x { color: var(--cyan); font-size: 40px; cursor: pointer; float: right; }

            .main-container { padding: 30px; max-width: 900px; margin: auto; }
            .balance-card { background: var(--card); border: 1px solid #333; padding: 35px; border-radius: 25px; text-align: center; margin-bottom: 30px; position: relative; overflow: hidden; border-top: 4px solid var(--cyan); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            
            input, select { background: #000; border: 1px solid #333; color: var(--cyan); padding: 15px; margin: 12px 0; width: 100%; border-radius: 12px; outline: none; box-sizing: border-box; font-weight: bold; }
            input:focus { border-color: var(--pink); box-shadow: 0 0 10px var(--pink); }
            
            button.create-btn { background: linear-gradient(45deg, var(--cyan), var(--purple)); color: #fff; border: none; padding: 15px; font-weight: bold; border-radius: 12px; cursor: pointer; width: 100%; margin-top: 10px; }
            
            .table-card { background: var(--card); border-radius: 20px; padding: 25px; border: 1px solid #222; backdrop-filter: blur(5px); }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; color: #777; font-size: 12px; text-transform: uppercase; padding: 12px; border-bottom: 1px solid #333; }
            td { padding: 15px 12px; border-bottom: 1px solid #1a1a1a; font-size: 14px; }
            .key-glow { color: var(--yellow); font-weight: bold; font-family: monospace; text-shadow: 0 0 5px var(--yellow); }
            .del-icon

