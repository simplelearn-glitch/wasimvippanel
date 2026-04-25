const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// 1. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ DB Connected Successfully"))
    .catch(err => {
        console.log("❌ DB Error: ", err);
        process.exit(1);
    });

// 2. KEY DATA MODEL
const Key = mongoose.model('Key', {
    key: String,
    hwid: { type: String, default: "NOT_SET" },
    isBlocked: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// 3. API ENDPOINT FOR LOADER (POST Connection)
app.post('/connect', async (req, res) => {
    try {
        const { key, hwid } = req.body;
        const foundKey = await Key.findOne({ key: key });

        if (!foundKey) return res.status(404).json({ status: false, message: "INVALID_KEY" });
        if (foundKey.isBlocked) return res.status(403).json({ status: false, message: "KEY_BANNED" });

        // HWID Locking Logic
        if (foundKey.hwid === "NOT_SET") {
            foundKey.hwid = hwid;
            await foundKey.save();
        } else if (foundKey.hwid !== hwid) {
            return res.status(401).json({ status: false, message: "HWID_MISMATCH" });
        }

        // Success Response
        const expDate = new Date(foundKey.createdAt);
        expDate.setDate(expDate.getDate() + 30);

        res.status(200).json({
            status: true,
            data: {
                mod_name: "WASIM VIP",
                mod_status: "SAFE ✅",
                token: foundKey.key,
                expiry: expDate.toISOString().replace('T', ' ').split('.')[0],
                rng: Math.floor(Math.random() * 999999)
            }
        });
    } catch (err) { res.status(500).json({ status: false }); }
});

// 4. ADMIN DASHBOARD ACTIONS
app.get('/admin/list', async (req, res) => res.json(await Key.find().sort({createdAt: -1})));

app.post('/admin/add', async (req, res) => {
    const k = req.body.key || "WASIM-" + Math.random().toString(36).substr(2, 8).toUpperCase();
    await new Key({ key: k }).save();
    res.json({ success: true });
});

app.post('/admin/reset', async (req, res) => {
    await Key.findByIdAndUpdate(req.body.id, { hwid: "NOT_SET" });
    res.json({ success: true });
});

app.post('/admin/block', async (req, res) => {
    const k = await Key.findById(req.body.id);
    k.isBlocked = !k.isBlocked;
    await k.save();
    res.json({ success: true });
});

app.delete('/admin/del/:id', async (req, res) => {
    await Key.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// 5. PROFESSIONAL DASHBOARD UI
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Wasim VIP Admin</title>
        <style>
            :root { --neon: #00ff88; --bg: #050505; --card: #111; }
            body { background: var(--bg); color: #eee; font-family: 'Segoe UI', sans-serif; margin: 0; display: flex; }
            .sidebar { width: 250px; background: var(--card); height: 100vh; position: fixed; border-right: 1px solid #222; padding: 20px; }
            .main { margin-left: 270px; padding: 40px; width: 100%; }
            .card { background: var(--card); border: 1px solid #222; border-radius: 12px; padding: 25px; margin-bottom: 20px; }
            .neon-text { color: var(--neon); text-shadow: 0 0 8px var(--neon); }
            input, select, button { padding: 12px; border-radius: 8px; border: 1px solid #333; }
            input { background: #000; color: #fff; width: 280px; margin-right: 10px; }
            button { background: var(--neon); color: #000; font-weight: bold; cursor: pointer; border: none; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; padding: 15px; border-bottom: 2px solid #222; font-size: 0.8rem; color: #555; }
            td { padding: 15px; border-bottom: 1px solid #1a1a1a; font-size: 0.9rem; }
            .btn-mini { padding: 5px 10px; font-size: 10px; background: #222; color: #fff; margin-right: 5px; cursor: pointer; border: 1px solid #444; }
            #auth-wall { position: fixed; inset: 0; background: #000; z-index: 9999; display: flex; align-items: center; justify-content: center; }
        </style>
    </head>
    <body>
        <div id="auth-wall">
            <div class="card" style="text-align:center; width: 320px;">
                <h2 class="neon-text">WASIM TERMINAL</h2>
                <input type="password" id="pass" placeholder="Enter Password" style="width: 85%; margin-bottom: 20px;">
                <button onclick="login()" style="width: 85%;">LOGIN</button>
            </div>
        </div>

        <div class="sidebar">
            <h2 class="neon-text">WASIM MODS</h2>
            <hr style="border:0; border-top:1px solid #222; margin: 20px 0;">
            <p>💻 Dashboard</p>
            <p>🔑 Keys Active</p>
            <p>🛡️ Anti-Cheat</p>
            <p>⚙️ Server v3.0</p>
        </div>

        <div class="main">
            <h1 class="neon-text">Control Center</h1>
            <div class="card">
                <h3>Provisioning</h3>
                <input type="text" id="manual" placeholder="Custom Key Name (Optional)">
                <button onclick="addKey()">+ CREATE KEY</button>
            </div>

            <div class="card" style="padding:0">
                <table>
                    <thead><tr><th>License Key</th><th>Hardware ID</th><th>Status</th><th>Control</th></tr></thead>
                    <tbody id="list"></tbody>
                </table>
            </div>
        </div>

        <script>
            function login() {
                if(document.getElementById('pass').value === 'wasim786') {
                    document.getElementById('auth-wall').style.display='none';
                    load();
                } else { alert('Access Denied'); }
            }

            async function load() {
                const r = await fetch('/admin/list');
                const data = await r.json();
                document.getElementById('list').innerHTML = data.map(k => \`
                    <tr>
                        <td style="color:var(--neon); font-family:monospace;">\${k.key}</td>
                        <td style="color:#666; font-size:0.8rem;">\${k.hwid}</td>
                        <td style="color:\${k.isBlocked ? 'red' : 'green'}">\${k.isBlocked ? 'BANNED' : 'ACTIVE'}</td>
                        <td>
                            <button class="btn-mini" onclick="act('/admin/reset', '\${k._id}')">RESET HWID</button>
                            <button class="btn-mini" onclick="act('/admin/block', '\${k._id}')">\${k.isBlocked ? 'UNBLOCK' : 'BLOCK'}</button>
                            <button class="btn-mini" style="color:red" onclick="del('\${k._id}')">DEL</button>
                        </td>
                    </tr>
                \`).join('');
            }

            async function addKey() {
                const val = document.getElementById('manual').value;
                await fetch('/admin/add', {
                    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({key:val})
                });
                document.getElementById('manual').value = '';
                load();
            }

            async function act(url, id) {
                await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id}) });
                load();
            }

            async function del(id) {
                if(confirm("Confirm Delete?")) {
                    await fetch('/admin/del/'+id, { method:'DELETE' });
                    load();
                }
            }
        </script>
    </body>
    </html>
    `);
});

// 6. SERVER START
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 Wasim Server Live on " + PORT));

