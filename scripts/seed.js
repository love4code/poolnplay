require('dotenv').config();
const mongoose = require('mongoose');
const Settings = require('../models/Settings');
const Service = require('../models/Service');
const Product = require('../models/Product');
const Project = require('../models/Project');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/poolnplay')
.then(() => {
  console.log('MongoDB connected for seeding');
  seedDatabase();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function seedDatabase() {
  try {
    console.log('Starting database seed...');

    // Create default settings
    console.log('Creating default settings...');
    const settings = await Settings.getSettings();
    if (!settings.companyName || settings.companyName === 'Pool N Play') {
      settings.companyName = 'Pool N Play';
      settings.companyAddress = '123 Pool Street, Water City, ST 12345';
      settings.companyPhone = '(555) 123-4567';
      settings.companyEmail = 'info@poolnplay.com';
      settings.defaultSeoTitle = 'Pool N Play - Professional Pool Installation & Services';
      settings.defaultSeoDescription = 'Expert pool installation, liner replacement, and pool services. Quality above-ground pools and professional service.';
      await settings.save();
      console.log('✓ Settings created');
    } else {
      console.log('✓ Settings already exist');
    }

    // Create sample services
    console.log('Creating sample services...');
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      const services = [
        {
          name: 'Pool Installation',
          description: 'Professional above-ground pool installation with expert craftsmanship and attention to detail.',
          icon: 'bi-water',
          featured: true,
          order: 1,
          active: true,
        },
        {
          name: 'Liner Replacement',
          description: 'Quality liner replacement services to keep your pool looking fresh and leak-free.',
          icon: 'bi-palette',
          featured: true,
          order: 2,
          active: true,
        },
        {
          name: 'Pool Maintenance',
          description: 'Regular maintenance and service calls to keep your pool in perfect condition year-round.',
          icon: 'bi-tools',
          featured: true,
          order: 3,
          active: true,
        },
        {
          name: 'Pool Repair',
          description: 'Expert repair services for all types of pool issues and equipment problems.',
          icon: 'bi-wrench',
          featured: false,
          order: 4,
          active: true,
        },
      ];

      await Service.insertMany(services);
      console.log(`✓ Created ${services.length} services`);
    } else {
      console.log(`✓ ${serviceCount} services already exist`);
    }

    // Create sample products
    console.log('Creating sample products...');
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const products = [
        {
          name: 'Classic Above Ground Pool',
          description: 'Our most popular above-ground pool model, perfect for families. Features durable construction and easy maintenance. Available in multiple sizes to fit your backyard.',
          price: 2499.99,
          sizes: ['12x24', '15x30', '18x36', '21x41'],
          active: true,
          seoTitle: 'Classic Above Ground Pool - Pool N Play',
          seoDescription: 'Quality above-ground pool in multiple sizes. Perfect for families looking for an affordable pool solution.',
        },
        {
          name: 'Premium Pool Package',
          description: 'Upgrade to our premium pool package with enhanced features including better filtration, premium liner, and extended warranty. The ultimate pool experience.',
          price: 3499.99,
          sizes: ['15x30', '18x36', '21x41', '24x48'],
          active: true,
          seoTitle: 'Premium Pool Package - Pool N Play',
          seoDescription: 'Premium above-ground pool package with enhanced features and extended warranty.',
        },
        {
          name: 'Economy Pool',
          description: 'Affordable pool solution without compromising on quality. Great for smaller spaces and budget-conscious customers.',
          price: 1799.99,
          sizes: ['12x24', '15x30'],
          active: true,
          seoTitle: 'Economy Above Ground Pool - Pool N Play',
          seoDescription: 'Affordable above-ground pool perfect for smaller spaces and budget-conscious customers.',
        },
      ];

      await Product.insertMany(products);
      console.log(`✓ Created ${products.length} products`);
    } else {
      console.log(`✓ ${productCount} products already exist`);
    }

    // Create sample projects
    console.log('Creating sample projects...');
    const projectCount = await Project.countDocuments();
    if (projectCount === 0) {
      const projects = [
        {
          title: 'Modern Family Pool Installation',
          description: 'Beautiful 18x36 pool installation in suburban backyard. Completed with decking and landscaping.',
          featured: true,
          order: 1,
          active: true,
          seoTitle: 'Modern Family Pool Installation - Pool N Play Portfolio',
          seoDescription: 'See our completed 18x36 pool installation project with decking and landscaping.',
        },
        {
          title: 'Luxury Pool Renovation',
          description: 'Complete pool renovation including new liner, updated filtration system, and modern accessories.',
          featured: true,
          order: 2,
          active: true,
          seoTitle: 'Luxury Pool Renovation - Pool N Play Portfolio',
          seoDescription: 'Complete pool renovation project with new liner and modern filtration system.',
        },
        {
          title: 'Compact Pool Solution',
          description: 'Perfect 12x24 pool installation for smaller yards. Maximized space with beautiful results.',
          featured: true,
          order: 3,
          active: true,
          seoTitle: 'Compact Pool Solution - Pool N Play Portfolio',
          seoDescription: 'Compact 12x24 pool installation perfect for smaller yards.',
        },
        {
          title: 'Premium Pool with Deck',
          description: '21x41 premium pool with custom decking and premium features. A stunning backyard transformation.',
          featured: true,
          order: 4,
          active: true,
          seoTitle: 'Premium Pool with Deck - Pool N Play Portfolio',
          seoDescription: 'Premium 21x41 pool installation with custom decking and premium features.',
        },
      ];

      await Project.insertMany(projects);
      console.log(`✓ Created ${projects.length} projects`);
    } else {
      console.log(`✓ ${projectCount} projects already exist`);
    }

    console.log('\n✓ Database seeding completed successfully!');
    console.log('\nYou can now:');
    console.log('1. Start the server: npm start');
    console.log('2. Access admin panel: http://localhost:3000/admin/login');
    console.log('   Default credentials: admin / admin123 (change in .env)');
    console.log('3. Upload images in the admin media library');
    console.log('4. Customize settings, services, products, and projects');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

