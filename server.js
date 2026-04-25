const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// 1. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ RAINBOW DB CONNECTED"))
    .catch((err) => console.log("❌ DB ERROR: " + err.message));

// 2. DATA MODELS
const Key = mongoose.model('Key', {
    key: String,
    hwid: { type: String, default: "NOT_SET" },
    expiryDate: Date,
    duration: String,
    createdAt: { type: Date, default: Date.now }
});

const Reseller = mongoose.model('Reseller', {
    username: { type: String, unique: true },
    password: { type: String }
});

// 3. CSS (CHAMKILA RAINBOW THEME)
const styles = `
<style>
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&display=swap');
    :root { --bg: #050505; }
    body { background: var(--bg); color: #fff; font-family: 'Orbitron', sans-serif; margin: 0; overflow-x: hidden; }

    /* Moving Rainbow Glow Effect */
    .rainbow-border {
        position: relative; border-radius: 20px; background: #000; padding: 3px;
        background-image: linear-gradient(var(--angle), #ff0000, #ff00ff, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000);
        animation: rotate 4s linear infinite;
    }
    @property --angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
    @keyframes rotate { from { --angle: 0deg; } to { --angle: 360deg; } }

    .inner-card { background: #0a0a0a; border-radius: 17px; padding: 30px; text-align: center; }
    
    /* Neon Buttons */
    .glow-btn {
        background: linear-gradient(45deg, #00f2ff, #ff007f); border: none; color: white;
        padding: 15px; border-radius: 12px; font-weight: 900; cursor: pointer; width: 100%;
        text-transform: uppercase; letter-spacing: 2px; box-shadow: 0 0 15px #00f2ff; transition: 0.3s;
    }
    .glow-btn:hover { transform: scale(1.02); box-shadow: 0 0 25px #ff007f; }

    input, select {
        background: #000; border: 1px solid #333; color: #00f2ff;
        padding: 15px; margin: 10px 0; width: 100%; border-radius: 10px; outline: none; box-sizing: border-box;
    }

    .nav-tabs { display: flex; justify-content: center; gap: 10px; margin: 20px 0; }
    .tab-btn { background: #111; color: #666; border: 1px solid #222; padding: 12px 20px; border-radius: 10px; cursor: pointer; font-weight: bold; }
    .tab-btn.active { color: #00f2ff; border-color: #00f2ff; box-shadow: 0 0 10px #00f2ff; }

    .section { display: none; max-width: 500px; margin: auto; padding: 10px; }
    .section.active { display: block; }
    
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
    td, th { padding: 12px; border-bottom: 1px solid #222; text-align: left; }
    .key-data { color: #ffff00; font-weight: bold; text-shadow: 0 0 5px #ffff00; }
</style>
`;

// --- 4. ROUTES ---
app.get('/', (req, res) => {
    res.send(`<html><head>${styles}</head><body>
    <div style="height:100vh; display:flex; align-items:center; justify-content:center;">
        <div class="rainbow-border" style="width:350px;">
            <div class="inner-card">
                <h1 style="background:linear-gradient(to right, #00f2ff, #ff007f); -webkit-background-clip:text; -webkit-text-fill-color:transparent; font-size:28px;">WASIM CLOUD</h1>
                <p style="color:#444; font-size:10px; letter-spacing:1px;">PREMIUM SPECTRUM CONTROL</p>
                <button class="glow-btn" onclick="location.href='/dashboard'" style="margin-top:20px;">OPEN DASHBOARD</button>
            </div>
        </div>
    </div></body></html>`);
});

