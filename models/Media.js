const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  // Store image buffers for different sizes
  large: {
    type: Buffer,
  },
  medium: {
    type: Buffer,
  },
  thumbnail: {
    type: Buffer,
  },
  // Store dimensions
  width: {
    type: Number,
  },
  height: {
    type: Number,
  },
  // Store file sizes in bytes
  largeSize: {
    type: Number,
  },
  mediumSize: {
    type: Number,
  },
  thumbnailSize: {
    type: Number,
  },
  alt: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Virtual for getting base64 data URLs
mediaSchema.virtual('largeDataUrl').get(function() {
  if (this.large) {
    return `data:${this.mimeType};base64,${this.large.toString('base64')}`;
  }
  return null;
});

mediaSchema.virtual('mediumDataUrl').get(function() {
  if (this.medium) {
    return `data:${this.mimeType};base64,${this.medium.toString('base64')}`;
  }
  return null;
});

mediaSchema.virtual('thumbnailDataUrl').get(function() {
  if (this.thumbnail) {
    return `data:${this.mimeType};base64,${this.thumbnail.toString('base64')}`;
  }
  return null;
});

mediaSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Media', mediaSchema);

