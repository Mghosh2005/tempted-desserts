// models/Order.js
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  customer_name: { type: String, required: true, trim: true },
  phone:         { type: String, required: true, trim: true },
  email:         { type: String, default: '' },
  item_name:     { type: String, required: true, trim: true },
  notes:         { type: String, default: '' },
  status:        {
    type: String,
    enum: ['new','confirmed','preparing','ready','delivered','cancelled'],
    default: 'new'
  },
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
