const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// 1. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI).then(() => console.log("✅ Database Connected"));

// 2. DATA MODEL
const Key = mongoose.model('Key', {
    key: String,
    hwid: { type: String, default: "NOT_SET" },
    isBlocked: { type: Boolean, default: false },
    expiryDate: Date,
    duration: String,
    createdAt: { type: Date, default: Date.now }
});

// 3. LOGIN API (Specially for GameZone Loader)
app.post(['/connect*', '/conne*', '/api*'], async (req, res) => {
    try {
        const { key, hwid } = req.body;
        const foundKey = await Key.findOne({ key: key });

        // Error Responses
        if (!foundKey) return res.status(200).json({ status: false, message: "INVALID_KEY", expiry: "N/A" });
        if (foundKey.isBlocked) return res.status(200).json({ status: false, message: "USER_BANNED", expiry: "N/A" });
        if (new Date() > foundKey.expiryDate) return res.status(200).json({ status: false, message: "KEY_EXPIRED", expiry: "N/A" });

        // HWID SECURITY
        if (foundKey.hwid === "NOT_SET") {
            foundKey.hwid = hwid || "UNKNOWN";
            await foundKey.save();
        } else if (foundKey.hwid !== hwid) {
            return res.status(200).json({ status: false, message: "HWID_MISMATCH", expiry: "N/A" });
        }

        // SUCCESS - EXACT JSON STRUCTURE FOR YOUR LOADER
        const formattedExpiry = foundKey.expiryDate.toISOString().replace('T', ' ').split('.')[0];
        
        res.status(200).json({ 
            status: true, 
            message: "LOGIN_SUCCESS",
            expiry: formattedExpiry, // Loader isko dhoond raha hai
            data: {
                username: "WASIM_USER",
                expiry: formattedExpiry,
                status: "Premium"
            }
        });
    } catch (e) { res.status(200).json({ status: false, message: "SERVER_ERROR", expiry: "N/A" }); }
});

// 4. ADMIN PANEL UI
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>WASIM TERMINAL</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            :root { --red: #ff3131; --yellow: #ffde59; }
            body { background: #000; color: #fff; font-family: sans-serif; margin: 0; display: flex; }
            .sidebar { width: 240px; background: #000; height: 100vh; position: fixed; border-right: 2px solid var(--red); padding: 20px; }
            .main { margin-left: 270px; padding: 30px; width: 100%; }
            .card { background: #111; border-left: 5px solid var(--red); padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            input, select, button { background: #000; border: 1px solid #444; color: var(--yellow); padding: 12px; border-radius: 5px; margin: 5px; }
            button { background: var(--red); color: #fff; border: none; font-weight: bold; cursor: pointer; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; padding: 15px; border-bottom: 2px solid var(--red); color: var(--yellow); }
            td { padding: 15px; border-bottom: 1px solid #222; font-size: 0.8rem; }
            #auth { position: fixed; inset: 0; background: #000; z-index: 999; display: flex; align-items: center; justify-content: center; }
        </style>
    </head>
    <body>
        <div id="auth">
            <div class="card" style="text-align:center; width:300px; border-left: 5px solid var(--yellow);">
                <h2 style="color:var(--red)">WASIM LOGIN</h2>
                <input type="password" id="pw" placeholder="PASSWORD" style="width:80%">
                <button onclick="login()" style="width:85%; margin-top:15px;">ENTER</button>
            </div>
        </div>
        <div class="sidebar">
            <h2 style="color:var(--red)">WASIM VIP</h2>
            <p style="color:var(--yellow)">● STATUS: ONLINE</p>
        </div>
        <div class="main">
            <div class="card">
                <h2 style="color:var(--yellow)">GENERATE LICENSE</h2>
                <input type="text" id="k" placeholder="Key Name">
                <select id="d">
                    <option value="2">2 Hours</option>
                    <option value="24">1 Day</option>
                    <option value="168">7 Days</option>
                    <option value="720">30 Days</option>
                </select>
                <button onclick="gen()">CREATE</button>
            </div>
            <div class="card" style="padding:0">
                <table>
                    <thead><tr><th>Key</th><th>Plan</th><th>HWID</th><th>Action</th></tr></thead>
                    <tbody id="t"></tbody>
                </table>
            </div>
        </div>
        <script>
            function login() {
                if(document.getElementById('pw').value === 'wasim786') {
                    document.getElementById('auth').style.display='none';
                    load();
                } else { alert("WRONG PASSWORD"); }
            }
            async function load() {
                const r = await fetch('/admin/list');
                const data = await r.json();
                document.getElementById('t').innerHTML = data.map(k => \`
                    <tr>
                        <td style="color:var(--yellow)">\${k.key}</td>
                        <td>\${k.duration}</td>
                        <td style="color:#888">\${k.hwid}</td>
                        <td>
                            <button onclick="act('/admin/reset', '\${k._id}')" style="font-size:9px;">RESET</button>
                            <button onclick="del('\${k._id}')" style="background:none; color:red; border:1px solid red; font-size:9px;">DEL</button>
                        </td>
                    </tr>
                \`).join('');
            }
            async function gen() {
                await fetch('/admin/add', {
                    method:'POST', headers:{'Content-Type':'application/json'}, 
                    body:JSON.stringify({key: document.getElementById('k').value, hours: document.getElementById('d').value})
                });
                document.getElementById('k').value='';
                load();
            }
            async function act(u, id) { await fetch(u, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id}) }); load(); }
            async function del(id) { if(confirm("Delete Key?")) { await fetch('/admin/del/'+id, { method:'DELETE' }); load(); } }
        </script>
    </body>
    </html>
    `);
});

// Admin Helpers
app.get('/admin/list', async (req, res) => res.json(await Key.find().sort({createdAt: -1})));
app.post('/admin/add', async (req, res) => {
    const { key, hours } = req.body;
    let exp = new Date();
    exp.setHours(exp.getHours() + parseInt(hours));
    await new Key({ 
        key: key || "WASIM-" + Math.random().toString(36).substr(2, 8).toUpperCase(), 
        expiryDate: exp, 
        duration: hours >= 24 ? (hours/24) + " Day" : hours + " Hours" 
    }).save();
    res.json({ success: true });
});
app.post('/admin/reset', async (req, res) => { await Key.findByIdAndUpdate(req.body.id, { hwid: "NOT_SET" }); res.json({ success: true }); });
app.delete('/admin/del/:id', async (req, res) => { await Key.findByIdAndDelete(req.params.id); res.json({ success: true }); });

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 Wasim Server Online"));
