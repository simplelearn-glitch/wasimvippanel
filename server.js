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
    expiryDate: Date,
    duration: String,
    createdAt: { type: Date, default: Date.now }
});

// 3. LOADER LOGIN API
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
            data: { mod: "WASIM VIP MOD", status: "Premium", expiry: foundKey.expiryDate.toISOString().split('T')[0] }
        });
    } catch (e) { res.status(500).json({ status: false }); }
});

// 4. UNIQUE FROST-NEON DASHBOARD UI
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WASIM FROST PANEL</title>
        <style>
            :root { 
                --primary: #6e00ff; 
                --secondary: #00e5ff; 
                --accent: #ff007f;
                --bg: #0a0e1a; /* Unique Deep Navy (No Black) */
                --card: #161b33; 
                --glass: rgba(255, 255, 255, 0.05);
            }
            body { 
                background: var(--bg); 
                color: #e0e0e0; 
                font-family: 'Poppins', sans-serif; 
                margin: 0; 
                background: linear-gradient(135deg, #0a0e1a 0%, #161b33 100%);
                min-height: 100vh;
            }
            
            /* Admin Login Overlay */
            #admin-login { position: fixed; inset: 0; background: var(--bg); z-index: 2000; display: flex; align-items: center; justify-content: center; }
            .login-box { background: var(--card); padding: 40px; border-radius: 30px; border: 2px solid var(--primary); width: 320px; text-align: center; box-shadow: 0 0 50px rgba(110, 0, 255, 0.3); }
            
            /* Navbar */
            nav { background: rgba(22, 27, 51, 0.8); backdrop-filter: blur(10px); padding: 20px; border-bottom: 2px solid var(--secondary); display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 1.6rem; font-weight: 800; color: #fff; letter-spacing: 2px; }
            .logo span { color: var(--secondary); }
            
            .main-content { display: none; padding-bottom: 50px; }
            
            /* Credits Section */
            .credits-box { background: var(--glass); margin: 25px; padding: 40px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.1); text-align: center; box-shadow: 0 15px 35px rgba(0,0,0,0.2); }
            .credits-box h1 { font-size: 55px; margin: 0; background: linear-gradient(to right, #00e5ff, #6e00ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

            /* Tabs Management */
            .tab-btn { background: var(--glass); color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 15px 25px; border-radius: 15px; cursor: pointer; margin: 5px; font-weight: bold; transition: 0.3s; }
            .tab-btn.active { background: var(--primary); border-color: var(--primary); box-shadow: 0 0 20px var(--primary); }

            .section { display: none; max-width: 500px; margin: 30px auto; padding: 30px; background: var(--card); border-radius: 30px; border: 1px solid rgba(255,255,255,0.05); }
            .section.active { display: block; }

            input, select { background: rgba(0,0,0,0.2); border: 2px solid #2a2f4a; color: var(--secondary); padding: 15px; margin: 12px 0; width: 100%; border-radius: 15px; outline: none; font-weight: 600; transition: 0.3s; }
            input:focus { border-color: var(--secondary); }
            .btn { background: linear-gradient(45deg, var(--primary), var(--accent)); color: #fff; border: none; padding: 18px; font-weight: bold; border-radius: 15px; cursor: pointer; width: 100%; box-shadow: 0 5px 15px rgba(255,0,127,0.3); }

            /* Table Styles */
            table { width: 100%; border-collapse: collapse; }
            td, th { padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: left; }
            th { color: var(--secondary); text-transform: uppercase; font-size: 11px; }
            .key-txt { color: #fff; font-weight: bold; font-family: 'Courier New', monospace; background: rgba(255,255,255,0.05); padding: 5px 10px; border-radius: 8px; }
            .del-btn { color: #ff4d4d; border: 1px solid #ff4d4d; background: none; padding: 5px 10px; border-radius: 8px; cursor: pointer; font-weight: bold; }
        </style>
    </head>
    <body>

        <div id="admin-login">
            <div class="login-box">
                <h2 style="color:var(--secondary); margin-top:0;">FROST ACCESS</h2>
                <input type="text" id="adm-user" placeholder="Enter Admin ID">
                <input type="password" id="adm-pass" placeholder="Enter Password">
                <button class="btn" onclick="verifyAdmin()">AUTHORIZE</button>
            </div>
        </div>

        <div class="main-content" id="panel-ui">
            <nav>
                <div class="logo">WASIM<span>FROST</span></div>
                <button onclick="location.reload()" style="background:var(--accent); color:white; border:none; padding:8px 15px; border-radius:12px; font-weight:bold;">LOGOUT</button>
            </nav>

            <div class="credits-box">
                <p style="color:var(--secondary); margin:0; font-size:12px; letter-spacing:3px;">SYSTEM LOADED</p>
                <h1>∞ 999,999,999</h1>
                <p style="color:#888; font-size:11px;">MODERATOR: WASIMVIP</p>
            </div>

            <div style="text-align:center;">
                <button class="tab-btn active" id="t1" onclick="tab('keys')">CREATE KEY</button>
                <button class="tab-btn" id="t2" onclick="tab('list')">DATABASE</button>
            </div>

            <div id="keys" class="section active">
                <input type="text" id="kName" placeholder="Client Name (Optional)">
                <select id="kTime">
                    <option value="2">2 Hours Trial</option>
                    <option value="24">1 Day Premium</option>
                    <option value="168">7 Days Deluxe</option>
                    <option value="720">30 Days Ultra</option>
                    <option value="725">30 Days + 5H Bonus</option>
                    <option value="1440">60 Days Legend</option>
                </select>
                <button class="btn" onclick="genKey()">GENERATE LICENSE</button>
            </div>

            <div id="list" class="section" style="max-width:800px;">
                <div style="overflow-x:auto;">
                    <table>
                        <thead><tr><th>Key Identifier</th><th>Duration</th><th>Manage</th></tr></thead>
                        <tbody id="data-list"></tbody>
                    </table>
                </div>
            </div>
        </div>

        <script>
            function verifyAdmin() {
                const u = document.getElementById('adm-user').value;
                const p = document.getElementById('adm-pass').value;
                if(u === 'WASIMVIP' && p === 'VIPWASIM') {
                    document.getElementById('admin-login').style.display = 'none';
                    document.getElementById('panel-ui').style.display = 'block';
                } else { alert("ACCESS DENIED"); }
            }

            function tab(id) {
                document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.getElementById(id).classList.add('active');
                event.currentTarget.classList.add('active');
                if(id === 'list') loadKeys();
            }

            async function genKey() {
                await fetch('/admin/add-key', {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({key: document.getElementById('kName').value, hours: document.getElementById('kTime').value})
                });
                alert("SUCCESS: KEY ADDED TO MONGODB");
            }

            async function loadKeys() {
                const res = await fetch('/admin/all-data');
                const data = await res.json();
                document.getElementById('data-list').innerHTML = data.map(k => \`
                    <tr>
                        <td><span class="key-txt">\${k.key}</span></td>
                        <td>\${k.duration}</td>
                        <td><button class="del-btn" onclick="delKey('\${k._id}')">REMOVE</button></td>
                    </tr>
                \`).join('');
            }

            async function delKey(id) {
                if(confirm("Permanently delete this key?")) {
                    await fetch('/admin/del-key/'+id, {method:'DELETE'});
                    loadKeys();
                }
            }
        </script>
    </body>
    </html>
    `);
});

// 5. BACKEND LOGIC
app.get('/admin/all-data', async (req, res) => {
    const keys = await Key.find().sort({createdAt:-1});
    res.json(keys);
});

app.post('/admin/add-key', async (req, res) => {
    const { key, hours } = req.body;
    let exp = new Date();
    exp.setHours(exp.getHours() + parseInt(hours));
    const newK = new Key({
        key: key || "FROST-" + crypto.randomBytes(3).toString('hex').toUpperCase(),
        expiryDate: exp,
        duration: hours + "H"
    });
    await newK.save();
    res.json({ success: true });
});

app.delete('/admin/del-key/:id', async (req, res) => {
    await Key.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 Frost System Online"));

