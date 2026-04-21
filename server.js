const path = require('path');
app.use(express.json());
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.static(path.join(__dirname, "public")));

// ✅ MongoDB Atlas connection

mongoose.connect(process.env.MONGO_URI)
// ===== MODELS =====
const User = mongoose.model('User', {
  username: String,
  password: String
});

const Key = mongoose.model('Key', {
  key: String,
  plan: String,
  devices: Number,
  createdAt: { type: Date, default: Date.now }
});

// ===== ROUTES =====

// Register
app.post('/register', async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10);
  const user = new User({
    username: req.body.username,
    password: hash
  });

  await user.save();
  res.json({ message: "User registered" });
});

// Login
app.post('/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user) return res.status(400).send("User not found");

  const valid = await bcrypt.compare(req.body.password, user.password);
  if (!valid) return res.status(400).send("Wrong password");

  const token = jwt.sign({ id: user._id }, "SECRET_KEY");
  res.json({ token });
});

// Generate Key
function generateKey() {
  return "WASIM-" + Math.random().toString(36).substr(2, 8).toUpperCase();
}

app.post('/generate', async (req, res) => {
  const keyVal = generateKey();

  const newKey = new Key({
    key: keyVal,
    plan: req.body.plan,
    devices: req.body.devices
  });

  await newKey.save();

  res.json({ key: keyVal });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});
app.listen(PORT, () => console.log("Server running on port " + PORT));
