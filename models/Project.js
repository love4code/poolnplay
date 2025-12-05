const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  images: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
  }],
  featured: {
    type: Boolean,
    default: false, // For home page display
  },
  order: {
    type: Number,
    default: 0, // For sorting
  },
  seoTitle: {
    type: String,
    trim: true,
  },
  seoDescription: {
    type: String,
    trim: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Project', projectSchema);