app.get('/dashboard', (req, res) => {
    res.send(`<html><head>${styles}</head><body>
    <div id="login-box" style="position:fixed; inset:0; background:black; z-index:9999; display:flex; align-items:center; justify-content:center;">
        <div class="rainbow-border" style="width:320px;">
            <div class="inner-card">
                <h2 style="color:#00f2ff;">AUTHORIZE</h2>
                <input type="text" id="u" placeholder="Admin ID">
                <input type="password" id="p" placeholder="Password">
                <button class="glow-btn" onclick="auth()">VERIFY</button>
            </div>
        </div>
    </div>

    <div id="main-ui" style="display:none;">
        <nav style="padding:20px; border-bottom:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-weight:900; color:#ff007f;">WASIM<span style="color:#00f2ff;">VIP</span></div>
            <button onclick="location.href='/'" style="background:red; border:none; color:white; padding:5px 10px; border-radius:8px; cursor:pointer;">LOGOUT</button>
        </nav>

        <div style="padding:20px; text-align:center;">
            <div class="rainbow-border" style="max-width:500px; margin:auto;">
                <div class="inner-card">
                    <p style="color:#555; margin:0; font-size:10px;">CREDITS STATUS</p>
                    <h2 style="color:#ffff00; margin:5px 0;">ACTIVE & UNLIMITED</h2>
                </div>
            </div>

            <div class="nav-tabs">
                <button class="tab-btn active" onclick="openTab(this, 'keys')">KEYS</button>
                <button class="tab-btn" onclick="openTab(this, 'reseller')">RESELLER</button>
                <button class="tab-btn" onclick="openTab(this, 'data')">DATABASE</button>
            </div>

            <div id="keys" class="section active"><div class="inner-card" style="border:1px solid #111;">
                <h3 style="color:#00f2ff;">GENERATE LICENSE</h3>
                <input type="text" id="kn" placeholder="Client Name">
                <select id="kt">
                    <option value="2">2 Hours Trial</option>
                    <option value="24">1 Day</option>
                    <option value="168">7 Days</option>
                    <option value="720">30 Days</option>
                    <option value="1440">60 Days</option>
                </select>
                <button class="glow-btn" onclick="gen()">CREATE KEY</button>
            </div></div>

            <div id="reseller" class="section"><div class="inner-card" style="border:1px solid #111;">
                <h3 style="color:#ff007f;">ADD NEW RESELLER</h3>
                <input type="text" id="ru" placeholder="Reseller Username">
                <input type="password" id="rp" placeholder="Reseller Password">
                <button class="glow-btn" onclick="addR()">ADD ADMIN</button>
            </div></div>

            <div id="data" class="section" style="max-width:700px;"><div class="inner-card" style="border:1px solid #111;">
                <h3 style="color:#00f2ff;">ACTIVE LOGS</h3>
                <div style="overflow-x:auto;"><table>
                    <thead><tr><th>Key</th><th>Plan</th><th>Action</th></tr></thead>
                    <tbody id="db-body"></tbody>
                </table></div>
            </div></div>
        </div>
    </div>

    <script>
        function auth() {
            if(document.getElementById('u').value === 'WASIMVIP' && document.getElementById('p').value === 'VIPWASIM') {
                document.getElementById('login-box').style.display = 'none';
                document.getElementById('main-ui').style.display = 'block';
            } else { alert("ACCESS DENIED"); }
        }

        function openTab(btn, id) {
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(id).classList.add('active');
            btn.classList.add('active');
            if(id === 'data') load();
        }

        async function gen() {
            const res = await fetch('/admin/add-key', {
                method:'POST', headers:{'Content-Type':'application/json'},
                body:JSON.stringify({key: document.getElementById('kn').value, hours: document.getElementById('kt').value})
            });
            if(res.ok) alert("KEY GENERATED & SAVED!");
        }

        async function addR() {
            const res = await fetch('/admin/add-rs', {
                method:'POST', headers:{'Content-Type':'application/json'},
                body:JSON.stringify({u: document.getElementById('ru').value, p: document.getElementById('rp').value})
            });
            if(res.ok) alert("RESELLER ADDED!");
        }

        async function load() {
            const res = await fetch('/admin/all-data');
            const data = await res.json();
            document.getElementById('db-body').innerHTML = data.map(k => \`
                <tr><td><span class="key-data">\${k.key}</span></td><td>\${k.duration}</td>
                <td><button onclick="del('\${k._id}')" style="color:red; background:none; border:none; cursor:pointer;">[DEL]</button></td></tr>
            \`).join('');
        }

        async function del(id) {
            if(confirm("Delete this?")) {
                await fetch('/admin/del-key/'+id, {method:'DELETE'});
                load();
            }
        }
    </script>
    </body></html>`);
});

// --- API ROUTES ---
app.get('/admin/all-data', async (req, res) => {
    const keys = await Key.find().sort({createdAt:-1});
    res.json(keys);
});

app.post('/admin/add-key', async (req, res) => {
    const { key, hours } = req.body;
    let exp = new Date(); exp.setHours(exp.getHours() + parseInt(hours));
    const newK = new Key({
        key: key || "WASIM-" + crypto.randomBytes(3).toString('hex').toUpperCase(),
        expiryDate: exp, duration: hours + "H"
    });
    await newK.save(); res.json({ success: true });
});

app.post('/admin/add-rs', async (req, res) => {
    await new Reseller({ username: req.body.u, password: req.body.p }).save();
    res.json({ success: true });
});

app.delete('/admin/del-key/:id', async (req, res) => {
    await Key.findByIdAndDelete(req.params.id); res.json({ success: true });
});

app.post('/login', async (req, res) => {
    const { key, hwid } = req.body;
    const found = await Key.findOne({ key: key });
    if (!found) return res.json({ status: false, msg: "INVALID KEY" });
    if (new Date() > found.expiryDate) return res.json({ status: false, msg: "EXPIRED" });
    if (found.hwid === "NOT_SET") { found.hwid = hwid; await found.save(); }
    else if (found.hwid !== hwid) { return res.json({ status: false, msg: "HWID_MISMATCH" }); }
    res.json({ status: true, msg: "SUCCESS", data: { mod: "WASIM VIP", expiry: found.expiryDate } });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 Rainbow Panel Ready"));
