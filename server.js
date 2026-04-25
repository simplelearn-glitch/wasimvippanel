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
    isBlocked: { type: Boolean, default: false },
    expiryDate: Date,
    duration: String,
    createdAt: { type: Date, default: Date.now }
});

const Reseller = mongoose.model('Reseller', {
    username: { type: String, unique: true },
    password: { type: String }
});

// 3. CSS (BIGGER, BETTER & COLORFUL STATUS)
const styles = `
<style>
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;900&display=swap');
    :root { --bg: #050505; --online: #00ff00; --offline: #ff0000; }
    body { background: var(--bg); color: #fff; font-family: 'Orbitron', sans-serif; margin: 0; min-height: 100vh; display: flex; flex-direction: column; }

    .rainbow-border {
        position: relative; border-radius: 20px; background: #000; padding: 3px; margin: 10px;
        background-image: linear-gradient(var(--angle), #ff0000, #ff00ff, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000);
        animation: rotate 4s linear infinite;
    }
    @property --angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
    @keyframes rotate { from { --angle: 0deg; } to { --angle: 360deg; } }

    .inner-card { background: #0a0a0a; border-radius: 17px; padding: 30px; text-align: center; height: 100%; box-sizing: border-box; }
    
    .glow-btn {
        background: linear-gradient(45deg, #00f2ff, #ff007f); border: none; color: white;
        padding: 18px; border-radius: 12px; font-weight: 900; cursor: pointer; width: 100%;
        text-transform: uppercase; letter-spacing: 2px; box-shadow: 0 0 15px #00f2ff; transition: 0.3s; margin-top: 10px;
    }
    .glow-btn:hover { transform: scale(1.02); box-shadow: 0 0 25px #ff007f; }

    input, select {
        background: #000; border: 1px solid #333; color: #00f2ff;
        padding: 18px; margin: 15px 0; width: 100%; border-radius: 12px; outline: none; box-sizing: border-box; font-size: 16px;
    }

    .nav-tabs { display: flex; justify-content: center; gap: 15px; margin: 20px 0; padding: 0 10px; }
    .tab-btn { background: #111; color: #666; border: 1px solid #222; padding: 15px 25px; border-radius: 12px; cursor: pointer; font-weight: bold; flex: 1; max-width: 150px; transition: 0.3s; }
    .tab-btn.active { color: #00f2ff; border-color: #00f2ff; box-shadow: 0 0 10px #00f2ff; background: #000; }

    .section { display: none; width: 95%; max-width: 850px; margin: 20px auto; min-height: 500px; }
    .section.active { display: block; animation: fadeIn 0.5s ease; }
    
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    td, th { padding: 18px; border-bottom: 1px solid #222; text-align: left; }
    th { color: #555; text-transform: uppercase; font-size: 12px; }

    /* STATUS GLOW COLORS */
    .status-online { color: var(--online); font-weight: bold; text-shadow: 0 0 15px var(--online); font-size: 13px; letter-spacing: 1px; }
    .status-blocked { color: var(--offline); font-weight: bold; text-shadow: 0 0 15px var(--offline); font-size: 13px; letter-spacing: 1px; }
    
    .key-name { color: #ffff00; font-weight: bold; font-family: monospace; font-size: 16px; }
    .action-btn { background: none; border: 1px solid #444; color: #fff; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 10px; margin-right: 5px; }
</style>
`;

// --- 4. UI PAGES ---
app.get('/', (req, res) => {
    res.send(`<html><head>${styles}</head><body>
    <div style="flex:1; display:flex; align-items:center; justify-content:center;">
        <div class="rainbow-border" style="width:450px;">
            <div class="inner-card">
                <h1 style="background:linear-gradient(to right, #00f2ff, #ff007f); -webkit-background-clip:text; -webkit-text-fill-color:transparent; font-size:35px;">WASIM CLOUD</h1>
                <p style="color:#444; font-size:12px; letter-spacing:2px; margin-bottom:40px;">SUPREME MANAGEMENT SYSTEM</p>
                <button class="glow-btn" onclick="location.href='/dashboard'">LAUNCH DASHBOARD</button>
            </div>
        </div>
    </div></body></html>`);
});

