// routes/menu.js
const router  = require('express').Router();
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const auth    = require('../middleware/auth');
const { run, get, all, lastInsertId } = require('../db');

// ── Upload config ──
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `item_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg','image/png','image/webp','image/gif'].includes(file.mimetype))
      cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

// GET /api/menu — public
router.get('/', (req, res) => {
  const { category } = req.query;
  let items;
  if (category && category !== 'All') {
    items = all('SELECT * FROM menu_items WHERE available=1 AND category=? ORDER BY sort_order ASC, id DESC', [category]);
  } else {
    items = all('SELECT * FROM menu_items WHERE available=1 ORDER BY sort_order ASC, id DESC');
  }
  res.json(items);
});

// GET /api/menu/categories — public
router.get('/categories', (req, res) => {
  const rows = all("SELECT DISTINCT category FROM menu_items WHERE available=1 ORDER BY category");
  res.json(rows.map(r => r.category));
});

// GET /api/menu/all — admin
router.get('/all', auth, (req, res) => {
  const items = all('SELECT * FROM menu_items ORDER BY sort_order ASC, id DESC');
  res.json(items);
});

// POST /api/menu — admin
router.post('/', auth, upload.single('photo'), (req, res) => {
  const { name, category, emoji, description, price } = req.body;
  if (!name || !category)
    return res.status(400).json({ error: 'Name and category are required' });

  const photo_url = req.file ? `/uploads/${req.file.filename}` : null;
  run(
    'INSERT INTO menu_items (name, category, emoji, description, price, photo_url) VALUES (?,?,?,?,?,?)',
    [name.trim(), category.trim(), emoji||'🍴', description||'', price||'', photo_url]
  );
  const id   = lastInsertId();
  const item = get('SELECT * FROM menu_items WHERE id=?', [id]);
  res.status(201).json(item);
});

// PUT /api/menu/:id — admin
router.put('/:id', auth, upload.single('photo'), (req, res) => {
  const { id } = req.params;
  const existing = get('SELECT * FROM menu_items WHERE id=?', [id]);
  if (!existing) return res.status(404).json({ error: 'Item not found' });

  const { name, category, emoji, description, price, available } = req.body;

  let photo_url = existing.photo_url;
  if (req.file) {
    if (existing.photo_url) {
      const old = path.join(__dirname, '..', existing.photo_url);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    photo_url = `/uploads/${req.file.filename}`;
  }

  run(
    `UPDATE menu_items SET name=?,category=?,emoji=?,description=?,price=?,
     photo_url=?,available=?,updated_at=datetime('now') WHERE id=?`,
    [
      name||existing.name, category||existing.category,
      emoji||existing.emoji,
      description !== undefined ? description : existing.description,
      price !== undefined ? price : existing.price,
      photo_url,
      available !== undefined ? Number(available) : existing.available,
      id
    ]
  );
  res.json(get('SELECT * FROM menu_items WHERE id=?', [id]));
});

// DELETE /api/menu/:id — admin
router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;
  const item = get('SELECT * FROM menu_items WHERE id=?', [id]);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (item.photo_url) {
    const fp = path.join(__dirname, '..', item.photo_url);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
  run('DELETE FROM menu_items WHERE id=?', [id]);
  res.json({ success: true, message: `"${item.name}" deleted` });
});

// DELETE /api/menu/:id/photo — admin
router.delete('/:id/photo', auth, (req, res) => {
  const { id } = req.params;
  const item = get('SELECT * FROM menu_items WHERE id=?', [id]);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (item.photo_url) {
    const fp = path.join(__dirname, '..', item.photo_url);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    run("UPDATE menu_items SET photo_url=NULL, updated_at=datetime('now') WHERE id=?", [id]);
  }
  res.json({ success: true });
});

module.exports = router;
