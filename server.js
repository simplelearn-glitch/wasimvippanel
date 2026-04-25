const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// 1. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MONGO DB CONNECTED"))
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

const Admin = mongoose.model('Admin', {
    username: { type: String, unique: true },
    password: { type: String }
});

// 3. LOADER LOGIN API (Python Script Fix)
app.post('/login', async (req, res) => {
    try {
        const { key, hwid } = req.body;
        const foundKey = await Key.findOne({ key: key });

        if (!foundKey) return res.json({ status: false, message: "INVALID KEY" });
        if (new Date() > foundKey.expiryDate) return res.json({ status: false, message: "KEY EXPIRED" });

        if (foundKey.hwid === "NOT_SET") {
            foundKey.hwid = hwid;
            await foundKey.save();
        } else if (foundKey.hwid !== hwid) {
            return res.json({ status: false, message: "HWID MISMATCH" });
        }

        res.json({ 
            status: true, 
            message: "LOGIN SUCCESSFUL",
            data: {
                mod: "WASIM VIP MOD",
                status: "Premium",
                expiry: foundKey.expiryDate.toISOString().split('T')[0]
            }
        });
    } catch (e) { res.status(500).json({ status: false }); }
});

// 4. BEAUTIFUL DASHBOARD UI
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WASIM ULTIMATE PANEL</title>
        <style>
            :root { --pink: #ff007f; --cyan: #00f2ff; --bg: #050505; --card: #0f0f0f; }
            body { background: var(--bg); color: #fff; font-family: 'Segoe UI', sans-serif; margin: 0; text-align: center; }
            
            /* Navbar */
            nav { background: rgba(0,0,0,0.9); padding: 15px; border-bottom: 2px solid var(--pink); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; }
            .logo { font-size: 1.5rem; font-weight: 800; color: var(--cyan); text-shadow: 0 0 10px var(--cyan); }
            
            /* Credits Card */
            .credits-box { background: linear-gradient(145deg, #111, #000); margin: 20px; padding: 30px; border-radius: 20px; border: 1px solid #222; border-bottom: 4px solid var(--pink); box-shadow: 0 10px 20px rgba(0,0,0,0.5); }
            
            /* Tabs System */
            .tab-container { display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; }
            .tab-btn { background: #1a1a1a; color: #777; border: none; padding: 12px 20px; border-radius: 12px; cursor: pointer; font-weight: bold; transition: 0.3s; }
            .tab-btn.active { background: linear-gradient(45deg, var(--cyan), var(--pink)); color: #fff; box-shadow: 0 0 15px var(--pink); }

            /* Panel Sections */
            .panel-section { display: none; max-width: 500px; margin: auto; padding: 20px; animation: fadeIn 0.5s ease; }
            .panel-section.active { display: block; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

            .card { background: var(--card); padding: 25px; border-radius: 20px; border: 1px solid #222; }
            input, select { background: #000; border: 1px solid #333; color: var(--cyan); padding: 15px; margin: 10px 0; width: 100%; border-radius: 12px; outline: none; box-sizing: border-box; }
            .main-btn { background: linear-gradient(45deg, var(--cyan), var(--pink)); color: #fff; border: none; padding: 15px; font-weight: bold; border-radius: 12px; cursor: pointer; width: 100%; margin-top: 10px; }

            /* Table Styles */
            .table-card { background: var(--card); margin: 20px auto; max-width: 800px; padding: 20px; border-radius: 20px; border: 1px solid #222; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { text-align: left; color: #555; padding: 12px; border-bottom: 1px solid #222; font-size: 12px; }
            td { padding: 15px 12px; border-bottom: 1px solid #111; font-size: 14px; }
            .key-txt { color: #ffde59; font-weight: bold; font-family: monospace; }
        </style>
    </head>
    <body>
        <nav>
            <div class="logo">WASIM<span style="color:#fff">VIP</span></div>
            <div style="font-size: 10px; color: var(--pink);">OWNER PANEL v5.0</div>
        </nav>

        <div class="credits-box">
            <p style="color:#666; margin:0; font-size:12px; letter-spacing:2px;">AVAILABLE CREDITS</p>
            <h1 style="color:#ffde59; font-size:50px; margin:10px 0;">∞ 999,999,999</h1>
        </div>

        <div class="tab-container">
            <button class="tab-btn active" onclick="openTab('keys')">KEYS</button>
            <button class="tab-btn" onclick="openTab('reseller')">RESELLER</button>
            <button class="tab-btn" onclick="openTab('list')">VIEW DATA</button>
        </div>

        <div id="keys" class="panel-section active">
            <div class="card">
                <h3 style="color:var(--cyan); margin-top:0;">LICENSE GENERATOR</h3>
                <input type="text" id="kName" placeholder="License Name">
                <select id="kTime">
                    <option value="2">2 Hours</option>
                    <option value="24">1 Day</option>
                    <option value="168">7 Days</option>
                    <option value="720">30 Days</option>
                    <option value="1440">60 Days</option>
                </select>
                <button class="main-btn" onclick="genKey()">GENERATE KEY</button>
            </div>
        </div>

        <div id="reseller" class="panel-section">
            <div class="card">
                <h3 style="color:var(--pink); margin-top:0;">ADD NEW ADMIN</h3>
                <input type="text" id="adm-u" placeholder="Admin Username">
                <input type="text" id="adm-p" placeholder="Admin Password">
                <button class="main-btn" onclick="addAdmin()">CREATE ADMIN</button>
            </div>
        </div>

        <div id="list" class="panel-section">
            <div class="table-card">
                <h4 style="color:var(--cyan); margin:0;">ACTIVE RECORDS</h4>
                <div style="overflow-x:auto;">
                    <table>
                        <thead><tr><th>Key</th><th>Time</th><th>Action</th></tr></thead>
                        <tbody id="data-body"></tbody>
                    </table>
                </div>
            </div>
        </div>

        <script>
            function openTab(tabId) {
                document.querySelectorAll('.panel-section').forEach(s => s.classList.remove('active'));
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.getElementById(tabId).classList.add('active');
                event.currentTarget.classList.add('active');
                if(tabId === 'list') fetchData();
            }

            async function fetchData() {
                const res = await fetch('/admin/all-data');
                const data = await res.json();
                document.getElementById('data-body').innerHTML = data.map(k => \`
                    <tr>
                        <td class="key-txt">\${k.key}</td>
                        <td>\${k.duration}</td>
                        <td><button onclick="delKey('\${k._id}')" style="color:red; background:none; border:none; cursor:pointer;">[DEL]</button></td>
                    </tr>
                \`).join('');
            }

            async function genKey() {
                await fetch('/admin/add-key', {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({key: document.getElementById('kName').value, hours: document.getElementById('kTime').value})
                });
                alert("Key Generated Successfully!");
            }

            async function addAdmin() {
                await fetch('/admin/add-adm', {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({u: document.getElementById('adm-u').value, p: document.getElementById('adm-p').value})
                });
                alert("Admin Created!");
            }

            async function delKey(id) {
                if(confirm("Delete Record?")) {
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
    const keys = await Key.find().sort({createdAt:-1});
    res.json(keys);
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
app.listen(PORT, '0.0.0.0', () => console.log("🚀 Wasim Ultimate Live"));
