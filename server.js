const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// 1. DATABASE
mongoose.connect(process.env.MONGO_URI).then(() => console.log("✅ Main System Online"));

// 2. MODELS
const Admin = mongoose.model('Admin', {
    username: { type: String, unique: true },
    password: { type: String },
    isBlocked: { type: Boolean, default: false },
    role: { type: String, default: "RESELLER" } // OWNER or RESELLER
});

const Key = mongoose.model('Key', {
    key: String,
    hwid: { type: String, default: "NOT_SET" },
    isBlocked: { type: Boolean, default: false },
    expiryDate: Date,
    duration: String,
    createdBy: String // Admin ka username track karne ke liye
});

// 3. SUPER ADMIN LOGIN (OWNER)
const OWNER_AUTH = { user: "wasim", pass: "wasim786" };

// 4. ADMIN LOGIN API
app.post('/admin/login', async (req, res) => {
    const { u, p } = req.body;
    if (u === OWNER_AUTH.user && p === OWNER_AUTH.pass) {
        return res.json({ success: true, role: "OWNER" });
    }
    const adm = await Admin.findOne({ username: u, password: p });
    if (adm) {
        if (adm.isBlocked) return res.status(403).json({ message: "YOUR PANEL IS BLOCKED BY OWNER" });
        return res.json({ success: true, role: "RESELLER" });
    }
    res.status(401).json({ message: "INVALID ACCESS" });
});

