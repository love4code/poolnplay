const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  town: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  service: {
    type: String,
    enum: ['New Above Ground Pool', 'Liner Replacement', 'Pool Install', 'Service Call'],
    required: true,
  },
  poolSizes: [{
    type: String,
    trim: true,
  }], // For product page inquiries
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null, // null for general inquiries, set for product-specific
  },
  message: {
    type: String,
    default: '',
  },
  read: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Inquiry', inquirySchema);

