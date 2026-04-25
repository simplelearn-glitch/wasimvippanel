const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// 1. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI).then(() => console.log("✅ DB Connected"));

// 2. MODEL (Added Expiry Date)
const Key = mongoose.model('Key', {
    key: String,
    hwid: { type: String, default: "NOT_SET" },
    isBlocked: { type: Boolean, default: false },
    expiryDate: Date,
    duration: String,
    createdAt: { type: Date, default: Date.now }
});

// 3. API FOR LOADER
app.post('/connect', async (req, res) => {
    try {
        const { key, hwid } = req.body;
        const foundKey = await Key.findOne({ key: key });

        if (!foundKey) return res.status(404).json({ status: false, message: "INVALID_KEY" });
        if (foundKey.isBlocked) return res.status(403).json({ status: false, message: "BANNED" });
        
        // Check if expired
        if (new Date() > foundKey.expiryDate) {
            return res.status(403).json({ status: false, message: "KEY_EXPIRED" });
        }

        // HWID Logic
        if (foundKey.hwid === "NOT_SET") {
            foundKey.hwid = hwid;
            await foundKey.save();
        } else if (foundKey.hwid !== hwid) {
            return res.status(401).json({ status: false, message: "HWID_MISMATCH" });
        }

        res.status(200).json({
            status: true,
            data: {
                mod: "WASIM VIP",
                status: "SAFE",
                expiry: foundKey.expiryDate.toISOString().replace('T', ' ').split('.')[0]
            }
        });
    } catch (e) { res.status(500).json({ status: false }); }
});

// 4. ADMIN ROUTES
app.get('/admin/list', async (req, res) => res.json(await Key.find().sort({createdAt: -1})));

app.post('/admin/add', async (req, res) => {
    const { key, hours } = req.body;
    const finalKey = key || "WASIM-" + Math.random().toString(36).substr(2, 8).toUpperCase();
    
    // Calculate Expiry
    let exp = new Date();
    exp.setHours(exp.getHours() + parseInt(hours));

    await new Key({ 
        key: finalKey, 
        expiryDate: exp, 
        duration: hours >= 24 ? (hours/24) + " Day(s)" : hours + " Hour(s)" 
    }).save();
    res.json({ success: true });
});

app.post('/admin/reset', async (req, res) => {
    await Key.findByIdAndUpdate(req.body.id, { hwid: "NOT_SET" });
    res.json({ success: true });
});

app.delete('/admin/del/:id', async (req, res) => {
    await Key.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// 5. RED/YELLOW/BLACK PROFESSIONAL UI
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>WASIM VIP TERMINAL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            :root { --red: #ff3c3c; --yellow: #ffcc00; --bg: #0a0a0a; --card: #151515; }
            body { background: var(--bg); color: #fff; font-family: 'Segoe UI', sans-serif; margin: 0; display: flex; }
            .sidebar { width: 260px; background: #000; height: 100vh; position: fixed; border-right: 2px solid var(--red); padding: 20px; }
            .main { margin-left: 300px; padding: 40px; width: 100%; }
            .card { background: var(--card); border-left: 4px solid var(--yellow); padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            h2, h3 { color: var(--red); text-transform: uppercase; letter-spacing: 2px; }
            input, select { background: #000; border: 1px solid #333; color: var(--yellow); padding: 12px; border-radius: 5px; margin: 5px; }
            button { background: var(--red); color: #fff; border: none; padding: 12px 25px; font-weight: bold; cursor: pointer; border-radius: 5px; transition: 0.3s; }
            button:hover { background: var(--yellow); color: #000; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; background: #111; }
            th { text-align: left; padding: 15px; border-bottom: 2px solid var(--red); color: var(--yellow); font-size: 0.8rem; }
            td { padding: 15px; border-bottom: 1px solid #222; font-size: 0.9rem; }
            .btn-act { padding: 5px 10px; font-size: 10px; background: transparent; border: 1px solid #444; color: #aaa; cursor: pointer; margin-right: 5px; }
            #login { position: fixed; inset: 0; background: #000; z-index: 999; display: flex; align-items: center; justify-content: center; border: 5px solid var(--red); }
        </style>
    </head>
    <body>
        <div id="login">
            <div class="card" style="text-align:center; width:350px;">
                <h2>ADMIN ACCESS</h2>
                <input type="password" id="ps" placeholder="SYSTEM PASSWORD" style="width:80%">
                <button onclick="auth()" style="width:85%; margin-top:15px;">INITIALIZE</button>
            </div>
        </div>

        <div class="sidebar">
            <h2 style="color:var(--yellow)">WASIM MODS</h2>
            <p style="color:var(--red)">● SERVER ONLINE</p>
            <hr style="border-color:#222">
            <p>DASHBOARD</p>
            <p>USER LOGS</p>
            <p>SECURITY</p>
        </div>

        <div class="main">
            <div class="card">
                <h3>Key Provisioning</h3>
                <input type="text" id="mk" placeholder="Manual Key (Optional)">
                <select id="dur">
                    <option value="2">2 Hours</option>
                    <option value="5">5 Hours</option>
                    <option value="6">6 Hours</option>
                    <option value="24">1 Day</option>
                    <option value="168">7 Days</option>
                    <option value="720">30 Days</option>
                    <option value="1440">60 Days</option>
                </select>
                <button onclick="gen()">CREATE LICENSE</button>
            </div>

            <div class="card" style="padding:0">
                <table>
                    <thead><tr><th>Key</th><th>Duration</th><th>HWID</th><th>Control</th></tr></thead>
                    <tbody id="tbl"></tbody>
                </table>
            </div>
        </div>

        <script>
            function auth() {
                if(document.getElementById('ps').value === 'wasim786') {
                    document.getElementById('login').style.display='none';
                    load();
                } else { alert("ACCESS DENIED"); }
            }

            async function load() {
                const r = await fetch('/admin/list');
                const data = await r.json();
                document.getElementById('tbl').innerHTML = data.map(k => \`
                    <tr>
                        <td style="color:var(--yellow); font-family:monospace">\${k.key}</td>
                        <td>\${k.duration}</td>
                        <td style="color:#666">\${k.hwid}</td>
                        <td>
                            <button class="btn-act" onclick="act('/admin/reset', '\${k._id}')">RESET</button>
                            <button class="btn-act" style="color:red" onclick="del('\${k._id}')">DEL</button>
                        </td>
                    </tr>
                \`).join('');
            }

            async function gen() {
                const m = document.getElementById('mk').value;
                const h = document.getElementById('dur').value;
                await fetch('/admin/add', {
                    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({key:m, hours:h})
                });
                document.getElementById('mk').value='';
                load();
            }

            async function act(url, id) {
                await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id}) });
                load();
            }

            async function del(id) {
                if(confirm("Delete Key?")) {
                    await fetch('/admin/del/'+id, { method:'DELETE' });
                    load();
                }
            }
        </script>
    </body>
    </html>
    `);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 Server Live"));

