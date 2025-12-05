const mongoose = require('mongoose');
const Settings = require('../models/Settings');
const Service = require('../models/Service');
const Project = require('../models/Project');
const Product = require('../models/Product');
const Inquiry = require('../models/Inquiry');
const Media = require('../models/Media');
const nodemailer = require('nodemailer');

// Helper function to get settings with fallback
const getSettingsSafe = async () => {
  if (mongoose.connection.readyState !== 1) {
    return {
      companyName: 'Pool N Play',
      companyAddress: '',
      companyPhone: '',
      companyEmail: '',
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      youtube: '',
      defaultSeoTitle: 'Pool N Play - Professional Pool Installation & Services',
      defaultSeoDescription: 'Expert pool installation, liner replacement, and pool services.',
      primaryColor: '#0d6efd',
      secondaryColor: '#6c757d',
      heroImage: null,
    };
  }
  try {
    return await Settings.getSettings();
  } catch (error) {
    console.error('Error getting settings:', error);
    return {
      companyName: 'Pool N Play',
      companyAddress: '',
      companyPhone: '',
      companyEmail: '',
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      youtube: '',
      defaultSeoTitle: 'Pool N Play - Professional Pool Installation & Services',
      defaultSeoDescription: 'Expert pool installation, liner replacement, and pool services.',
      primaryColor: '#0d6efd',
      secondaryColor: '#6c757d',
      heroImage: null,
    };
  }
};

