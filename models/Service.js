const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
    trim: true, // Bootstrap icon class name (e.g., "bi-pool" or "bi-tools")
  },
  featured: {
    type: Boolean,
    default: false, // For home page display
  },
  order: {
    type: Number,
    default: 0, // For sorting on home page
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Service', serviceSchema);

