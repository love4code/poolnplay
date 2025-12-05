const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Settings = require('../models/Settings');
const Service = require('../models/Service');
const Project = require('../models/Project');
const Product = require('../models/Product');
const Inquiry = require('../models/Inquiry');
const Media = require('../models/Media');
const sharp = require('sharp');
const multer = require('multer');

// Helper to check MongoDB connection
const checkMongoConnection = () => {
  return mongoose.connection.readyState === 1;
};

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Admin Dashboard
exports.getDashboard = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    // Default stats if MongoDB not connected
    const defaultStats = {
      inquiries: 0,
      unreadInquiries: 0,
      products: 0,
      services: 0,
      projects: 0,
      media: 0,
    };
    
    let stats = defaultStats;
    
    // Only query MongoDB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        stats = {
          inquiries: await Inquiry.countDocuments().catch(() => 0),
          unreadInquiries: await Inquiry.countDocuments({ read: false }).catch(() => 0),
          products: await Product.countDocuments({ active: true }).catch(() => 0),
          services: await Service.countDocuments({ active: true }).catch(() => 0),
          projects: await Project.countDocuments({ active: true }).catch(() => 0),
          media: await Media.countDocuments().catch(() => 0),
        };
      } catch (error) {
        console.error('Error fetching stats:', error);
        stats = defaultStats;
      }
    } else {
      console.warn('MongoDB not connected. Showing default stats.');
    }
    
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      stats,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', { error: 'Error loading dashboard', title: 'Error' });
  }
};

// Login
exports.getLogin = (req, res) => {
  // Don't destroy session - just render the login page
  res.render('admin/login', { title: 'Admin Login' });
};

exports.postLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Get admin credentials from environment variables
    // Trim whitespace in case there are accidental spaces
    const adminUsername = (process.env.ADMIN_USERNAME || 'admin').trim();
    const adminPassword = (process.env.ADMIN_PASSWORD || 'admin123').trim();
    
    // Debug logging
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Provided username:', username);
    console.log('Expected username:', adminUsername);
    console.log('Username match:', username && username.trim() === adminUsername);
    console.log('Password provided:', password ? 'Yes (' + password.length + ' chars)' : 'No');
    console.log('Expected password length:', adminPassword ? adminPassword.length : 0);
    console.log('Password match:', password === adminPassword);
    console.log('SESSION_SECRET set:', !!process.env.SESSION_SECRET);
    
    // Check if credentials match
    if (username && password && username.trim() === adminUsername && password === adminPassword) {
      // Set session data
      req.session.isAdmin = true;
      req.session.user = username;
      
      console.log('=== LOGIN SUCCESS ===');
      console.log('Session ID:', req.sessionID);
      console.log('Setting isAdmin to true');
      
      // CRITICAL: Ensure session is saved and cookie is set before redirect
      // Use req.session.regenerate to get a fresh session, then set data
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regenerate error:', err);
          return res.render('admin/login', {
            title: 'Admin Login',
            error: 'Session error. Please try again.',
          });
        }
        
        // Set session data after regeneration
        req.session.isAdmin = true;
        req.session.user = username;
        
        console.log('New session ID after regenerate:', req.sessionID);
        console.log('Session data:', req.session);
        
        // Save the session
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.render('admin/login', {
              title: 'Admin Login',
              error: 'Session error. Please try again.',
            });
          }
          
          console.log('Session saved. Final session ID:', req.sessionID);
          console.log('Final session data:', JSON.stringify(req.session));
          
          // Wait a moment to ensure express-session sets the cookie
          // Then redirect
          setTimeout(() => {
            res.redirect('/admin');
          }, 50);
        });
      });
    } else {
      console.log('Login failed: Credentials do not match');
      res.render('admin/login', {
        title: 'Admin Login',
        error: 'Invalid username or password',
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('admin/login', {
      title: 'Admin Login',
      error: 'An error occurred. Please try again.',
    });
  }
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/admin/login');
  });
};

