const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. DATABASE CONNECTION LOGIC ---
const db_url = process.env.MONGO_URI || ""; 

if (db_url !== "") {
    mongoose.connect(db_url)
        .then(() => console.log("✅ MONGO CONNECTED"))
        .catch((err) => console.log("❌ DB ERROR: " + err.message));
} else {
    console.log("⚠️ WARNING: MONGO_URI is missing in Render Environment Variables!");
}

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

// --- 3. THEME & UI (CYBER-PINK LOOK) ---
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TOP11 VIP PANEL</title>
        <style>
            :root { --pink: #ff007f; --bg: #050505; --card: #0d0d0d; --yellow: #ffde59; }
            body { background: var(--bg); color: #fff; font-family: 'Segoe UI', sans-serif; margin: 0; overflow-x: hidden; }
            #login-screen { position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(15px); }
            .login-card { background: var(--card); padding: 40px; border: 1px solid var(--pink); border-radius: 15px; width: 300px; text-align: center; box-shadow: 0 0 30px rgba(255, 0, 127, 0.3); }
            nav { background: rgba(13, 13, 13, 0.9); padding: 15px 25px; border-bottom: 1px solid var(--pink); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; }
            .logo { font-size: 1.4rem; font-weight: 800; color: var(--pink); text-shadow: 0 0 10px var(--pink); }
            .menu-btn { background: var(--pink); color: #fff; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: bold; }
            #drawer { position: fixed; right: -100%; top: 0; width: 300px; height: 100vh; background: #080808; z-index: 150; transition: 0.4s; padding: 30px; border-left: 2px solid var(--pink); box-sizing: border-box; }
            #drawer.open { right: 0; }
            .close-x { color: var(--pink); font-size: 35px; cursor: pointer; float: right; }
            .main-container { padding: 25px; max-width: 800px; margin: auto; }
            .balance-card { background: linear-gradient(135deg, #0d0d0d, #1a000d); border: 1px solid #222; padding: 30px; border-radius: 20px; text-align: center; margin-bottom: 25px; border-bottom: 4px solid var(--pink); }
            .key-table-card { background: var(--card); border-radius: 15px; padding: 20px; border: 1px solid #1a1a1a; }
            input, select { background: #000; border: 1px solid #333; color: var(--pink); padding: 14px; margin: 10px 0; width: 100%; border-radius: 10px; outline: none; box-sizing: border-box; }
            button.action-btn { background: var(--pink); color: #fff; border: none; padding: 14px; font-weight: bold; border-radius: 10px; cursor: pointer; width: 100%; margin-top: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { text-align: left; color: #555; font-size: 11px; padding: 10px; border-bottom: 1px solid #222; }
            td { padding: 12px 10px; border-bottom: 1px solid #111; font-size: 14px; }
            .key-txt { color: var(--pink); font-weight: bold; font-family: monospace; }
        </style>
    </head>
    <body>
        <div id="login-screen">
            <div class="login-card">
                <h2 style="color:var(--pink); margin:0;">WASIM ACCESS</h2>
                <p style="color:#444; font-size:10px; margin-bottom:20px;">PINK TERMINAL v3.0</p>
                <input type="password" id="master-pw" placeholder="PASSWORD">
                <button class="action-btn" onclick="checkLogin()">INITIALIZE</button>
            </div>
        </div>

        <nav>
            <div class="logo">TOP11<span style="color:#fff">VIP</span></div>
            <button class="menu-btn" onclick="toggleDrawer()">DASHBOARD ☰</button>
        </nav>

        <div id="drawer">
            <span class="close-x" onclick="toggleDrawer()">×</span>
            <h3 style="color:var(--pink); margin-top:50px;">CONTROL PANEL</h3>
            <input type="text" id="adm-u" placeholder="Admin Username">
            <input type="text" id="adm-p" placeholder="Admin Password">
            <button class="action-btn" onclick="addAdmin()" style="background:#fff; color:#000;">ADD ADMIN</button>
            <hr style="margin:20px 0; border:#222 1px solid;">
            <input type="text" id="key-name" placeholder="License Name">
            <select id="key-time">
                <option value="2">2 Hours</option>
                <option value="24">1 Day</option>
                <option value="168">7 Days</option>
            </select>
            <button class="action-btn" onclick="genKey()">GENERATE KEY</button>
        </div>

        <div class="main-container">
            <div class="balance-card">
                <p style="color:#666; font-size:11px;">UNLIMITED BALANCE</p>
                <h1 style="color:var(--yellow); font-size:45px; margin:10px 0;">∞ 999,999,999</h1>
                <div style="border:1px solid var(--pink); color:var(--pink); padding:4px 12px; border-radius:15px; font-size:10px; display:inline-block;">OWNER ACCESS</div>
            </div>
            <div class="key-table-card">
                <h4 style="color:var(--pink); margin:0;">ACTIVE KEYS</h4>
                <div style="overflow-x:auto;">
                    <table>
                        <thead><tr><th>Key</th><th>Time</th><th>Action</th></tr></thead>
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
                } else { alert("WRONG PASSWORD"); }
            }
            async function fetchData() {
                try {
                    const res = await fetch('/admin/all-data');
                    const data = await res.json();
                    document.getElementById('key-list').innerHTML = data.keys.map(k => \`
                        <tr>
                            <td class="key-txt">\${k.key}</td>
                            <td>\${k.duration}</td>
                            <td><button onclick="delKey('\${k._id}')" style="color:red; background:none; border:none; cursor:pointer;">[DEL]</button></td>
                        </tr>
                    \`).join('');
                } catch(e) { console.log("Fetch error"); }
            }
            async function genKey() {
                await fetch('/admin/add-key', {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({key: document.getElementById('key-name').value, hours: document.getElementById('key-time').value})
                });
                alert("Key Created!"); toggleDrawer(); fetchData();
            }
            async function addAdmin() {
                await fetch('/admin/add-adm', {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({u: document.getElementById('adm-u').value, p: document.getElementById('adm-p').value})
                });
                alert("Admin Created!"); toggleDrawer();
            }
            async function delKey(id) {
                if(confirm("Delete?")) {
                    await fetch('/admin/del-key/'+id, {method:'DELETE'});
                    fetchData();
                }
            }
        </script>
    </body>
    </html>
    `);
});

// --- 4. BACKEND APIS ---
app.get('/admin/all-data', async (req, res) => {
    try {
        const keys = await Key.find().sort({createdAt:-1});
        res.json({ keys });
    } catch(e) { res.status(500).json({keys:[]}); }
});

app.post('/admin/add-key', async (req, res) => {
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
});

app.post('/admin/add-adm', async (req, res) => {
    await new Admin({ username: req.body.u, password: req.body.p }).save();
    res.json({ success: true });
});

app.delete('/admin/del-key/:id', async (req, res) => {
    await Key.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 Server Live on Port " + PORT));
