// routes/menu.js — using MongoDB + Cloudinary
const router     = require('express').Router();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer     = require('multer');
const auth       = require('../middleware/auth');
const MenuItem   = require('../models/MenuItem');

// ── Cloudinary config ──
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'tempted-bakery',
    allowed_formats: ['jpg','jpeg','png','webp','gif'],
    transformation: [{ width: 800, height: 600, crop: 'limit', quality: 'auto' }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
});

// GET /api/menu — public
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { available: true };
    if (category && category !== 'All') filter.category = category;
    const items = await MenuItem.find(filter).sort({ sort_order: 1, createdAt: -1 });
    res.json(items);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/menu/categories — public
router.get('/categories', async (req, res) => {
  try {
    const cats = await MenuItem.distinct('category', { available: true });
    res.json(cats.sort());
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/menu/all — admin
router.get('/all', auth, async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ sort_order: 1, createdAt: -1 });
    res.json(items);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/menu — admin
router.post('/', auth, upload.single('photo'), async (req, res) => {
  try {
    const { name, category, emoji, description, price } = req.body;
    if (!name || !category) return res.status(400).json({ error: 'Name and category required' });

    const item = new MenuItem({
      name: name.trim(),
      category: category.trim(),
      emoji: emoji || '🍴',
      description: description || '',
      price: price || '',
      photo_url:       req.file ? req.file.path       : null,
      photo_public_id: req.file ? req.file.filename   : null,
    });
    await item.save();
    res.status(201).json(item);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/menu/:id — admin
router.put('/:id', auth, upload.single('photo'), async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const { name, category, emoji, description, price, available } = req.body;
    if (name)        item.name        = name.trim();
    if (category)    item.category    = category.trim();
    if (emoji)       item.emoji       = emoji;
    if (description !== undefined) item.description = description;
    if (price !== undefined)       item.price       = price;
    if (available !== undefined)   item.available   = available === 'true' || available === '1' || available === true;

    // New photo uploaded — delete old from Cloudinary
    if (req.file) {
      if (item.photo_public_id) {
        await cloudinary.uploader.destroy(item.photo_public_id).catch(()=>{});
      }
      item.photo_url       = req.file.path;
      item.photo_public_id = req.file.filename;
    }

    await item.save();
    res.json(item);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/menu/:id — admin
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.photo_public_id) {
      await cloudinary.uploader.destroy(item.photo_public_id).catch(()=>{});
    }
    await item.deleteOne();
    res.json({ success: true, message: `"${item.name}" deleted` });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/menu/:id/photo — admin
router.delete('/:id/photo', auth, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.photo_public_id) {
      await cloudinary.uploader.destroy(item.photo_public_id).catch(()=>{});
      item.photo_url = null;
      item.photo_public_id = null;
      await item.save();
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
