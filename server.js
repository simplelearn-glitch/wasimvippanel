const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. MONGODB CONNECTION ---
// Make sure MONGO_URI is correct in Render Env Variables
const db_url = process.env.MONGO_URI;

mongoose.connect(db_url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ CLOUD DB CONNECTED"))
    .catch((err) => console.log("❌ DB CONNECTION ERROR: ", err.message));

// --- 2. DATA SCHEMA (Isse data table banti hai) ---
const keySchema = new mongoose.Schema({
    key: { type: String, required: true },
    hwid: { type: String, default: "NOT_SET" },
    duration: String,
    expiryDate: Date,
    status: { type: String, default: "Active" },
    createdAt: { type: Date, default: Date.now }
});

const Key = mongoose.model('Key', keySchema);

// --- 3. UI DESIGN (NEON PINK & CYAN ULTIMATE) ---
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WASIM VIP TERMINAL</title>
        <style>
            :root { --pink: #ff007f; --cyan: #00f2ff; --yellow: #ffde59; --bg: #050505; }
            body { background: var(--bg); color: #fff; font-family: 'Segoe UI', sans-serif; margin: 0; }
            #login-screen { position: fixed; inset: 0; background: rgba(0,0,0,0.98); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(20px); }
            .card { background: #0f0f0f; padding: 40px; border: 1px solid var(--pink); border-radius: 20px; width: 300px; text-align: center; box-shadow: 0 0 30px rgba(255,0,127,0.2); }
            nav { background: #000; padding: 15px 25px; border-bottom: 2px solid var(--pink); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; }
            .logo { font-size: 1.5rem; font-weight: 900; color: var(--cyan); text-shadow: 0 0 10px var(--cyan); }
            #drawer { position: fixed; right: -100%; top: 0; width: 320px; height: 100vh; background: #080808; z-index: 150; transition: 0.4s; padding: 30px; border-left: 2px solid var(--cyan); box-sizing: border-box; }
            #drawer.open { right: 0; }
            .main-container { padding: 25px; max-width: 850px; margin: auto; }
            .balance-box { background: #0f0f0f; border: 1px solid #222; padding: 30px; border-radius: 20px; text-align: center; border-bottom: 5px solid var(--cyan); margin-bottom: 30px; }
            input, select { background: #000; border: 1px solid #333; color: var(--pink); padding: 14px; margin: 10px 0; width: 100%; border-radius: 12px; outline: none; box-sizing: border-box; font-weight: bold; }
            button.btn { background: linear-gradient(to right, var(--cyan), var(--pink)); color: #fff; border: none; padding: 15px; font-weight: bold; border-radius: 12px; cursor: pointer; width: 100%; margin-top: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { text-align: left; color: #555; font-size: 11px; padding: 12px; border-bottom: 1px solid #222; }
            td { padding: 15px 12px; border-bottom: 1px solid #111; font-size: 14px; color: #eee; }
            .key-glow { color: var(--yellow); font-weight: bold; text-shadow: 0 0 5px var(--yellow); font-family: monospace; }
        </style>
    </head>
    <body>
        <div id="login-screen">
            <div class="card">
                <h2 style="color:var(--pink)">SECURITY LOGIN</h2>
                <input type="password" id="pw" placeholder="PASSWORD">
                <button class="btn" onclick="auth()">CONNECT</button>
            </div>
        </div>

        <nav>
            <div class="logo">WASIM<span style="color:#fff">PRO</span></div>
            <button onclick="toggle()" style="background:var(--pink); color:#fff; border:none; padding:10px 15px; border-radius:8px; cursor:pointer; font-weight:bold;">MENU ☰</button>
        </nav>

        <div id="drawer">
            <span onclick="toggle()" style="color:var(--cyan); font-size:35px; cursor:pointer; float:right;">×</span>
            <h3 style="color:var(--cyan); margin-top:50px;">PANEL TOOLS</h3>
            <input type="text" id="kName" placeholder="Key Name (Optional)">
            <select id="kTime">
                <option value="2">2 Hours</option>
                <option value="24">1 Day</option>
                <option value="168">7 Days</option>
                <option value="720">30 Days</option>
                <option value="725">30 Days + 5H</option>
                <option value="1440">60 Days</option>
            </select>
            <button class="btn" onclick="createKey()">GENERATE & SAVE</button>
        </div>

        <div class="main-container">
            <div class="balance-box">
                <p style="color:#666; font-size:11px; letter-spacing:2px;">UNLIMITED CREDITS</p>
                <h1 style="color:var(--yellow); font-size:50px; margin:10px 0;">∞ 999,999,999</h1>
                <span style="border:1px solid var(--pink); color:var(--pink); padding:4px 15px; border-radius:20px; font-size:10px; font-weight:bold;">WASIM OWNER STATUS</span>
            </div>

            <div style="background:#0f0f0f; padding:20px; border-radius:15px; border:1px solid #1a1a1a;">
                <h4 style="color:var(--pink); margin:0;">ACTIVE KEYS IN DATABASE</h4>
                <div style="overflow-x:auto;">
                    <table>
                        <thead><tr><th>Key ID</th><th>Plan</th><th>Action</th></tr></thead>
                        <tbody id="list"></tbody>
                    </table>
                </div>
            </div>
        </div>

        <script>
            function toggle() { document.getElementById('drawer').classList.toggle('open'); }
            function auth() {
                if(document.getElementById('pw').value === 'wasim786') {
                    document.getElementById('login-screen').style.display='none';
                    load();
                } else { alert("ACCESS DENIED"); }
            }

            async function load() {
                const res = await fetch('/api/keys');
                const data = await res.json();
                document.getElementById('list').innerHTML = data.map(k => \`
                    <tr>
                        <td class="key-glow">\${k.key}</td>
                        <td>\${k.duration}</td>
                        <td><button onclick="del('\${k._id}')" style="color:red; background:none; border:none; cursor:pointer;">[DELETE]</button></td>
                    </tr>
                \`).join('');
            }

            async function createKey() {
                const name = document.getElementById('kName').value;
                const hours = document.getElementById('kTime').value;
                
                const res = await fetch('/api/keys/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: name, hours: hours })
                });
                
                const result = await res.json();
                if(result.success) {
                    alert("✅ KEY SAVED TO MONGODB!");
                    toggle();
                    load();
                } else {
                    alert("❌ ERROR: " + result.error);
                }
            }

            async function del(id) {
                if(confirm("Delete Key?")) {
                    await fetch('/api/keys/'+id, { method: 'DELETE' });
                    load();
                }
            }
        </script>
    </body>
    </html>
    `);
});

// --- 4. BACKEND API ROUTES ---

// Fetch all keys
app.get('/api/keys', async (req, res) => {
    try {
        const data = await Key.find().sort({ createdAt: -1 });
        res.json(data);
    } catch (e) { res.status(500).json([]); }
});

// Add key to DB
app.post('/api/keys/add', async (req, res) => {
    try {
        const { key, hours } = req.body;
        let exp = new Date();
        exp.setHours(exp.getHours() + parseInt(hours));
        
        const generatedKey = key || "VIP-" + crypto.randomBytes(3).toString('hex').toUpperCase();
        
        const newEntry = new Key({
            key: generatedKey,
            duration: hours + "H",
            expiryDate: exp
        });

        const saved = await newEntry.save();
        console.log("💾 Key Saved:", saved.key);
        res.json({ success: true, key: saved.key });
    } catch (e) {
        console.log("❌ Save Error:", e.message);
        res.json({ success: false, error: e.message });
    }
});

// Delete Key
app.delete('/api/keys/:id', async (req, res) => {
    await Key.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// LOADER API
app.post('/login', async (req, res) => {
    const { key, hwid } = req.body;
    const found = await Key.findOne({ key: key });
    if (!found) return res.json({ status: false, msg: "INVALID" });
    if (new Date() > found.expiryDate) return res.json({ status: false, msg: "EXPIRED" });
    
    if (found.hwid === "NOT_SET") {
        found.hwid = hwid;
        await found.save();
    } else if (found.hwid !== hwid) {
        return res.json({ status: false, msg: "HWID_MISMATCH" });
    }
    res.json({ status: true, msg: "SUCCESS" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 SERVER READY"));