app.get('/dashboard', (req, res) => {
    res.send(`<html><head>${styles}</head><body>
    <div id="login-box" style="position:fixed; inset:0; background:black; z-index:9999; display:flex; align-items:center; justify-content:center;">
        <div class="rainbow-border" style="width:400px;">
            <div class="inner-card">
                <h2 style="color:#00f2ff; margin-bottom:25px;">AUTHORIZE</h2>
                <input type="text" id="u" placeholder="Admin ID">
                <input type="password" id="p" placeholder="Password">
                <button class="glow-btn" onclick="auth()">VERIFY IDENTITY</button>
            </div>
        </div>
    </div>

    <div id="main-ui" style="display:none; flex:1; display:flex; flex-direction:column;">
        <nav style="padding:25px; border-bottom:1px solid #333; display:flex; justify-content:space-between; align-items:center; background:#000;">
            <div style="font-weight:900; color:#ff007f; font-size:24px;">WASIM<span style="color:#00f2ff;">PRO</span></div>
            <button onclick="location.href='/'" style="background:red; border:none; color:white; padding:12px 25px; border-radius:10px; cursor:pointer; font-weight:bold;">EXIT SYSTEM</button>
        </nav>

        <div class="nav-tabs">
            <button class="tab-btn active" onclick="openTab(this, 'keys')">KEYS</button>
            <button class="tab-btn" onclick="openTab(this, 'reseller')">RESELLER</button>
            <button class="tab-btn" onclick="openTab(this, 'data')">DATABASE</button>
        </div>

        <div id="keys" class="section active">
            <div class="rainbow-border"><div class="inner-card">
                <h3 style="color:#00f2ff;">GENERATE LICENSE</h3>
                <input type="text" id="kn" placeholder="Client Name">
                <select id="kt">
                    <option value="2">2 Hours Trial</option>
                    <option value="24">1 Day</option>
                    <option value="168">7 Days</option>
                    <option value="720">30 Days</option>
                    <option value="1440">60 Days</option>
                </select>
                <button class="glow-btn" onclick="gen()">SAVE TO CLOUD</button>
            </div></div>
        </div>

        <div id="reseller" class="section">
            <div class="rainbow-border"><div class="inner-card">
                <h3 style="color:#ff007f;">ADD RESELLER</h3>
                <input type="text" id="ru" placeholder="Reseller ID">
                <input type="password" id="rp" placeholder="Reseller Password">
                <button class="glow-btn" onclick="addR()">AUTHORIZE ADMIN</button>
            </div></div>
        </div>

        <div id="data" class="section">
            <div class="rainbow-border"><div class="inner-card" style="padding:10px;">
                <h3 style="color:#00f2ff;">ACTIVE LOGS</h3>
                <div style="overflow-x:auto;">
                    <table>
                        <thead><tr><th>Identifier</th><th>Status</th><th>Control</th></tr></thead>
                        <tbody id="db-body"></tbody>
                    </table>
                </div>
            </div></div>
        </div>
    </div>

    <script>
        function auth() {
            if(document.getElementById('u').value === 'WASIMVIP' && document.getElementById('p').value === 'VIPWASIM') {
                document.getElementById('login-box').style.display = 'none';
                document.getElementById('main-ui').style.display = 'flex';
                openTab(document.querySelector('.tab-btn'), 'keys');
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
            if(res.ok) alert("KEY GENERATED!");
        }

        async function load() {
            const res = await fetch('/admin/all-data');
            const data = await res.json();
            document.getElementById('db-body').innerHTML = data.map(k => {
                const sClass = k.isBlocked ? 'status-blocked' : 'status-online';
                const sText = k.isBlocked ? '● OFFLINE' : '● ONLINE';
                return \`
                    <tr>
                        <td><span class="key-name">\${k.key}</span></td>
                        <td><span class="\${sClass}">\${sText}</span></td>
                        <td>
                            <button class="action-btn" onclick="toggleBlock('\${k._id}', \${!k.isBlocked})">\${k.isBlocked ? 'UNBLOCK' : 'BLOCK'}</button>
                            <button class="action-btn" onclick="del('\${k._id}')" style="color:red; border-color:red;">DEL</button>
                        </td>
                    </tr>\`;
            }).join('');
        }

        async function toggleBlock(id, status) {
            await fetch('/admin/block-key', {
                method:'POST', headers:{'Content-Type':'application/json'},
                body:JSON.stringify({id, isBlocked: status})
            });
            load();
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
        key: key || "VIP-" + crypto.randomBytes(3).toString('hex').toUpperCase(),
        expiryDate: exp, duration: hours + "H", isBlocked: false
    });
    await newK.save(); res.json({ success: true });
});

app.post('/admin/block-key', async (req, res) => {
    const { id, isBlocked } = req.body;
    await Key.findByIdAndUpdate(id, { isBlocked });
    res.json({ success: true });
});

app.delete('/admin/del-key/:id', async (req, res) => {
    await Key.findByIdAndDelete(req.params.id); res.json({ success: true });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 Server Ready"));
