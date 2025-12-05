const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    default: null, // Optional price
  },
  sizes: [{
    type: String,
    trim: true,
  }],
  featuredImage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
  },
  images: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
  }],
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

module.exports = mongoose.model('Product', productSchema);

