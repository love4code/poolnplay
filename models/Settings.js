const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Company Information
  companyName: {
    type: String,
    default: 'Pool N Play',
  },
  companyAddress: {
    type: String,
    default: '',
  },
  companyPhone: {
    type: String,
    default: '',
  },
  companyEmail: {
    type: String,
    default: '',
  },
  // Social Media Links
  facebook: {
    type: String,
    default: '',
  },
  instagram: {
    type: String,
    default: '',
  },
  twitter: {
    type: String,
    default: '',
  },
  linkedin: {
    type: String,
    default: '',
  },
  youtube: {
    type: String,
    default: '',
  },
  // Theme Settings
  theme: {
    type: String,
    enum: ['blue-water', 'ocean-blue', 'tropical-blue', 'custom'],
    default: 'blue-water',
  },
  primaryColor: {
    type: String,
    default: '#0d6efd', // Bootstrap primary blue
  },
  secondaryColor: {
    type: String,
    default: '#6c757d',
  },
  // Hero Image
  heroImage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
    default: null,
  },
  // SEO Defaults
  defaultSeoTitle: {
    type: String,
    default: 'Pool N Play - Professional Pool Installation & Services',
  },
  defaultSeoDescription: {
    type: String,
    default: 'Expert pool installation, liner replacement, and pool services.',
  },
}, {
  timestamps: true,
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);

