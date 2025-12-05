const bcrypt = require('bcryptjs');
const Settings = require('../models/Settings');
const Service = require('../models/Service');
const Project = require('../models/Project');
const Product = require('../models/Product');
const Inquiry = require('../models/Inquiry');
const Media = require('../models/Media');
const sharp = require('sharp');
const multer = require('multer');

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
    const stats = {
      inquiries: await Inquiry.countDocuments(),
      unreadInquiries: await Inquiry.countDocuments({ read: false }),
      products: await Product.countDocuments({ active: true }),
      services: await Service.countDocuments({ active: true }),
      projects: await Project.countDocuments({ active: true }),
      media: await Media.countDocuments(),
    };
    
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
  res.render('admin/login', { title: 'Admin Login' });
};

exports.postLogin = async (req, res) => {
  const { username, password } = req.body;
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (username === adminUsername && password === adminPassword) {
    req.session.isAdmin = true;
    res.redirect('/admin');
  } else {
    res.render('admin/login', {
      title: 'Admin Login',
      error: 'Invalid credentials',
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
    const media = await Media.find().sort({ createdAt: -1 }).limit(50);
    res.render('admin/media', {
      title: 'Media Library',
      media,
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
        
        await media.save();
        uploadedMedia.push(media);
      }
      
      res.json({ success: true, media: uploadedMedia });
    } catch (error) {
      console.error('Media upload error:', error);
      res.status(500).json({ success: false, message: 'Error uploading media' });
    }
  },
];

exports.deleteMedia = async (req, res) => {
  try {
    await Media.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Media delete error:', error);
    res.status(500).json({ success: false, message: 'Error deleting media' });
  }
};

// ========== SERVICES ==========
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ order: 1, createdAt: -1 });
    res.render('admin/services', {
      title: 'Services Management',
      services,
    });
  } catch (error) {
    console.error('Services error:', error);
    res.status(500).render('error', { error: 'Error loading services', title: 'Error' });
  }
};

exports.getServiceForm = async (req, res) => {
  try {
    const service = req.params.id ? await Service.findById(req.params.id) : null;
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
    const { name, description, icon, featured, order, active } = req.body;
    
    if (req.params.id) {
      await Service.findByIdAndUpdate(req.params.id, {
        name,
        description,
        icon,
        featured: featured === 'on',
        order: parseInt(order) || 0,
        active: active === 'on',
      });
    } else {
      await Service.create({
        name,
        description,
        icon,
        featured: featured === 'on',
        order: parseInt(order) || 0,
        active: active === 'on',
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
    await Service.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ success: false, message: 'Error deleting service' });
  }
};

// ========== PROJECTS ==========
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ order: 1, createdAt: -1 }).populate('images');
    const media = await Media.find().sort({ createdAt: -1 });
    res.render('admin/projects', {
      title: 'Projects Management',
      projects,
      media,
    });
  } catch (error) {
    console.error('Projects error:', error);
    res.status(500).render('error', { error: 'Error loading projects', title: 'Error' });
  }
};

exports.getProjectForm = async (req, res) => {
  try {
    const project = req.params.id ? await Project.findById(req.params.id).populate('images') : null;
    const media = await Media.find().sort({ createdAt: -1 });
    res.render('admin/project-form', {
      title: project ? 'Edit Project' : 'Add Project',
      project,
      media,
    });
  } catch (error) {
    console.error('Project form error:', error);
    res.status(500).render('error', { error: 'Error loading project form', title: 'Error' });
  }
};

exports.saveProject = async (req, res) => {
  try {
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
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, message: 'Error deleting project' });
  }
};

// ========== PRODUCTS ==========
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).populate('featuredImage');
    const media = await Media.find().sort({ createdAt: -1 });
    res.render('admin/products', {
      title: 'Products Management',
      products,
      media,
    });
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).render('error', { error: 'Error loading products', title: 'Error' });
  }
};

exports.getProductForm = async (req, res) => {
  try {
    const product = req.params.id ? await Product.findById(req.params.id).populate('featuredImage') : null;
    const media = await Media.find().sort({ createdAt: -1 });
    res.render('admin/product-form', {
      title: product ? 'Edit Product' : 'Add Product',
      product,
      media,
    });
  } catch (error) {
    console.error('Product form error:', error);
    res.status(500).render('error', { error: 'Error loading product form', title: 'Error' });
  }
};

exports.saveProduct = async (req, res) => {
  try {
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
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Error deleting product' });
  }
};

// ========== SETTINGS ==========
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const media = await Media.find().sort({ createdAt: -1 });
    res.render('admin/settings', {
      title: 'Settings',
      settings,
      media,
      success: req.query.success === 'true',
    });
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).render('error', { error: 'Error loading settings', title: 'Error' });
  }
};

exports.saveSettings = async (req, res) => {
  try {
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
    const inquiries = await Inquiry.find()
      .sort({ createdAt: -1 })
      .populate('productId')
      .limit(100);
    
    res.render('admin/inquiries', {
      title: 'Recent Inquiries',
      inquiries,
    });
  } catch (error) {
    console.error('Inquiries error:', error);
    res.status(500).render('error', { error: 'Error loading inquiries', title: 'Error' });
  }
};

exports.deleteInquiry = async (req, res) => {
  try {
    await Inquiry.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete inquiry error:', error);
    res.status(500).json({ success: false, message: 'Error deleting inquiry' });
  }
};

exports.markInquiryRead = async (req, res) => {
  try {
    await Inquiry.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (error) {
    console.error('Mark inquiry read error:', error);
    res.status(500).json({ success: false, message: 'Error updating inquiry' });
  }
};

