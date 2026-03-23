// routes/orders.js — MongoDB + Email notifications
const router = require('express').Router();
const auth   = require('../middleware/auth');
const Order  = require('../models/Order');
const { sendOwnerNotification, sendCustomerConfirmation, sendStatusUpdate } = require('../utils/email');

// POST /api/orders — public: place order
router.post('/', async (req, res) => {
  try {
    const { customer_name, phone, email, item_name, notes } = req.body;
    if (!customer_name || !phone || !item_name)
      return res.status(400).json({ error: 'Name, phone and item are required' });

    const order = await Order.create({ customer_name, phone, email, item_name, notes });

    // Send emails in background (don't block response)
    Promise.allSettled([
      sendOwnerNotification(order),       // notify you (owner)
      sendCustomerConfirmation(order),    // confirm to customer (if they gave email)
    ]).then(results => {
      results.forEach(r => {
        if (r.status === 'rejected') console.warn('Email error:', r.reason?.message);
      });
    });

    res.status(201).json({ success: true, order });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/orders — admin
router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/orders/:id/status — admin: update status + notify customer
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['new','confirmed','preparing','ready','delivered','cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Send status update email to customer in background
    if (order.email) {
      sendStatusUpdate(order).catch(e => console.warn('Status email error:', e.message));
    }

    res.json(order);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/orders/:id — admin
router.delete('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