// ========== MEDIA LIBRARY ==========
exports.getMedia = async (req, res) => {
  try {
    if (!checkMongoConnection()) {
      return res.render('admin/media', {
        title: 'Media Library',
        media: [],
        error: 'MongoDB not connected. Please configure MONGODB_URI.',
      });
    }
    
    const media = await Media.find().sort({ createdAt: -1 }).limit(50).catch(() => []);
    res.render('admin/media', {
      title: 'Media Library',
      media: media || [],
    });
  } catch (error) {
    console.error('Media library error:', error);
    res.status(500).render('error', { error: 'Error loading media library', title: 'Error' });
  }
};

exports.uploadMedia = [
  upload.array('images', 10),
  async (req, res) => {
    try {
      if (!checkMongoConnection()) {
        return res.status(500).json({ success: false, message: 'MongoDB not connected. Cannot upload media.' });
      }
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files uploaded' });
      }
      
      const uploadedMedia = [];
      
      for (const file of req.files) {
        // Process image with sharp
        const image = sharp(file.buffer);
        const metadata = await image.metadata();
        
        // Create different sizes
        const large = await image
          .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer();
        
        const medium = await image
          .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
        
        const thumbnail = await image
          .resize(300, 300, { fit: 'cover' })
          .jpeg({ quality: 75 })
          .toBuffer();
        
        // Save to database
        const media = new Media({
          filename: file.originalname,
          originalName: file.originalname,
          mimeType: 'image/jpeg',
          large,
          medium,
          thumbnail,
          width: metadata.width,
          height: metadata.height,
          largeSize: large.length,
          mediumSize: medium.length,
          thumbnailSize: thumbnail.length,
        });
        
        await media.save().catch(() => {
          throw new Error('Failed to save media to database');
        });
        uploadedMedia.push(media);
      }
      
      // Convert media to JSON with virtuals (data URLs)
      const mediaData = uploadedMedia.map(m => ({
        _id: m._id,
        originalName: m.originalName,
        filename: m.filename,
        thumbnailDataUrl: m.thumbnailDataUrl,
        mediumDataUrl: m.mediumDataUrl,
        largeDataUrl: m.largeDataUrl,
        width: m.width,
        height: m.height,
        createdAt: m.createdAt,
      }));
      
      res.json({ success: true, media: mediaData });
    } catch (error) {
      console.error('Media upload error:', error);
      res.status(500).json({ success: false, message: 'Error uploading media' });
    }
  },
];

