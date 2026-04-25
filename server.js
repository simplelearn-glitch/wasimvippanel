const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. DATABASE CONNECTION ---
const db_url = process.env.MONGO_URI;

mongoose.connect(db_url)
    .then(() => console.log("✅ MONGO DB CONNECTED"))
    .catch((err) => console.log("❌ DB CONNECTION ERROR: " + err.message));

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

// --- 3. UI DESIGN (NEON CYBER TERMINAL) ---
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WASIM ULTIMATE PANEL</title>
        <style>
            :root { --pink: #ff007f; --cyan: #00f2ff; --yellow: #ffde59; --bg: #050505; --card: #0f0f0f; }
            body { background: var(--bg); color: #fff; font-family: 'Segoe UI', sans-serif; margin: 0; }
            #login-screen { position: fixed; inset: 0; background: rgba(0,0,0,0.98); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(15px); }
            .login-card { background: var(--card); padding: 40px; border: 1px solid var(--pink); border-radius: 20px; width: 300px; text-align: center; }
            nav { background: rgba(0,0,0,0.9); padding: 15px 25px; border-bottom: 2px solid var(--pink); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; }
            .logo { font-size: 1.5rem; font-weight: 800; color: var(--cyan); text-shadow: 0 0 10px var(--cyan); }
            .menu-btn { background: var(--pink); color: #fff; border: none; padding: 10px 18px; border-radius: 10px; cursor: pointer; font-weight: bold; box-shadow: 0 0 10px var(--pink); }
            #drawer { position: fixed; right: -100%; top: 0; width: 320px; height: 100vh; background: #080808; z-index: 150; transition: 0.4s; padding: 30px; border-left: 2px solid var(--cyan); box-sizing: border-box; }
            #drawer.open { right: 0; }
            .main-container { padding: 25px; max-width: 800px; margin: auto; }
            .balance-card { background: var(--card); border: 1px solid #222; padding: 35px; border-radius: 25px; text-align: center; margin-bottom: 25px; border-bottom: 5px solid var(--cyan); }
            input, select { background: #000; border: 1px solid #333; color: var(--pink); padding: 14px; margin: 10px 0; width: 100%; border-radius: 12px; outline: none; box-sizing: border-box; }
            button.create-btn { background: linear-gradient(to right, var(--cyan), var(--pink)); color: #fff; border: none; padding: 15px; font-weight: bold; border-radius: 12px; cursor: pointer; width: 100%; margin-top: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { text-align: left; color: #555; font-size: 11px; padding: 12px; border-bottom: 1px solid #222; }
            td { padding: 15px 12px; border-bottom: 1px solid #111; font-size: 14px; }
            .key-glow { color: var(--yellow); font-weight: bold; text-shadow: 0 0 5px var(--yellow); font-family: monospace; }
        </style>
    </head>
    <body>
        <div id="login-screen">
            <div class="login-card">
                <h2 style="color:var(--pink)">SYSTEM LOCK</h2>
                <input type="password" id="master-pw" placeholder="PASSWORD">
                <button class="create-btn" onclick="checkLogin()">INITIALIZE</button>
            </div>
        </div>

        <nav>
            <div class="logo">WASIM<span style="color:#fff">PRO</span></div>
            <button class="menu-btn" onclick="toggleDrawer()">DASHBOARD ☰</button>
        </nav>

        <div id="drawer">
            <span onclick="toggleDrawer()" style="color:var(--cyan); font-size:35px; cursor:pointer; float:right;">×</span>
            <h3 style="color:var(--cyan); margin-top:50px;">PANEL CONTROL</h3>
            <input type="text" id="adm-u" placeholder="Reseller User">
            <input type="text" id="adm-p" placeholder="Reseller Pass">
            <button class="create-btn" onclick="addAdmin()">ADD ADMIN</button>
            <hr style="margin:25px 0; border:#222 1px solid;">
            <input type="text" id="key-name" placeholder="User Name">
            <select id="key-time">
                <option value="2">2 Hours</option>
                <option value="24">1 Day</option>
                <option value="168">7 Days</option>
                <option value="720">30 Days</option>
                <option value="725">30 Days + 5 Hours</option>
                <option value="1440">60 Days</option>
            </select>
            <button class="create-btn" onclick="genKey()">CREATE LICENSE</button>
        </div>

        <div class="main-container">
            <div class="balance-card">
                <p style="color:#666; font-size:11px; letter-spacing:2px;">TOTAL CREDITS</p>
                <h1 style="color:var(--yellow); font-size:48px; margin:10px 0;">∞ 999,999,999</h1>
                <div style="border:1px solid var(--pink); color:var(--pink); padding:4px 15px; border-radius:20px; font-size:10px; font-weight:bold; display:inline-block;">WASIM OWNER STATUS</div>
            </div>
            <div style="background:var(--card); padding:20px; border-radius:15px; border:1px solid #1a1a1a;">
                <h4 style="color:var(--pink); margin:0;">ACTIVE DATABASE</h4>
                <div style="overflow-x:auto;">
                    <table>
                        <thead><tr><th>License Key</th><th>Plan</th><th>Manage</th></tr></thead>
                        <tbody id="key-list"></tbody>
                    </table>
                </div>
            </div>
        </div>

        <script>
            function toggleDrawer() { document.getElementById('drawer').classList.toggle('open'); }
            function checkLogin() {
                if(document.getElementById('master-pw').value === 'wasim786') {
                    document.getElementById('login-screen').style.display = 'none';
                    fetchData();
                } else { alert("ACCESS DENIED"); }
            }
            async function fetchData() {
                const res = await fetch('/admin/all-data');
                const data = await res.json();
                document.getElementById('key-list').innerHTML = data.map(k => \`
                    <tr>
                        <td class="key-glow">\${k.key}</td>
                        <td>\${k.duration}</td>
                        <td><button onclick="delKey('\${k._id}')" style="background:none; color:red; border:none; cursor:pointer;">[DEL]</button></td>
                    </tr>
                \`).join('');
            }
            async function genKey() {
                await fetch('/admin/add-key', {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({key: document.getElementById('key-name').value, hours: document.getElementById('key-time').value})
                });
                alert("Key Generated!"); toggleDrawer(); fetchData();
            }
            async function addAdmin() {
                await fetch('/admin/add-adm', {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({u: document.getElementById('adm-u').value, p: document.getElementById('adm-p').value})
                });
                alert("Reseller Created!"); toggleDrawer();
            }
            async function delKey(id) {
                if(confirm("Delete Key?")) {
                    await fetch('/admin/del-key/' + id, {method:'DELETE'});
                    fetchData();
                }
            }
        </script>
    </body>
    </html>
    `);
});

// --- 4. BACKEND ROUTES ---
app.get('/admin/all-data', async (req, res) => {
    try {
        const keys = await Key.find().sort({createdAt:-1});
        res.json(keys);
    } catch(e) { res.status(500).json([]); }
});

app.post('/admin/add-key', async (req, res) => {
    try {
        const { key, hours } = req.body;
        let exp = new Date();
        exp.setHours(exp.getHours() + parseInt(hours));
        const newK = new Key({
            key: key || "VIP-" + crypto.randomBytes(3).toString('hex').toUpperCase(),
            expiryDate: exp,
            duration: hours + "H"
        });
        await newK.save();
        res.json({ success: true });
    } catch(e) { res.status(500).send("Error"); }
});

app.post('/admin/add-adm', async (req, res) => {
    try {
        await new Admin({ username: req.body.u, password: req.body.p }).save();
        res.json({ success: true });
    } catch(e) { res.status(500).send("Error"); }
});

app.delete('/admin/del-key/:id', async (req, res) => {
    await Key.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// --- LOADER LOGIN API ---
app.post('/login', async (req, res) => {
    const { key, hwid } = req.body;
    const foundKey = await Key.findOne({ key: key });
    if (!foundKey) return res.json({ status: false, msg: "INVALID_KEY" });
    if (new Date() > foundKey.expiryDate) return res.json({ status: false, msg: "EXPIRED" });
    if (foundKey.hwid === "NOT_SET") {
        foundKey.hwid = hwid;
        await foundKey.save();
    } else if (foundKey.hwid !== hwid) {
        return res.json({ status: false, msg: "HWID_MISMATCH" });
    }
    res.json({ status: true, msg: "SUCCESS" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 Server Ready"));
