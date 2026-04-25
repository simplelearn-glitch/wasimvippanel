const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MONGODB CONNECTION
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ DB Connected Successfully"))
    .catch(err => console.log("❌ DB Error: ", err));

// ✅ MODELS
const Key = mongoose.model('Key', {
    key: String,
    plan: String,
    devices: Number,
    createdAt: { type: Date, default: Date.now }
});

// ✅ HELPER FUNCTIONS
function generateKey() {
    return "NASIV-" + Math.random().toString(36).substr(2, 8).toUpperCase();
}

function getRealTimeExp(createdAt) {
    const date = new Date(createdAt);
    date.setDate(date.getDate() + 30); 
    return date.toISOString().replace('T', ' ').split('.')[0];
}

// ✅ LOADER VERIFICATION ROUTE
app.post('/verify', async (req, res) => {
    try {
        const { key } = req.body;
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

// ✅ ADMIN PANEL LOGIN (Password: wasim786)
app.post('/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === "wasim786") {
        const token = jwt.sign({ role: 'admin' }, "WASIM_SECRET", { expiresIn: '1h' });
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, message: "Wrong Password" });
    }
});

// ✅ KEY MANAGEMENT
app.get('/admin/all-keys', async (req, res) => {
    const keys = await Key.find().sort({ createdAt: -1 });
    res.json(keys);
});

app.post('/generate', async (req, res) => {
    const newKey = new Key({
        key: generateKey(),
        plan: req.body.plan || "VIP",
        devices: req.body.devices || 1
    });
    await newKey.save();
    res.json(newKey);
});

app.delete('/admin/key/:id', async (req, res) => {
    await Key.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// ✅ PANEL UI
app.get('/panel', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Wasim VIP Panel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { background: #000; color: #0f0; font-family: monospace; padding: 20px; text-align: center; }
            .container { max-width: 500px; margin: auto; border: 1px solid #0f0; padding: 20px; }
            input, button { background: #000; color: #0f0; border: 1px solid #0f0; padding: 10px; margin: 10px; width: 90%; }
            .key-item { border-bottom: 1px solid #222; padding: 10px; display: flex; justify-content: space-between; }
        </style>
    </head>
    <body>
        <div id="loginBox" class="container">
            <h2>WASIM LOGIN</h2>
            <input type="password" id="pw" placeholder="Enter Password">
            <button onclick="doLogin()">ENTER</button>
        </div>
        <div id="mainBox" class="container" style="display:none;">
            <h2>VIP CONTROL</h2>
            <button onclick="makeKey()">+ GENERATE KEY</button>
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
                const d = await r.json();
                if(d.success) {
                    document.getElementById('loginBox').style.display='none';
                    document.getElementById('mainBox').style.display='block';
                    load();
                } else { alert("Wrong!"); }
            }
            async function load(){
                const r = await fetch('/admin/all-keys');
                const keys = await r.json();
                document.getElementById('list').innerHTML = keys.map(k => \`
                    <div class="key-item">
                        <span>\${k.key}</span>
                        <button style="width:auto; color:red; border-color:red;" onclick="del('\${k._id}')">X</button>
                    </div>
                \`).join('');
            }
            async function makeKey(){
                await fetch('/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({plan:'VIP', devices:1}) });
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

// ✅ FINAL PORT SETUP FOR RENDER
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(\`🚀 SERVER RUNNING ON PORT \${PORT}\`));
