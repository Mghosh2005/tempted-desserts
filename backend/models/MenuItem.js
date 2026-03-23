// models/MenuItem.js
const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  category:    { type: String, required: true, trim: true },
  emoji:       { type: String, default: '🍴' },
  description: { type: String, default: '' },
  price:       { type: String, default: '' },
  photo_url:   { type: String, default: null },
  photo_public_id: { type: String, default: null }, // cloudinary public_id
  available:   { type: Boolean, default: true },
  sort_order:  { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', MenuItemSchema);
