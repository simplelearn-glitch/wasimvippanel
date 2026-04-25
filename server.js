const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// 1. DATABASE
mongoose.connect(process.env.MONGO_URI).then(() => console.log("✅ Pink System Online"));

// 2. MODELS
const Key = mongoose.model('Key', {
    key: String,
    hwid: { type: String, default: "NOT_SET" },
    isBlocked: { type: Boolean, default: false },
    expiryDate: Date,
    duration: String,
    createdBy: String,
    createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', {
    username: { type: String, unique: true },
    password: { type: String }
});

// 3. UI WITH PINK THEME & DASHBOARD MENU
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>WASIM PINK TERMINAL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            :root { --pink: #ff2d75; --dark-bg: #050505; --card-bg: #0f0f0f; --yellow: #ffde59; }
            body { background: var(--dark-bg); color: #fff; font-family: 'Segoe UI', sans-serif; margin:0; overflow-x: hidden; }
            
            /* Login Box */
            .login-box { position:fixed; inset:0; background:var(--dark-bg); z-index:2000; display:flex; align-items:center; justify-content:center; }
            .login-card { background:var(--card-bg); padding:30px; border-top: 4px solid var(--pink); border-radius:10px; width:300px; text-align:center; box-shadow: 0 0 20px rgba(255,45,117,0.2); }
            
            /* Navbar */
            nav { background:rgba(0,0,0,0.8); padding:15px 20px; border-bottom:1px solid #222; display:flex; justify-content:space-between; align-items:center; position: sticky; top:0; z-index:100; backdrop-filter: blur(10px); }
            .logo { font-weight:bold; font-size:1.2rem; color: var(--pink); text-shadow: 0 0 10px var(--pink); }
            .dash-btn { background: var(--pink); color: white; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-size: 14px; font-weight: bold; border:none; }

            /* Dashboard Sidebar/Overlay */
            #dash-menu { position: fixed; right: -100%; top: 0; width: 300px; height: 100vh; background: var(--card-bg); z-index: 150; transition: 0.4s; padding: 25px; box-sizing: border-box; border-left: 2px solid var(--pink); }
            #dash-menu.active { right: 0; }
            .close-btn { color: var(--pink); float: right; font-size: 24px; cursor: pointer; }

            /* Components */
            .container { padding:20px; max-width: 800px; margin: auto; }
            .card { background:var(--card-bg); padding:20px; border-radius:12px; margin-bottom:20px; border: 1px solid #1a1a1a; }
            .stat-box { background: #111; padding: 15px; border-radius: 10px; border: 1px solid #222; text-align: center; margin-bottom: 20px; }
            
            input, select { background:#000; border:1px solid #333; color:var(--pink); padding:12px; margin:10px 0; width:100%; box-sizing:border-box; border-radius: 8px; outline: none; }
            button { background:var(--pink); color:#fff; border:none; padding:12px; font-weight:bold; cursor:pointer; width:100%; border-radius:8px; margin-top:10px; transition: 0.3s; }
            button:hover { opacity: 0.8; box-shadow: 0 0 15px var(--pink); }
            
            table { width:100%; border-collapse:collapse; margin-top:10px; }
            th { text-align:left; color:#555; font-size: 12px; padding:10px; border-bottom: 1px solid #222; }
            td { padding:12px; border-bottom: 1px solid #111; font-size: 13px; }
            .badge-pink { color: var(--pink); font-family: monospace; }
        </style>
    </head>
    <body>

        <div id="login-screen" class="login-box">
            <div class="login-card">
                <h2 style="color:var(--pink)">WASIM LOGIN</h2>
                <input type="password" id="p" placeholder="ENTER MASTER PASSWORD">
                <button onclick="auth()">ACCESS TERMINAL</button>
            </div>
        </div>

        <nav>
            <div class="logo">WASIM<span style="color:#fff">VIP</span></div>
            <button class="dash-btn" onclick="toggleMenu()">DASHBOARD ☰</button>
        </nav>

        <div id="dash-menu">
            <span class="close-btn" onclick="toggleMenu()">×</span>
            <h3 style="color:var(--pink); margin-top:40px;">CONTROL PANEL</h3>
            
            <div style="margin-top:20px;">
                <p style="color:#666; font-size:12px;">ADMIN MANAGEMENT</p>
                <input type="text" id="adm-u" placeholder="Admin Username">
                <input type="text" id="adm-p" placeholder="Admin Password">
                <button onclick="addAdmin()" style="background:#fff; color:#000;">ADD RESELLER</button>
            </div>

            <div style="margin-top:30px;">
                <p style="color:#666; font-size:12px;">LICENSE GENERATOR</p>
                <input type="text" id="key-name" placeholder="User Name (Optional)">
                <select id="key-time">
                    <option value="2">2 Hours</option>
                    <option value="24">1 Day</option>
                    <option value="168">7 Days</option>
                    <option value="720">30 Days</option>
                </select>
                <button onclick="genKey()">CREATE KEY</button>
            </div>
        </div>

        <div class="container">
            <div class="stat-box">
                <div style="color:#666; font-size:12px;">AVAILABLE BALANCE</div>
                <div style="color:var(--yellow); font-size:24px; font-weight:bold;">∞ 999,999,999</div>
            </div>

            <div class="card">
                <h4 style="margin:0 0 15px 0; color:var(--pink)">ACTIVE LICENSES</h4>
                <div style="overflow-x:auto;">
                    <table>
                        <thead><tr><th>KEY NAME</th><th>DURATION</th><th>ACTION</th></tr></thead>
                        <tbody id="table-body"></tbody>
                    </table>
                </div>
            </div>
        </div>

        <script>
            function toggleMenu() { document.getElementById('dash-menu').classList.toggle('active'); }

            function auth() {
                if(document.getElementById('p').value === 'wasim786') {
                    document.getElementById('login-screen').style.display='none';
                    loadData();
                } else { alert("WRONG PASSWORD!"); }
            }

            async function loadData() {
                const res = await fetch('/admin/all-data');
                const data = await res.json();
                let html = "";
                data.keys.forEach(k => {
                    html += \`<tr><td class="badge-pink">\${k.key}</td><td>\${k.duration}</td>
                    <td><button onclick="del('/admin/del-key/\${k._id}')" style="background:none; border:1px solid #333; color:red; width:auto; padding:5px 10px; margin:0;">DEL</button></td></tr>\`;
                });
                document.getElementById('table-body').innerHTML = html;
            }

            async function genKey() {
                const res = await fetch('/admin/add-key', {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({key: document.getElementById('key-name').value, hours: document.getElementById('key-time').value})
                });
                const data = await res.json();
                alert("Key Generated!");
                toggleMenu();
                loadData();
            }

            async function addAdmin() {
                await fetch('/admin/add-adm', {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({u: document.getElementById('adm-u').value, p: document.getElementById('adm-p').value})
                });
                alert("Reseller Added!");
                toggleMenu();
            }

            async function del(url) { if(confirm("Confirm Delete?")) { await fetch(url, {method:'DELETE'}); loadData(); } }
        </script>
    </body>
    </html>
    `);
});

// 4. BACKEND ROUTES
app.get('/admin/all-data', async (req, res) => {
    const keys = await Key.find().sort({createdAt:-1});
    const admins = await Admin.find();
    res.json({ keys, admins });
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
    res.json({ success: true, key: newK.key });
});

app.post('/admin/add-adm', async (req, res) => {
    await new Admin({ username: req.body.u, password: req.body.p }).save();
    res.json({ success: true });
});

app.delete('/admin/del-key/:id', async (req, res) => { await Key.findByIdAndDelete(req.params.id); res.json({ success: true }); });

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 Pink Dashboard Ready"));
