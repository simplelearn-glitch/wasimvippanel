const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. MONGODB CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ CLOUD DATABASE CONNECTED"))
    .catch((err) => console.log("❌ DB CONNECTION ERROR: ", err.message));

// --- 2. DATA MODELS ---
const Key = mongoose.model('Key', {
    key: String,
    hwid: { type: String, default: "NOT_SET" },
    expiryDate: Date,
    duration: String,
    createdAt: { type: Date, default: Date.now }
});

// --- 3. LOADER LOGIN API ---
app.post('/login', async (req, res) => {
    const { key, hwid } = req.body;
    const found = await Key.findOne({ key: key });
    if (!found) return res.json({ status: false, msg: "INVALID KEY" });
    if (new Date() > found.expiryDate) return res.json({ status: false, msg: "EXPIRED" });
    
    if (found.hwid === "NOT_SET") {
        found.hwid = hwid;
        await found.save();
    } else if (found.hwid !== hwid) {
        return res.json({ status: false, msg: "HWID_MISMATCH" });
    }
    res.json({ 
        status: true, 
        msg: "SUCCESS", 
        data: { mod: "WASIM VIP", status: "Premium", expiry: found.expiryDate } 
    });
});

// --- 4. ULTIMATE AUTO-THEME CSS (ALL COLORS MIXED) ---
const commonStyles = `
    <style>
        :root { 
            --bg: #030303; 
            --card: rgba(10, 10, 15, 0.85);
            /* This variable is dynamically updated by JS every few milliseconds */
            --dynamic-clr: hsl(0, 100%, 50%); 
        }
        
        body { 
            background: var(--bg); 
            color: #fff; 
            font-family: 'Montserrat', 'Poppins', sans-serif; 
            margin: 0; 
            overflow-x: hidden;
            /* Smooth background gradient flow based on dynamic color */
            background-image: 
                radial-gradient(at 10% 10%, hsl(0, 100%, 10%) 0px, transparent 50%),
                radial-gradient(at 90% 90%, hsl(240, 100%, 5%) 0px, transparent 50%),
                radial-gradient(at 50% 50%, var(--bg) 0px, transparent 100%);
        }

        /* Dynamic CSS classes that update based on --dynamic-clr */
        .dynamic-txt {
            color: var(--dynamic-clr) !important;
            text-shadow: 0 0 10px var(--dynamic-clr), 0 0 20px var(--dynamic-clr);
            transition: color 0.1s linear, text-shadow 0.1s linear;
        }

        .dynamic-border {
            border-color: var(--dynamic-clr) !important;
            box-shadow: 0 0 15px rgba(255,255,255,0.1), inset 0 0 10px rgba(0,0,0,0.5);
            transition: border-color 0.1s linear;
        }

        .dynamic-btn {
            background: linear-gradient(135deg, var(--dynamic-clr) 0%, hsl(0,0%,100%) 200%) !important;
            color: #000 !important;
            font-weight: 800 !important;
            box-shadow: 0 5px 15px var(--dynamic-clr);
            border: none;
            transition: background 0.1s linear, box-shadow 0.1s linear;
        }
        
        /* Shared Styles */
        input, select { 
            background: rgba(0,0,0,0.4); 
            border: 2px solid rgba(255,255,255,0.05); 
            color: #fff; 
            padding: 15px; 
            margin: 10px 0; 
            width: 100%; 
            border-radius: 12px; 
            outline: none; 
            box-sizing: border-box; 
        }
        input:focus { border-color: #fff; }

        .main-btn { padding: 18px; font-weight: bold; border-radius: 15px; cursor: pointer; width: 100%; text-transform: uppercase; letter-spacing: 1px; }
        
        .section { display: none; max-width: 500px; margin: 20px auto; padding: 30px; background: var(--card); border-radius: 25px; border: 1px solid rgba(255,255,255,0.05); backdrop-filter: blur(10px); animation: fadeIn 0.5s ease; }
        .section.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .tab-btn { background: rgba(255,255,255,0.03); color: #888; border: 1px solid rgba(255,255,255,0.05); padding: 12px 20px; border-radius: 12px; cursor: pointer; margin: 5px; transition: 0.3s; }
        .tab-btn.active { color: #fff; border-width: 2px; }

        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.02); text-align: left; }
        th { font-size: 11px; text-transform: uppercase; color: #555; }
        .key-data { font-family: 'Courier New', monospace; font-weight: bold; background: rgba(255,255,255,0.05); padding: 5px 10px; border-radius: 8px; }

    </style>
`;

// --- 5. JS FOR CONTINUOUS COLOR SHIFTING ---
const dynamicThemeScript = `
    <script>
        let hue = 0;
        const mainBody = document.documentElement;

        // Function to update the theme color continuously
        function updateTheme() {
            // Using HSL (Hue, Saturation, Lightness) makes shifting through ALL colors easy
            // Hue ranges from 0-360, representing the color wheel
            hue = (hue + 1) % 360; 
            const newColor = \`hsl(\${hue}, 100%, 50%)\`; // Pure vibrant color
            const lowLightColor = \`hsl(\${hue}, 100%, 5%)\`; // Very dark version for background accents
            
            // Update CSS variable
            mainBody.style.setProperty('--dynamic-clr', newColor);
            
            // Request the next frame for smooth animation (approx 60fps)
            requestAnimationFrame(updateTheme);
        }

        // Start the continuous color shift
        updateTheme();
    </script>
`;