// 5. PROFESSIONAL MULTI-PANEL UI
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>WASIM CONTROL CENTER</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            :root { --red: #ff3131; --yellow: #ffde59; --bg: #000; }
            body { background: #000; color: #fff; font-family: 'Arial', sans-serif; margin:0; }
            .login-box { position:fixed; inset:0; background:#000; z-index:1000; display:flex; align-items:center; justify-content:center; }
            .card { background:#111; padding:25px; border-left:4px solid var(--red); border-radius:8px; width:90%; max-width:400px; }
            nav { background:#111; padding:15px; border-bottom:2px solid var(--red); display:flex; justify-content:space-between; align-items:center; }
            .container { padding:20px; }
            .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:20px; }
            input, select { background:#000; border:1px solid #333; color:var(--yellow); padding:12px; margin:5px 0; width:100%; box-sizing:border-box; }
            button { background:var(--red); color:#fff; border:none; padding:12px; font-weight:bold; cursor:pointer; width:100%; border-radius:4px; }
            .badge { background:var(--yellow); color:#000; padding:2px 8px; font-size:10px; font-weight:bold; border-radius:10px; }
            table { width:100%; border-collapse:collapse; margin-top:15px; font-size:0.8rem; }
            th { text-align:left; color:var(--red); border-bottom:1px solid #333; padding:10px; }
            td { padding:10px; border-bottom:1px solid #111; }
        </style>
    </head>
    <body>
        <div id="login-screen" class="login-box">
            <div class="card">
                <h2 style="color:var(--red); text-align:center;">TERMINAL LOGIN</h2>
                <input type="text" id="user" placeholder="USERNAME">
                <input type="password" id="pass" placeholder="PASSWORD">
                <button onclick="auth()">CONNECT</button>
            </div>
        </div>

        <nav>
            <h2 style="color:var(--red); margin:0;">WASIM <span id="role-tag" class="badge">SYSTEM</span></h2>
            <div id="balance" style="color:var(--yellow); font-weight:bold;">CREDIT: ∞</div>
        </nav>

        <div class="container">
            <div class="grid">
                <div class="card">
                    <h3 id="action-title" style="color:var(--yellow)">GENERATE KEY</h3>
                    <div id="owner-tools" style="display:none;">
                        <input type="text" id="new-adm-u" placeholder="Admin Username">
                        <input type="text" id="new-adm-p" placeholder="Admin Password">
                        <button onclick="createAdmin()" style="background:var(--yellow); color:#000;">CREATE NEW ADMIN</button>
                        <hr style="border:0.5px solid #222; margin:20px 0;">
                    </div>
                    <input type="text" id="key-name" placeholder="License Name">
                    <select id="key-time">
                        <option value="2">2 Hours</option>
                        <option value="24">1 Day</option>
                        <option value="168">7 Days</option>
                        <option value="720">30 Days</option>
                    </select>
                    <button onclick="genKey()">CREATE LICENSE</button>
                </div>

                <div class="card">
                    <h3 style="color:var(--red)">ACTIVE DATA</h3>
                    <div style="overflow-x:auto;">
                        <table id="data-table">
                            <thead><tr id="table-head"><th>Key</th><th>Status</th><th>Action</th></tr></thead>
                            <tbody id="table-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <script>
            let sessionUser = "";
            let sessionRole = "";

            async function auth() {
                const u = document.getElementById('user').value;
                const p = document.getElementById('pass').value;
                const res = await fetch('/admin/login', {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({u, p})
                });
                const data = await res.json();
                if(data.success) {
                    sessionUser = u;
                    sessionRole = data.role;
                    document.getElementById('login-screen').style.display = 'none';
                    document.getElementById('role-tag').innerText = sessionRole;
                    if(sessionRole === "OWNER") document.getElementById('owner-tools').style.display = 'block';
                    loadData();
                } else { alert(data.message); }
            }

            async function loadData() {
                const url = sessionRole === "OWNER" ? '/admin/all-data' : '/admin/my-keys?u='+sessionUser;
                const res = await fetch(url);
                const data = await res.json();
                
                let html = "";
                if(sessionRole === "OWNER" && data.admins) {
                    // Show Admins to Owner
                    html += "<tr><th colspan='3' style='color:var(--yellow)'>--- REGISTERED ADMINS ---</th></tr>";
                    data.admins.forEach(a => {
                        html += \`<tr><td>\${a.username}</td><td>\${a.isBlocked ? 'BLOCKED' : 'ACTIVE'}</td>
                        <td><button onclick="blockAdm('\${a._id}')" style="font-size:9px; background:#444;">BLOCK/UNBLOCK</button></td></tr>\`;
                    });
                }

                html += "<tr><th colspan='3' style='color:var(--yellow)'>--- LICENSE KEYS ---</th></tr>";
                data.keys.forEach(k => {
                    html += \`<tr><td>\${k.key}</td><td>\${k.duration}</td>
                    <td><button onclick="delKey('\${k._id}')" style="color:red; background:none; border:1px solid red; font-size:9px;">DEL</button></td></tr>\`;
                });
                document.getElementById('table-body').innerHTML = html;
            }

            async function genKey() {
                await fetch('/admin/add-key', {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({key: document.getElementById('key-name').value, hours: document.getElementById('key-time').value, user: sessionUser})
                });
                loadData();
            }

            async function createAdmin() {
                await fetch('/admin/add-reseller', {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({u: document.getElementById('new-adm-u').value, p: document.getElementById('new-adm-p').value})
                });
                loadData();
            }

            async function blockAdm(id) { await fetch('/admin/block-reseller', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id})}); loadData(); }
            async function delKey(id) { if(confirm("Delete Key?")) { await fetch('/admin/del-key/'+id, {method:'DELETE'}); loadData(); } }
        </script>
    </body>
    </html>
    `);
});

// 6. OWNER & RESELLER APIS
app.post('/admin/add-reseller', async (req, res) => {
    await new Admin({ username: req.body.u, password: req.body.p }).save();
    res.json({ success: true });
});

app.post('/admin/block-reseller', async (req, res) => {
    const adm = await Admin.findById(req.body.id);
    await Admin.findByIdAndUpdate(req.body.id, { isBlocked: !adm.isBlocked });
    res.json({ success: true });
});

app.get('/admin/all-data', async (req, res) => {
    const keys = await Key.find().sort({createdAt:-1});
    const admins = await Admin.find();
    res.json({ keys, admins });
});

app.get('/admin/my-keys', async (req, res) => {
    const keys = await Key.find({ createdBy: req.query.u }).sort({createdAt:-1});
    res.json({ keys });
});

app.post('/admin/add-key', async (req, res) => {
    const { key, hours, user } = req.body;
    let exp = new Date();
    exp.setHours(exp.getHours() + parseInt(hours));
    await new Key({
        key: key || "WASIM-" + crypto.randomBytes(3).toString('hex').toUpperCase(),
        expiryDate: exp,
        duration: hours + "H",
        createdBy: user
    }).save();
    res.json({ success: true });
});

app.delete('/admin/del-key/:id', async (req, res) => { await Key.findByIdAndDelete(req.params.id); res.json({ success: true }); });

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 Multi-Panel System Live"));

