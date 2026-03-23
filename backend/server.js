// server.js — Tempted Bakery with MongoDB
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const { connectDB } = require('./db');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve frontend
const FRONTEND = path.join(__dirname, '..', 'frontend', 'public');
if (fs.existsSync(FRONTEND)) app.use(express.static(FRONTEND));

// Routes
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/menu',   require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// SPA fallback
app.get('*', (req, res) => {
  const index = path.join(FRONTEND, 'index.html');
  if (fs.existsSync(index)) res.sendFile(index);
  else res.json({ message: 'Tempted Bakery API running ✅' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large (max 8MB)' });
  res.status(500).json({ error: err.message || 'Server error' });
});

// Start
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🎂  Tempted Bakery → http://localhost:${PORT}`);
    console.log(`    Admin password: ${process.env.ADMIN_PASSWORD}\n`);
  });
}).catch(err => {
  console.error('❌ Failed to connect to database:', err.message);
  process.exit(1);
});
