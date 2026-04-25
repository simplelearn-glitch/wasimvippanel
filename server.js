const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// 1. DATABASE
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Database Connected Successfully"))
    .catch((err) => console.log("❌ DB Connection Error: ", err));

// 2. SCHEMA
const Key = mongoose.model('Key', {
    key: String,
    hwid: { type: String, default: "NOT_SET" },
    isBlocked: { type: Boolean, default: false },
    expiryDate: Date,
    duration: String,
    createdAt: { type: Date, default: Date.now }
});

// 3. LOGIN API (The GameZone Fixer)
app.post(['/connect*', '/conne*', '/api*'], async (req, res) => {
    try {
        const { key, hwid } = req.body;
        console.log(`[*] Login Request -> Key: ${key}, HWID: ${hwid}`);

        const foundKey = await Key.findOne({ key: key });

        // Jab Key na mile
        if (!foundKey) {
            return res.status(200).json({ 
                status: false, 
                message: "INVALID_KEY", 
                expiry: "00-00-00 00:00:00" 
            });
        }

        // Check Block/Expiry
        if (foundKey.isBlocked) return res.status(200).json({ status: false, message: "USER_BANNED", expiry: "N/A" });
        if (new Date() > foundKey.expiryDate) return res.status(200).json({ status: false, message: "KEY_EXPIRED", expiry: "N/A" });

        // HWID FIX (Agar HWID undefined ho toh bypass na ho, par key set ho jaye)
        const deviceId = hwid || "UNKNOWN_DEVICE";
        if (foundKey.hwid === "NOT_SET") {
            foundKey.hwid = deviceId;
            await foundKey.save();
        } else if (foundKey.hwid !== deviceId) {
            return res.status(200).json({ status: false, message: "HWID_MISMATCH", expiry: "N/A" });
        }

        // SUCCESS RESPONSE
        const formattedExpiry = foundKey.expiryDate.toISOString().replace('T', ' ').split('.')[0];
        
        return res.status(200).json({ 
            status: true, 
            message: "LOGIN_SUCCESS",
            expiry: formattedExpiry,
            data: {
                username: "WASIM_PREMIUM",
                expiry: formattedExpiry,
                status: "Premium",
                mod: "WASIM VIP ENGINE"
            }
        });
    } catch (e) { 
        console.log("Error:", e);
        res.status(200).json({ status: false, message: "SERVER_ERROR", expiry: "N/A" }); 
    }
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
            body { background: #000; color: #fff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; display: flex; }
            .sidebar { width: 240px; background: #000; height: 100vh; position: fixed; border-right: 2px solid var(--red); padding: 20px; box-shadow: 2px 0 10px rgba(255,0,0,0.3); }
            .main { margin-left: 280px; padding: 30px; width: calc(100% - 280px); }
            .card { background: #111; border-left: 5px solid var(--red); padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
            input, select, button { background: #000; border: 1px solid #444; color: var(--yellow); padding: 12px; border-radius: 5px; margin: 5px; outline: none; }
            button { background: var(--red); color: #fff; border: none; font-weight: bold; cursor: pointer; transition: 0.3s; }
            button:hover { opacity: 0.8; transform: scale(1.05); }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { text-align: left; padding: 15px; border-bottom: 2px solid var(--red); color: var(--yellow); text-transform: uppercase; font-size: 12px; }
            td { padding: 15px; border-bottom: 1px solid #222; font-size: 0.85rem; color: #ccc; }
            #auth { position: fixed; inset: 0; background: #000; z-index: 999; display: flex; align-items: center; justify-content: center; }
        </style>
    </head>
    <body>
        <div id="auth">
            <div class="card" style="text-align:center; width:300px; border-left: 5px solid var(--yellow);">
                <h2 style="color:var(--red)">WASIM ACCESS</h2>
                <input type="password" id="pw" placeholder="ENTER MASTER PASSWORD" style="width:80%">
                <button onclick="login()" style="width:85%; margin-top:15px;">LOGIN</button>
            </div>
        </div>
        <div class="sidebar">
            <h1 style="color:var(--red); font-size: 24px; letter-spacing: 2px;">WASIM VIP</h1>
            <p style="color:var(--yellow); font-size: 12px;">● SERVER STATUS: ONLINE</p>
            <hr style="border: 0.5px solid #333; margin: 20px 0;">
        </div>
        <div class="main">
            <div class="card">
                <h2 style="color:var(--yellow)">KEY GENERATOR</h2>
                <input type="text" id="k" placeholder="Custom Key Name (Optional)">
                <select id="d">
                    <option value="2">2 Hours Trial</option>
                    <option value="24">1 Day Premium</option>
                    <option value="168">7 Days VIP</option>
                    <option value="720">30 Days Legend</option>
                </select>
                <button onclick="gen()">GENERATE KEY</button>
            </div>
            <div class="card" style="padding:0">
                <table>
                    <thead><tr><th>License Key</th><th>Plan</th><th>Device ID</th><th>Actions</th></tr></thead>
                    <tbody id="t"></tbody>
                </table>
            </div>
        </div>
        <script>
            function login() {
                if(document.getElementById('pw').value === 'wasim786') {
                    document.getElementById('auth').style.display='none';
                    load();
                } else { alert("ACCESS DENIED!"); }
            }
            async function load() {
                const r = await fetch('/admin/list');
                const data = await r.json();
                document.getElementById('t').innerHTML = data.map(k => \`
                    <tr>
                        <td style="color:var(--yellow); font-weight: bold;">\${k.key}</td>
                        <td>\${k.duration}</td>
                        <td style="color:#777; font-family: monospace;">\${k.hwid}</td>
                        <td>
                            <button onclick="act('/admin/reset', '\${k._id}')" style="font-size:10px; background: #555;">RESET</button>
                            <button onclick="del('\${k._id}')" style="background:transparent; color:red; border:1px solid red; font-size:10px;">DELETE</button>
                        </td>
                    </tr>
                \`).join('');
            }
            async function gen() {
                const keyName = document.getElementById('k').value;
                await fetch('/admin/add', {
                    method:'POST', headers:{'Content-Type':'application/json'}, 
                    body:JSON.stringify({key: keyName, hours: document.getElementById('d').value})
                });
                document.getElementById('k').value='';
                load();
            }
            async function act(u, id) { await fetch(u, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id}) }); load(); }
            async function del(id) { if(confirm("Are you sure?")) { await fetch('/admin/del/'+id, { method:'DELETE' }); load(); } }
        </script>
    </body>
    </html>
    `);
});

// Admin Control
app.get('/admin/list', async (req, res) => res.json(await Key.find().sort({createdAt: -1})));
app.post('/admin/add', async (req, res) => {
    const { key, hours } = req.body;
    let exp = new Date();
    exp.setHours(exp.getHours() + parseInt(hours));
    const finalKey = key || "WASIM-" + Math.random().toString(36).substr(2, 8).toUpperCase();
    await new Key({ 
        key: finalKey, 
        expiryDate: exp, 
        duration: hours >= 24 ? (hours/24) + " Day" : hours + " Hours" 
    }).save();
    res.json({ success: true });
});
app.post('/admin/reset', async (req, res) => { await Key.findByIdAndUpdate(req.body.id, { hwid: "NOT_SET" }); res.json({ success: true }); });
app.delete('/admin/del/:id', async (req, res) => { await Key.findByIdAndDelete(req.params.id); res.json({ success: true }); });

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 Server is running on port " + PORT));
