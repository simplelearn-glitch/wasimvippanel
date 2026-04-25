const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// 1. DATABASE
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ DB Connected"))
    .catch(err => console.log("❌ DB Error", err));

// 2. MODEL
const Key = mongoose.model('Key', {
    key: String,
    plan: { type: String, default: "VIP" },
    devices: { type: Number, default: 1 },
    status: { type: String, default: "Active" },
    createdAt: { type: Date, default: Date.now }
});

// 3. HELPERS
function getRealTimeExp(createdAt) {
    const date = new Date(createdAt);
    date.setDate(date.getDate() + 30); 
    return date.toISOString().replace('T', ' ').split('.')[0];
}

// 4. API FOR LOADER
app.post('/verify', async (req, res) => {
    try {
        const { key } = req.body;
        const foundKey = await Key.findOne({ key: key });
        if (!foundKey) return res.status(400).json({ status: false, message: "INVALID KEY" });

        res.status(200).json({
            status: true,
            data: {
                modname: "WASIM VIP",
                mod_status: "SAFE",
                credit: "WASIM MODS",
                token: foundKey.key,
                device: foundKey.devices.toString(),
                EXP: getRealTimeExp(foundKey.createdAt),
                rng: Math.floor(1000000000 + Math.random() * 9000000000)
            }
        });
    } catch (err) { res.status(500).json({ status: false }); }
});

// 5. ADMIN ACTIONS
app.post('/admin/login', (req, res) => {
    if (req.body.password === "wasim786") {
        const token = jwt.sign({ role: 'admin' }, "WASIM_SECRET");
        res.json({ success: true, token });
    } else { res.status(401).json({ success: false }); }
});

app.get('/admin/stats', async (req, res) => {
    const total = await Key.countDocuments();
    res.json({ total });
});

app.get('/admin/all-keys', async (req, res) => {
    const keys = await Key.find().sort({ createdAt: -1 });
    res.json(keys);
});

// Create Key (Supports both Random and Manual)
app.post('/generate', async (req, res) => {
    const { manualKey, plan, devices } = req.body;
    const finalKey = manualKey || "WASIM-" + Math.random().toString(36).substr(2, 8).toUpperCase();
    
    const newKey = new Key({
        key: finalKey,
        plan: plan || "VIP",
        devices: devices || 1
    });
    await newKey.save();
    res.json(newKey);
});