exports.deleteMedia = async (req, res) => {
  try {
    if (!checkMongoConnection()) {
      return res.status(500).json({ success: false, message: 'MongoDB not connected' });
    }
    await Media.findByIdAndDelete(req.params.id).catch(() => {
      throw new Error('Failed to delete media');
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Media delete error:', error);
    res.status(500).json({ success: false, message: 'Error deleting media' });
  }
};

// ========== SERVICES ==========
exports.getServices = async (req, res) => {
  try {
    if (!checkMongoConnection()) {
      return res.render('admin/services', {
        title: 'Services Management',
        services: [],
        error: 'MongoDB not connected. Please configure MONGODB_URI.',
      });
    }
    
    const services = await Service.find().sort({ order: 1, createdAt: -1 }).catch(() => []);
    res.render('admin/services', {
      title: 'Services Management',
      services: services || [],
    });
  } catch (error) {
    console.error('Services error:', error);
    res.status(500).render('error', { error: 'Error loading services', title: 'Error' });
  }
};

exports.getServiceForm = async (req, res) => {
  try {
    if (!checkMongoConnection()) {
      return res.render('admin/service-form', {
        title: 'Add Service',
        service: null,
        error: 'MongoDB not connected. Please configure MONGODB_URI.',
      });
    }
    
    const service = req.params.id ? await Service.findById(req.params.id).catch(() => null) : null;
    res.render('admin/service-form', {
      title: service ? 'Edit Service' : 'Add Service',
      service,
    });
  } catch (error) {
    console.error('Service form error:', error);
    res.status(500).render('error', { error: 'Error loading service form', title: 'Error' });
  }
};

exports.saveService = async (req, res) => {
  try {
    if (!checkMongoConnection()) {
      return res.render('admin/service-form', {
        title: req.params.id ? 'Edit Service' : 'Add Service',
        service: req.params.id ? { _id: req.params.id } : null,
        error: 'MongoDB not connected. Cannot save service.',
      });
    }
    
    const { name, description, icon, featured, order, active } = req.body;
    
    if (req.params.id) {
      await Service.findByIdAndUpdate(req.params.id, {
        name,
        description,
        icon,
        featured: featured === 'on',
        order: parseInt(order) || 0,
        active: active === 'on',
      }).catch(() => {
        throw new Error('Failed to update service');
      });
    } else {
      await Service.create({
        name,
        description,
        icon,
        featured: featured === 'on',
        order: parseInt(order) || 0,
        active: active === 'on',
      }).catch(() => {
        throw new Error('Failed to create service');
      });
    }
    
    res.redirect('/admin/services');
  } catch (error) {
    console.error('Save service error:', error);
    res.status(500).render('error', { error: 'Error saving service', title: 'Error' });
  }
};

exports.deleteService = async (req, res) => {
  try {
    if (!checkMongoConnection()) {
      return res.status(500).json({ success: false, message: 'MongoDB not connected' });
    }
    await Service.findByIdAndDelete(req.params.id).catch(() => {
      throw new Error('Failed to delete service');
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ success: false, message: 'Error deleting service' });
  }
};

// ========== PROJECTS ==========
exports.getProjects = async (req, res) => {
  try {
    if (!checkMongoConnection()) {
      return res.render('admin/projects', {
        title: 'Projects Management',
        projects: [],
        media: [],
        error: 'MongoDB not connected. Please configure MONGODB_URI.',
      });
    }
    
    const projects = await Project.find().sort({ order: 1, createdAt: -1 }).populate('images').catch(() => []);
    const media = await Media.find().sort({ createdAt: -1 }).catch(() => []);
    res.render('admin/projects', {
      title: 'Projects Management',
      projects: projects || [],
      media: media || [],
    });
  } catch (error) {
    console.error('Projects error:', error);
    res.status(500).render('error', { error: 'Error loading projects', title: 'Error' });
  }
};

exports.getProjectForm = async (req, res) => {
  try {
    if (!checkMongoConnection()) {
      return res.render('admin/project-form', {
        title: 'Add Project',
        project: null,
        media: [],
        error: 'MongoDB not connected. Please configure MONGODB_URI.',
      });
    }
    
    const project = req.params.id ? await Project.findById(req.params.id).populate('images').catch(() => null) : null;
    const media = await Media.find().sort({ createdAt: -1 }).catch(() => []);
    res.render('admin/project-form', {
      title: project ? 'Edit Project' : 'Add Project',
      project,
      media: media || [],
    });
  } catch (error) {
    console.error('Project form error:', error);
    res.status(500).render('error', { error: 'Error loading project form', title: 'Error' });
  }
};

exports.saveProject = async (req, res) => {
  try {
    if (!checkMongoConnection()) {
      return res.render('admin/project-form', {
        title: req.params.id ? 'Edit Project' : 'Add Project',
        project: req.params.id ? { _id: req.params.id } : null,
        media: [],
        error: 'MongoDB not connected. Cannot save project.',
      });
    }
    
    const { title, description, images, featured, order, seoTitle, seoDescription, active } = req.body;
    
    const imageIds = images ? (Array.isArray(images) ? images : [images]) : [];
    
    if (req.params.id) {
      await Project.findByIdAndUpdate(req.params.id, {
        title,
        description,
        images: imageIds,
        featured: featured === 'on',
        order: parseInt(order) || 0,
        seoTitle,
        seoDescription,
        active: active === 'on',
      }).catch(() => {
        throw new Error('Failed to update project');
      });
    } else {
      await Project.create({
        title,
        description,
        images: imageIds,
        featured: featured === 'on',
        order: parseInt(order) || 0,
        seoTitle,
        seoDescription,
        active: active === 'on',
      }).catch(() => {
        throw new Error('Failed to create project');
      });
    }
    
    res.redirect('/admin/projects');
  } catch (error) {
    console.error('Save project error:', error);
    res.status(500).render('error', { error: 'Error saving project', title: 'Error' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    if (!checkMongoConnection()) {
      return res.status(500).json({ success: false, message: 'MongoDB not connected' });
    }
    await Project.findByIdAndDelete(req.params.id).catch(() => {
      throw new Error('Failed to delete project');
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, message: 'Error deleting project' });
  }
};

// ========== PRODUCTS ==========
exports.getProducts = async (req, res) => {
  try {
    if (!checkMongoConnection()) {
      return res.render('admin/products', {
        title: 'Products Management',
        products: [],
        media: [],
        error: 'MongoDB not connected. Please configure MONGODB_URI.',
      });
    }
    
    const products = await Product.find().sort({ createdAt: -1 }).populate('featuredImage').catch(() => []);
    const media = await Media.find().sort({ createdAt: -1 }).catch(() => []);
    res.render('admin/products', {
      title: 'Products Management',
      products: products || [],
      media: media || [],
    });
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).render('error', { error: 'Error loading products', title: 'Error' });
  }
};

exports.getProductForm = async (req, res) => {
  try {
    if (!checkMongoConnection()) {
      return res.render('admin/product-form', {
        title: 'Add Product',
        product: null,
        media: [],
        error: 'MongoDB not connected. Please configure MONGODB_URI.',
      });
    }
    
    const product = req.params.id ? await Product.findById(req.params.id).populate('featuredImage').catch(() => null) : null;
    const media = await Media.find().sort({ createdAt: -1 }).catch(() => []);
    res.render('admin/product-form', {
      title: product ? 'Edit Product' : 'Add Product',
      product,
      media: media || [],
    });
  } catch (error) {
    console.error('Product form error:', error);
    res.status(500).render('error', { error: 'Error loading product form', title: 'Error' });
  }
};

exports.saveProduct = async (req, res) => {
  try {
    if (!checkMongoConnection()) {
      return res.render('admin/product-form', {
        title: req.params.id ? 'Edit Product' : 'Add Product',
        product: req.params.id ? { _id: req.params.id } : null,
        media: [],
        error: 'MongoDB not connected. Cannot save product.',
      });
    }
    
    const { name, description, price, sizes, featuredImage, seoTitle, seoDescription, active } = req.body;
    
    const sizesArray = sizes ? (typeof sizes === 'string' ? sizes.split(',').map(s => s.trim()) : sizes) : [];
    
    if (req.params.id) {
      await Product.findByIdAndUpdate(req.params.id, {
        name,
        description,
        price: price ? parseFloat(price) : null,
        sizes: sizesArray,
        featuredImage: featuredImage || null,
        seoTitle,
        seoDescription,
        active: active === 'on',
      }).catch(() => {
        throw new Error('Failed to update product');
      });
    } else {
      await Product.create({
        name,
        description,
        price: price ? parseFloat(price) : null,
        sizes: sizesArray,
        featuredImage: featuredImage || null,
        seoTitle,
        seoDescription,
        active: active === 'on',
      }).catch(() => {
        throw new Error('Failed to create product');
      });
    }
    
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Save product error:', error);
    res.status(500).render('error', { error: 'Error saving product', title: 'Error' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    if (!checkMongoConnection()) {
      return res.status(500).json({ success: false, message: 'MongoDB not connected' });
    }
    await Product.findByIdAndDelete(req.params.id).catch(() => {
      throw new Error('Failed to delete product');
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Error deleting product' });
  }
};

// ========== SETTINGS ==========
exports.getSettings = async (req, res) => {
  try {
    let settings, media = [];
    
    if (checkMongoConnection()) {
      try {
        settings = await Settings.getSettings();
        media = await Media.find().sort({ createdAt: -1 }).catch(() => []);
      } catch (error) {
        console.error('Error loading settings:', error);
        settings = {
          companyName: 'Pool N Play',
          companyAddress: '',
          companyPhone: '',
          companyEmail: '',
          defaultSeoTitle: 'Pool N Play',
          defaultSeoDescription: 'Pool services',
        };
      }
    } else {
      settings = {
        companyName: 'Pool N Play',
        companyAddress: '',
        companyPhone: '',
        companyEmail: '',
        defaultSeoTitle: 'Pool N Play',
        defaultSeoDescription: 'Pool services',
      };
    }
    
    res.render('admin/settings', {
      title: 'Settings',
      settings,
      media: media || [],
      success: req.query.success === 'true',
    });
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).render('error', { error: 'Error loading settings', title: 'Error' });
  }
};

exports.saveSettings = async (req, res) => {
  try {
    if (!checkMongoConnection()) {
      return res.render('admin/settings', {
        title: 'Settings',
        settings: {
          companyName: 'Pool N Play',
          companyAddress: '',
          companyPhone: '',
          companyEmail: '',
        },
        media: [],
        error: 'MongoDB not connected. Cannot save settings.',
      });
    }
    
    const settings = await Settings.getSettings();
    const {
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
      facebook,
      instagram,
      twitter,
      linkedin,
      youtube,
      theme,
      primaryColor,
      secondaryColor,
      heroImage,
      defaultSeoTitle,
      defaultSeoDescription,
    } = req.body;
    
    settings.companyName = companyName;
    settings.companyAddress = companyAddress;
    settings.companyPhone = companyPhone;
    settings.companyEmail = companyEmail;
    settings.facebook = facebook || '';
    settings.instagram = instagram || '';
    settings.twitter = twitter || '';
    settings.linkedin = linkedin || '';
    settings.youtube = youtube || '';
    settings.theme = theme;
    settings.primaryColor = primaryColor;
    settings.secondaryColor = secondaryColor;
    settings.heroImage = heroImage || null;
    settings.defaultSeoTitle = defaultSeoTitle;
    settings.defaultSeoDescription = defaultSeoDescription;
    
    await settings.save();
    res.redirect('/admin/settings?success=true');
  } catch (error) {
    console.error('Save settings error:', error);
    res.status(500).render('error', { error: 'Error saving settings', title: 'Error' });
  }
};

// ========== INQUIRIES ==========
exports.getInquiries = async (req, res) => {
  try {
    if (!checkMongoConnection()) {
      return res.render('admin/inquiries', {
        title: 'Recent Inquiries',
        inquiries: [],
        error: 'MongoDB not connected. Please configure MONGODB_URI.',
      });
    }
    
    const inquiries = await Inquiry.find()
      .sort({ createdAt: -1 })
      .populate('productId')
      .limit(100)
      .catch(() => []);
    
    res.render('admin/inquiries', {
      title: 'Recent Inquiries',
      inquiries: inquiries || [],
    });
  } catch (error) {
    console.error('Inquiries error:', error);
    res.status(500).render('error', { error: 'Error loading inquiries', title: 'Error' });
  }
};

exports.deleteInquiry = async (req, res) => {
  try {
    if (!checkMongoConnection()) {
      return res.status(500).json({ success: false, message: 'MongoDB not connected' });
    }
    await Inquiry.findByIdAndDelete(req.params.id).catch(() => {
      throw new Error('Failed to delete inquiry');
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete inquiry error:', error);
    res.status(500).json({ success: false, message: 'Error deleting inquiry' });
  }
};

exports.markInquiryRead = async (req, res) => {
  try {
    if (!checkMongoConnection()) {
      return res.status(500).json({ success: false, message: 'MongoDB not connected' });
    }
    await Inquiry.findByIdAndUpdate(req.params.id, { read: true }).catch(() => {
      throw new Error('Failed to update inquiry');
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Mark inquiry read error:', error);
    res.status(500).json({ success: false, message: 'Error updating inquiry' });
  }
};

