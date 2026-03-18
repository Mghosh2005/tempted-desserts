// routes/orders.js
const router = require('express').Router();
const auth   = require('../middleware/auth');
const { run, get, all, lastInsertId } = require('../db');

// POST /api/orders — public
router.post('/', (req, res) => {
  const { customer_name, phone, email, item_name, notes } = req.body;
  if (!customer_name || !phone || !item_name)
    return res.status(400).json({ error: 'Name, phone and item are required' });

  run(
    'INSERT INTO orders (customer_name, phone, email, item_name, notes) VALUES (?,?,?,?,?)',
    [customer_name.trim(), phone.trim(), email||'', item_name.trim(), notes||'']
  );
  const order = get('SELECT * FROM orders WHERE id=?', [lastInsertId()]);
  res.status(201).json({ success: true, order });
});

// GET /api/orders — admin
router.get('/', auth, (req, res) => {
  const { status } = req.query;
  const orders = status
    ? all('SELECT * FROM orders WHERE status=? ORDER BY created_at DESC', [status])
    : all('SELECT * FROM orders ORDER BY created_at DESC');
  res.json(orders);
});

// PUT /api/orders/:id/status — admin
router.put('/:id/status', auth, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ['new','confirmed','preparing','ready','delivered','cancelled'];
  if (!allowed.includes(status))
    return res.status(400).json({ error: 'Invalid status' });

  run('UPDATE orders SET status=? WHERE id=?', [status, id]);
  const order = get('SELECT * FROM orders WHERE id=?', [id]);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// DELETE /api/orders/:id — admin
router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;
  const order = get('SELECT * FROM orders WHERE id=?', [id]);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  run('DELETE FROM orders WHERE id=?', [id]);
  res.json({ success: true });
});

module.exports = router;