app.delete('/admin/key/:id', async (req, res) => {
    await Key.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// 6. PROFESSIONAL DASHBOARD UI
app.get('/panel', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Wasim VIP Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        <style>
            :root { --primary: #00ff88; --bg: #0a0a0a; --card: #151515; --text: #e0e0e0; }
            body { background: var(--bg); color: var(--text); font-family: 'Segoe UI', sans-serif; margin: 0; display: flex; }
            
            /* Sidebar */
            .sidebar { width: 240px; background: var(--card); height: 100vh; position: fixed; border-right: 1px solid #222; }
            .sidebar h2 { color: var(--primary); text-align: center; font-size: 1.2rem; padding: 20px 0; border-bottom: 1px solid #222; }
            .nav-link { padding: 15px 25px; display: block; color: #888; text-decoration: none; transition: 0.3s; }
            .nav-link:hover, .nav-link.active { color: var(--primary); background: #ffffff05; border-left: 4px solid var(--primary); }

            /* Main Content */
            .main { margin-left: 240px; width: calc(100% - 240px); padding: 30px; }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .stat-card { background: var(--card); padding: 20px; border-radius: 12px; border: 1px solid #222; }
            .stat-card h3 { margin: 0; color: #888; font-size: 0.9rem; }
            .stat-card p { font-size: 1.8rem; font-weight: bold; margin: 10px 0 0 0; color: var(--primary); }

            /* Form & Table */
            .action-box { background: var(--card); padding: 25px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #222; }
            input, select { background: #000; border: 1px solid #333; color: #fff; padding: 12px; border-radius: 6px; margin-right: 10px; width: 200px; }
            button { background: var(--primary); color: #000; border: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.3s; }
            button:hover { opacity: 0.8; transform: translateY(-2px); }
            
            table { width: 100%; border-collapse: collapse; background: var(--card); border-radius: 12px; overflow: hidden; }
            th { text-align: left; background: #222; padding: 15px; color: #888; font-size: 0.8rem; text-transform: uppercase; }
            td { padding: 15px; border-bottom: 1px solid #222; }
            .btn-del { background: #ff444422; color: #ff4444; border: 1px solid #ff4444; padding: 5px 12px; border-radius: 4px; }

            /* Login */
            #loginOverlay { position: fixed; inset: 0; background: var(--bg); z-index: 1000; display: flex; align-items: center; justify-content: center; }
            .login-card { background: var(--card); padding: 40px; border-radius: 15px; width: 350px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            
            @media (max-width: 768px) {
                .sidebar { width: 60px; } .sidebar span { display: none; } .main { margin-left: 60px; width: 100%; }
                input { margin-bottom: 10px; width: 100%; }
            }
        </style>
    </head>
    <body>
        <div id="loginOverlay">
            <div class="login-card">
                <h2 style="color:var(--primary)">WASIM VIP LOGIN</h2>
                <input type="password" id="adminPass" placeholder="Enter Password" style="width:100%; margin-bottom:20px;">
                <button onclick="login()" style="width:100%">UNLOCK DASHBOARD</button>
            </div>
        </div>

        <div class="sidebar">
            <h2>WASIM MODS</h2>
            <a href="#" class="nav-link active"><i class="fas fa-home"></i> <span>Dashboard</span></a>
            <a href="#" class="nav-link"><i class="fas fa-key"></i> <span>Key Manager</span></a>
            <a href="#" class="nav-link"><i class="fas fa-users"></i> <span>Devices</span></a>
            <a href="#" class="nav-link"><i class="fas fa-cog"></i> <span>Settings</span></a>
        </div>

        <div class="main">
            <div class="stats-grid">
                <div class="stat-card"><h3>Total Keys</h3><p id="totalKeys">0</p></div>
                <div class="stat-card"><h3>Active Users</h3><p>Online</p></div>
                <div class="stat-card"><h3>Server Status</h3><p style="color:var(--primary)">Online</p></div>
            </div>

            <div class="action-box">
                <h3 style="margin-top:0">Key Generation</h3>
                <input type="text" id="manualKey" placeholder="Manual Key (Leave empty for random)">
                <select id="planSelect"><option value="VIP">VIP Plan</option><option value="PRO">PRO Plan</option></select>
                <button onclick="genKey()"><i class="fas fa-plus"></i> Create Key</button>
            </div>

            <div style="overflow-x:auto">
                <table>
                    <thead><tr><th>Key</th><th>Plan</th><th>Created</th><th>Actions</th></tr></thead>
                    <tbody id="keyList"></tbody>
                </table>
            </div>
        </div>

        <script>
            async function login() {
                const pass = document.getElementById('adminPass').value;
                const r = await fetch('/admin/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ password: pass })
                });
                if(r.ok) {
                    document.getElementById('loginOverlay').style.display = 'none';
                    refresh();
                } else { alert("Access Denied"); }
            }

            async function refresh() {
                const resKeys = await fetch('/admin/all-keys');
                const keys = await resKeys.json();
                const resStats = await fetch('/admin/stats');
                const stats = await resStats.json();
                
                document.getElementById('totalKeys').innerText = stats.total;
                document.getElementById('keyList').innerHTML = keys.map(k => \`
                    <tr>
                        <td style="color:var(--primary); font-family:monospace">\${k.key}</td>
                        <td><span style="background:#333; padding:3px 8px; border-radius:4px; font-size:0.7rem">\${k.plan}</span></td>
                        <td style="color:#666">\${new Date(k.createdAt).toLocaleDateString()}</td>
                        <td><button class="btn-del" onclick="del('\${k._id}')">Delete</button></td>
                    </tr>
                \`).join('');
            }

            async function genKey() {
                const manual = document.getElementById('manualKey').value;
                const plan = document.getElementById('planSelect').value;
                await fetch('/generate', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ manualKey: manual, plan: plan })
                });
                document.getElementById('manualKey').value = '';
                refresh();
            }

            async function del(id) {
                if(confirm("Permanently delete key?")) {
                    await fetch('/admin/key/'+id, { method:'DELETE' });
                    refresh();
                }
            }
        </script>
    </body>
    </html>
    `);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 Server on " + PORT));