// --- 6. HOME PAGE & DASHBOARD ---
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>THE WASIM UNIVERSE</title>
        ${commonStyles}
    </head>
    <body>
        <div style="height:100vh; display:flex; align-items:center; justify-content:center; text-align:center;">
            <div style="background:var(--card); padding:60px 50px; border-radius:30px; border:2px solid;" class="dynamic-border">
                <h1 style="font-size:3.5rem; margin:0;" class="dynamic-txt">THE<br>WORLD<br>OF<br>COLORS</h1>
                <p style="color:#666; margin: 15px 0 40px 0; font-size:12px; letter-spacing:2px;">Continuously shifting through every spectrum.</p>
                <button class="main-btn dynamic-btn" onclick="location.href='/dashboard'">LAUNCH DASHBOARD</button>
            </div>
        </div>
        ${dynamicThemeScript}
    </body>
    </html>
    `);
});

app.get('/dashboard', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DASHBOARD | COLOR SPECTRUM</title>
        ${commonStyles}
    </head>
    <body>
        <div id="admin-login" style="position:fixed; inset:0; background:var(--bg); z-index:2000; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(20px);">
            <div style="background:var(--card); padding:50px; border-radius:30px; border:2px solid; width:320px; text-align:center;" class="dynamic-border">
                <h2 style="margin-top:0;" class="dynamic-txt">AUTHORIZE</h2>
                <p style="color:#555; font-size:11px; margin-bottom:20px;">Use Master ID & Password</p>
                <input type="text" id="u" placeholder="MASTER ID">
                <input type="password" id="p" placeholder="PASSWORD">
                <button class="main-btn dynamic-btn" onclick="verify()">CONNECT</button>
            </div>
        </div>

        <div id="panel-ui" style="display:none;">
            <nav style="padding:20px 30px; border-bottom:2px solid; display:flex; justify-content:space-between; align-items:center;" class="dynamic-border">
                <div style="font-weight:900; letter-spacing:2px; font-size:1.2rem;">WASIM<span class="dynamic-txt">GLOBAL</span></div>
                <button onclick="location.href='/'" style="background:rgba(255,0,0,0.1); color:red; border:1px solid red; padding:8px 15px; border-radius:10px; cursor:pointer; font-weight:bold;">DISCONNECT</button>
            </nav>

            <div style="background:var(--glass); margin:25px; padding:35px; border-radius:25px; text-align:center; border-bottom:4px solid;" class="dynamic-border">
                <p style="color:#666; margin:0; font-size:11px; letter-spacing:3px;">SYSTEM DATA STATUS</p>
                <h1 style="margin:10px 0; font-size:45px;" class="dynamic-txt">ACTIVE / SYNCED</h1>
            </div>

            <div style="text-align:center; margin-bottom:20px;">
                <button class="tab-btn active dynamic-border" id="bt1" onclick="tab('keys')">CREATE KEY</button>
                <button class="tab-btn dynamic-border" id="bt2" onclick="tab('list')">DATABASE</button>
            </div>

            <div id="keys" class="section active">
                <h3 style="margin-top:0;" class="dynamic-txt">LICENSE GENERATOR</h3>
                <input type="text" id="kName" placeholder="Client Name (Optional)">
                <select id="kTime">
                    <option value="2">2 Hours Trial</option>
                    <option value="24">1 Day Premium</option>
                    <option value="168">7 Days Deluxe</option>
                    <option value="720">30 Days Ultra</option>
                    <option value="1440">60 Days Legend</option>
                </select>
                <button class="main-btn dynamic-btn" onclick="gen()">SAVE KEY</button>
            </div>

            <div id="list" class="section" style="max-width:700px;">
                <h3 style="margin-top:0;" class="dynamic-txt">DATA LOGS</h3>
                <div style="overflow-x:auto;">
                    <table style="width:100%;">
                        <thead><tr style="border-bottom:2px solid;" class="dynamic-border"><th>Key Identifier</th><th>Duration</th><th>Manage</th></tr></thead>
                        <tbody id="db-list"></tbody>
                    </table>
                </div>
            </div>
        </div>

        ${dynamicThemeScript}
        <script>
            function verify() {
                if(document.getElementById('u').value === 'WASIMVIP' && document.getElementById('p').value === 'VIPWASIM') {
                    document.getElementById('admin-login').style.display = 'none';
                    document.getElementById('panel-ui').style.display = 'block';
                } else { alert("ACCESS DENIED"); }
            }

            function tab(id) {
                document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.getElementById(id).classList.add('active');
                event.currentTarget.classList.add('active');
                if(id === 'list') load();
            }

            async function gen() {
                await fetch('/admin/add-key', {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({key: document.getElementById('kName').value, hours: document.getElementById('kTime').value})
                });
                alert("KEY SAVED TO CLOUD!");
            }

            async function load() {
                const res = await fetch('/admin/all-data');
                const data = await res.json();
                document.getElementById('db-list').innerHTML = data.map(k => \`
                    <tr>
                        <td><span class="key-data">\${k.key}</span></td>
                        <td>\${k.duration}</td>
                        <td><button class="del-btn" onclick="del('\${k._id}')">REMOVE</button></td>
                    </tr>
                \`).join('');
            }

            async function del(id) {
                if(confirm("Delete Key?")) {
                    await fetch('/admin/del-key/'+id, {method:'DELETE'});
                    load();
                }
            }
        </script>
    </body>
    </html>
    `);
});

// --- ROUTES ---
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

app.delete('/admin/del-key/:id', async (req, res) => {
    await Key.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("🚀 The Spectrum System is Live"));
