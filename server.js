const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// 1. DATABASE CONNECTION
// Ensure MONGO_URI is added in Render Dashboard -> Environment Variables
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ DB Connected Successfully"))
    .catch(err => {
        console.log("❌ DB Connection Error: ", err);
        process.exit(1); // Stop if DB fails
    });

// 2. DATA MODEL
const Key = mongoose.model('Key', {
    key: String,
    plan: { type: String, default: "VIP" },
    devices: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now }
});

// 3. HELPERS
function generateKey() {
    return "NASIV-" + Math.random().toString(36).substr(2, 8).toUpperCase();
}

function getRealTimeExp(createdAt) {
    const date = new Date(createdAt);
    date.setDate(date.getDate() + 30); 
    return date.toISOString().replace('T', ' ').split('.')[0];
}

// 4. LOADER API (Matches your screenshot)
app.post('/verify', async (req, res) => {
    try {
        const { key } = req.body;
        if (!key) return res.status(400).json({ status: false, message: "No key provided" });

        const foundKey = await Key.findOne({ key: key });
        if (!foundKey) {
            return res.status(400).json({ status: false, message: "INVALID KEY" });
        }

        res.status(200).json({
            status: true,
            data: {
                modname: "MOD NAME",
                mod_status: "MOD STATUS - SAFE",
                credit: "FLOATING TEXT",
                token: foundKey.key,
                device: foundKey.devices.toString(),
                EXP: getRealTimeExp(foundKey.createdAt),
                rng: Math.floor(1000000000 + Math.random() * 9000000000)
            }
        });
    } catch (err) {
        res.status(500).json({ status: false, message: "Server Error" });
    }
});

// 5. ADMIN PANEL LOGIN
app.post('/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === "wasim786") {
        const token = jwt.sign({ role: 'admin' }, "WASIM_SECRET");
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, message: "Wrong Password" });
    }
});

// 6. ADMIN ACTIONS
app.get('/admin/all-keys', async (req, res) => {
    const keys = await Key.find().sort({ createdAt: -1 });
    res.json(keys);
});

app.post('/generate', async (req, res) => {
    const newKey = new Key({
        key: generateKey(),
        plan: "VIP",
        devices: 1
    });
    await newKey.save();
    res.json(newKey);
});

app.delete('/admin/key/:id', async (req, res) => {
    await Key.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// 7. PANEL HTML
app.get('/panel', (req, res) => {
    res.send(`
    <html>
    <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
    <body style="background:#000; color:#0f0; font-family:monospace; text-align:center; padding:20px;">
        <div id="loginBox" style="border:1px solid #0f0; padding:20px; max-width:400px; margin:auto;">
            <h2>WASIM LOGIN</h2>
            <input type="password" id="pw" style="background:#000; color:#0f0; border:1px solid #0f0; padding:10px; width:80%;">
            <button onclick="doLogin()" style="background:#0f0; color:#000; border:none; padding:10px; margin-top:10px; cursor:pointer; width:80%;">LOGIN</button>
        </div>
        <div id="mainBox" style="display:none; border:1px solid #0f0; padding:20px; max-width:600px; margin:auto;">
            <h2>WASIM VIP PANEL</h2>
            <button onclick="makeKey()" style="padding:10px; cursor:pointer;">+ GENERATE KEY</button>
            <hr>
            <div id="list"></div>
        </div>
        <script>
            async function doLogin(){
                const p = document.getElementById('pw').value;
                const r = await fetch('/admin/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ password: p })
                });
                if(r.ok) {
                    document.getElementById('loginBox').style.display='none';
                    document.getElementById('mainBox').style.display='block';
                    load();
                } else { alert("Wrong Password!"); }
            }
            async function load(){
                const r = await fetch('/admin/all-keys');
                const keys = await r.json();
                document.getElementById('list').innerHTML = keys.map(k => \`
                    <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #222;">
                        <span>\${k.key}</span>
                        <button onclick="del('\${k._id}')" style="color:red; background:none; border:1px solid red; cursor:pointer;">X</button>
                    </div>
                \`).join('');
            }
            async function makeKey(){
                await fetch('/generate', { method:'POST' });
                load();
            }
            async function del(id){
                await fetch('/admin/key/'+id, {method:'DELETE'});
                load();
            }
        </script>
    </body>
    </html>`);
});

// 8. FINAL PORT LOGIC
const PORT = process.env.PORT || 10000;
app.get("/", (req, res) => { res.send("Wasim VIP Active 🚀"); });
app.listen(PORT, '0.0.0.0', () => console.log("🚀 SERVER RUNNING ON PORT " + PORT));
