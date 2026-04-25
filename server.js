const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// 1. DATABASE CONNECTION (Using Render Environment Variable)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ SYSTEM CONNECTED TO MONGODB"))
    .catch((err) => console.log("❌ DB CONNECTION ERROR: ", err.message));

// 2. DATA MODELS
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

// 3. API FOR LOADER (App Connect Logic)
// Link to use in Lib: https://top11.onrender.com/login
app.post('/login', async (req, res) => {
    try {
        const { key, hwid } = req.body;
        const foundKey = await Key.findOne({ key: key });

        if (!foundKey) return res.status(404).json({ status: false, msg: "INVALID_KEY" });
        if (foundKey.isBlocked) return res.status(403).json({ status: false, msg: "USER_BANNED" });
        if (new Date() > foundKey.expiryDate) return res.status(403).json({ status: false, msg: "KEY_EXPIRED" });

        // HWID Locking Logic
        if (foundKey.hwid === "NOT_SET") {
            foundKey.hwid = hwid;
            await foundKey.save();
        } else if (foundKey.hwid !== hwid) {
            return res.status(401).json({ status: false, msg: "HWID_MISMATCH" });
        }

        res.json({ 
            status: true, 
            msg: "SUCCESS",
            data: {
                expiry: foundKey.expiryDate.toISOString().split('T')[0],
                identity: "WASIM_VIP_USER"
            }
        });
    } catch (e) { res.status(500).json({ status: false }); }
});

// 4. PROFESSIONAL PINK UI
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TOP11 VIP TERMINAL</title>
        <style>
            :root { --pink: #ff007f; --bg: #050505; --card: #0d0d0d; --yellow: #ffde59; }
            body { background: var(--bg); color: #fff; font-family: 'Segoe UI', sans-serif; margin: 0; }
            #login-screen { position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(15px); }
            .login-card { background: var(--card); padding: 40px; border: 1px solid var(--pink); border-radius: 15px; width: 300px; text-align: center; }
            nav { background: rgba(13, 13, 13, 0.9); padding: 15px 25px; border-bottom: 1px solid var(--pink); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; }
            .logo { font-size: 1.4rem; font-weight: 800; color: var(--pink); text-shadow: 0 0 10px var(--pink); }
            #drawer { position: fixed; right: -100%; top: 0; width: 300px; height: 100vh; background: #080808; z-index: 150; transition: 0.4s; padding: 30px; border-left: 2px solid var(--pink); box-sizing: border-box; }
            #drawer.open { right: 0; }
            .main-container { padding: 25px; max-width: 800px; margin: auto; }
            .balance-card { background: linear-gradient(135deg, #0d0d0d, #1a000d); border: 1px solid #222; padding: 30px; border-radius: 20px; text-align: center; margin-bottom: 25px; border-bottom: 4px solid var(--pink); }
            input, select { background: #000; border: 1px solid #333; color: var(--pink); padding: 14px; margin: 10px 0; width: 100%; border-radius: 10px; outline: none; box-sizing: border-box; }
            button { background: var(--pink); color: #fff; border: none; padding: 14px; font-weight: bold; border-radius: 10px; cursor: pointer; width: 100%; margin-top: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { text-align: left; color: #555; font-size: 11px; padding: 10px; border-bottom: 1px solid #222; }
            td { padding: 12px 10px; border-bottom: 1px solid #111; font-size: 14px; }
        </style>
    </head>
    <body>
        <div id="login-screen">
            <div class="login-card">
                <h2 style="color:var(--pink)">WASIM ACCESS</h2>
                <input type="password" id="master-pw" placeholder="PASSWORD">
                <button onclick="checkLogin()">INITIALIZE SYSTEM</button>
            </div>
        </div>

        <nav>
            <div class="logo">TOP11<span style="color:#fff">VIP</span></div>
            <button onclick="toggleDrawer()" style="background:var(--pink); color:#fff; border:none; padding:8px 15px; border-radius:5px; cursor:pointer;">MENU ☰</button>
        </nav>

        <div id="drawer">
            <span onclick="toggleDrawer()" style="color:var(--pink); font-size:30px; cursor:pointer; float:right;">×</span>
            <h3 style="color:var(--pink); margin-top:50px;">PANEL CONTROL</h3>
            <input type="text" id="adm-u" placeholder="Admin User">
            <input type="text" id="adm-p" placeholder="Admin Pass">
            <button onclick="addAdmin()" style="background:#fff; color:#000;">ADD ADMIN</button>
            <hr style="margin:20px 0; border:#222 1px solid;">
            <input type="text" id="key-name" placeholder="License Name">
            <select id="key-time">
                <option value="2">2 Hours</option>
                <option value="24">1 Day</option>
                <option value="168">7 Days</option>
            </select>
            <button onclick="genKey()">CREATE KEY</button>
        </div>

        <div class="main-container">
            <div class="balance-card">
                <p style="color:#666; font-size:11px;">CREDITS AVAILABLE</p>
                <h1 style="color:var(--yellow); font-size:45px; margin:10px 0;">∞ 999,999,999</h1>
                <div style="border:1px solid var(--pink); color:var(--pink); padding:4px 12px; border-radius:15px; font-size:10px;">SYSTEM: ACTIVE</div>
            </div>
            <div style="background:var(--card); padding:20px; border-radius:15px;">
                <h4 style="color:var(--pink); margin:0;">ACTIVE DATABASE RECORDS</h4>
                <div style="overflow-x:auto;">
                    <table>
                        <thead><tr><th>Key</th><th>Plan</th><th>Action</th></tr></thead>
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
                        <td style="color:var(--pink); font-weight:bold;">\${k.key}</td>
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

// 5. BACKEND ROUTES
app.get('/admin/all-data', async (req, res) => {
    try {
        const keys = await Key.find().sort({createdAt:-1});
        res.json(keys);
    } catch(e) { res.status(500).json([]); }
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
app.listen(PORT, '0.0.0.0', () => console.log("🚀 ALL-IN-ONE SYSTEM LIVE"));