// Email transporter setup
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send inquiry email
const sendInquiryEmail = async (inquiryData) => {
  try {
    const transporter = createTransporter();
    const emailTo = process.env.EMAIL_TO || 'markagrover85@gmail.com';
    
    const poolSizesText = inquiryData.poolSizes && inquiryData.poolSizes.length > 0
      ? `\nPool Sizes Selected: ${inquiryData.poolSizes.join(', ')}`
      : '';
    
    const productInfo = inquiryData.productName
      ? `\nProduct: ${inquiryData.productName}`
      : '';
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: emailTo,
      subject: `New Inquiry: ${inquiryData.service}`,
      html: `
        <h2>New Inquiry Received</h2>
        <p><strong>Name:</strong> ${inquiryData.name}</p>
        <p><strong>Town:</strong> ${inquiryData.town}</p>
        <p><strong>Phone:</strong> ${inquiryData.phone}</p>
        <p><strong>Email:</strong> ${inquiryData.email}</p>
        <p><strong>Service:</strong> ${inquiryData.service}</p>
        ${productInfo}
        ${poolSizesText}
        ${inquiryData.message ? `<p><strong>Message:</strong> ${inquiryData.message}</p>` : ''}
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      `,
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

// Home page
exports.getHome = async (req, res) => {
  try {
    const settings = await getSettingsSafe();
    
    let featuredServices = [];
    let featuredProjects = [];
    let featuredProducts = [];
    let heroImage = null;
    
    // Log connection state for debugging
    const connectionState = mongoose.connection.readyState;
    const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    console.log(`MongoDB connection state: ${connectionState} (${states[connectionState] || 'unknown'})`);
    
    // Try to fetch data - attempt even if not fully connected (might be connecting)
    try {
      if (mongoose.connection.readyState === 1) {
        console.log('MongoDB connected, fetching data...');
        
        featuredServices = await Service.find({ featured: true, active: true })
          .sort({ order: 1 })
          .limit(3)
          .catch((err) => {
            console.error('Error fetching services:', err.message);
            return [];
          });
        console.log(`Fetched ${featuredServices.length} services`);
        
        featuredProjects = await Project.find({ active: true })
          .sort({ createdAt: -1 })
          .limit(4)
          .populate('images')
          .catch((err) => {
            console.error('Error fetching projects:', err.message);
            return [];
          });
        console.log(`Fetched ${featuredProjects.length} projects`);
        
        featuredProducts = await Product.find({ active: true })
          .sort({ createdAt: -1 })
          .limit(4)
          .populate('featuredImage')
          .catch((err) => {
            console.error('Error fetching products:', err.message);
            return [];
          });
        console.log(`Fetched ${featuredProducts.length} products`);
        
        if (settings.heroImage) {
          heroImage = await Media.findById(settings.heroImage).catch((err) => {
            console.error('Error fetching hero image:', err.message);
            return null;
          });
        }
      } else {
        console.warn(`MongoDB not connected (state: ${connectionState}). Data will not be loaded.`);
        console.warn('Check your MONGODB_URI environment variable and MongoDB connection.');
      }
    } catch (dbError) {
      console.error('Database query error:', dbError);
      // Continue with empty arrays - don't crash the page
    }
    
    res.render('public/home', {
      title: settings.defaultSeoTitle,
      description: settings.defaultSeoDescription,
      settings,
      services: featuredServices,
      projects: featuredProjects,
      products: featuredProducts,
      heroImage,
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.status(500).render('error', { error: 'Error loading home page', title: 'Error' });
  }
};

// About page
exports.getAbout = async (req, res) => {
  try {
    const settings = await getSettingsSafe();
    res.render('public/about', {
      title: 'About Us - Pool N Play',
      description: 'Learn about Pool N Play and our commitment to quality pool services.',
      settings,
    });
  } catch (error) {
    console.error('About page error:', error);
    res.status(500).render('error', { error: 'Error loading about page', title: 'Error' });
  }
};

// Contact page
exports.getContact = async (req, res) => {
  try {
    const settings = await getSettingsSafe();
    res.render('public/contact', {
      title: 'Contact Us - Pool N Play',
      description: 'Get in touch with Pool N Play for all your pool installation and service needs.',
      settings,
    });
  } catch (error) {
    console.error('Contact page error:', error);
    res.status(500).render('error', { error: 'Error loading contact page', title: 'Error' });
  }
};

// Products list page
exports.getProducts = async (req, res) => {
  try {
    const settings = await getSettingsSafe();
    
    let products = [];
    if (mongoose.connection.readyState === 1) {
      products = await Product.find({ active: true })
        .sort({ createdAt: -1 })
        .populate('featuredImage')
        .catch(() => []);
    }
    
    res.render('public/products', {
      title: 'Our Products - Pool N Play',
      description: 'Browse our selection of quality pool products.',
      settings,
      products,
    });
  } catch (error) {
    console.error('Products page error:', error);
    res.status(500).render('error', { error: 'Error loading products page', title: 'Error' });
  }
};

// Single product page
exports.getProduct = async (req, res) => {
  try {
    const settings = await getSettingsSafe();
    
    if (mongoose.connection.readyState !== 1) {
      return res.status(404).render('error', { error: 'Product not found', title: '404' });
    }
    
    const product = await Product.findById(req.params.id).populate('featuredImage').catch(() => null);
    
    if (!product || !product.active) {
      return res.status(404).render('error', { error: 'Product not found', title: '404' });
    }
    
    res.render('public/product', {
      title: `${product.name} - Pool N Play`,
      description: product.seoDescription || product.description.substring(0, 160),
      settings,
      product,
    });
  } catch (error) {
    console.error('Product page error:', error);
    res.status(500).render('error', { error: 'Error loading product page', title: 'Error' });
  }
};

// Portfolio page
exports.getPortfolio = async (req, res) => {
  try {
    const settings = await getSettingsSafe();
    
    let projects = [];
    if (mongoose.connection.readyState === 1) {
      projects = await Project.find({ active: true })
        .sort({ order: 1, createdAt: -1 })
        .populate('images')
        .catch(() => []);
    }
    
    res.render('public/portfolio', {
      title: 'Our Portfolio - Pool N Play',
      description: 'View our completed pool installation and service projects.',
      settings,
      projects,
    });
  } catch (error) {
    console.error('Portfolio page error:', error);
    res.status(500).render('error', { error: 'Error loading portfolio page', title: 'Error' });
  }
};

// Single project page
exports.getProject = async (req, res) => {
  try {
    const settings = await getSettingsSafe();
    
    if (mongoose.connection.readyState !== 1) {
      return res.status(404).render('error', { error: 'Project not found', title: '404' });
    }
    
    const project = await Project.findById(req.params.id).populate('images').catch(() => null);
    
    if (!project || !project.active) {
      return res.status(404).render('error', { error: 'Project not found', title: '404' });
    }
    
    res.render('public/project', {
      title: `${project.title} - Pool N Play`,
      description: project.seoDescription || project.description.substring(0, 160),
      settings,
      project,
    });
  } catch (error) {
    console.error('Project page error:', error);
    res.status(500).render('error', { error: 'Error loading project page', title: 'Error' });
  }
};

// Submit inquiry (from any form)
exports.submitInquiry = async (req, res) => {
  try {
    const { name, town, phone, email, service, poolSizes, message, productId } = req.body;
    
    // Validate required fields
    if (!name || !town || !phone || !email || !service) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please fill in all required fields.' 
      });
    }
    
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      // Still try to send email even if MongoDB is down
      try {
        await sendInquiryEmail({
          name,
          town,
          phone,
          email,
          service,
          poolSizes: poolSizes ? (Array.isArray(poolSizes) ? poolSizes : [poolSizes]) : [],
          message: message || '',
          productName: null,
        });
        return res.json({ 
          success: true, 
          message: 'Thank you! Your inquiry has been received. We will contact you soon.' 
        });
      } catch (emailError) {
        console.error('Email send error:', emailError);
        return res.status(500).json({ 
          success: false, 
          message: 'Unable to submit inquiry at this time. Please try again later or contact us directly.' 
        });
      }
    }
    
    // Create inquiry
    const inquiry = new Inquiry({
      name,
      town,
      phone,
      email,
      service,
      poolSizes: poolSizes ? (Array.isArray(poolSizes) ? poolSizes : [poolSizes]) : [],
      message: message || '',
      productId: productId || null,
    });
    
    await inquiry.save();
    
    // Get product name if productId exists
    let productName = null;
    if (productId) {
      const product = await Product.findById(productId).catch(() => null);
      if (product) productName = product.name;
    }
    
    // Send email
    await sendInquiryEmail({
      ...inquiry.toObject(),
      productName,
    });
    
    res.json({ 
      success: true, 
      message: 'Thank you! Your inquiry has been submitted successfully.' 
    });
  } catch (error) {
    console.error('Inquiry submission error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred. Please try again later.' 
    });
  }
};

