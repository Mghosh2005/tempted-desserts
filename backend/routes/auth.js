// routes/auth.js
const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const auth   = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  if (password !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ error: 'Wrong password' });

  const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, message: 'Login successful' });
});

// GET /api/auth/verify
router.get('/verify', auth, (req, res) => {
  res.json({ valid: true });
});

module.exports = router;
