const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, redirectIfAuth } = require('../middleware/auth');

// Auth routes
router.get('/login', redirectIfAuth, adminController.getLogin);
router.post('/login', redirectIfAuth, adminController.postLogin);
router.get('/logout', adminController.logout);

// Protected routes
router.use(requireAuth);

router.get('/', adminController.getDashboard);

// Media routes
router.get('/media', adminController.getMedia);
router.post('/media/upload', adminController.uploadMedia);
router.delete('/media/:id', adminController.deleteMedia);

// Service routes
router.get('/services', adminController.getServices);
router.get('/services/new', adminController.getServiceForm);
router.get('/services/:id/edit', adminController.getServiceForm);
router.post('/services', adminController.saveService);
router.put('/services/:id', adminController.saveService);
router.delete('/services/:id', adminController.deleteService);

// Project routes
router.get('/projects', adminController.getProjects);
router.get('/projects/new', adminController.getProjectForm);
router.get('/projects/:id/edit', adminController.getProjectForm);
router.post('/projects', adminController.saveProject);
router.put('/projects/:id', adminController.saveProject);
router.delete('/projects/:id', adminController.deleteProject);

// Product routes
router.get('/products', adminController.getProducts);
router.get('/products/new', adminController.getProductForm);
router.get('/products/:id/edit', adminController.getProductForm);
router.post('/products', adminController.saveProduct);
router.put('/products/:id', adminController.saveProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Settings routes
router.get('/settings', adminController.getSettings);
router.post('/settings', adminController.saveSettings);

// Inquiry routes
router.get('/inquiries', adminController.getInquiries);
router.delete('/inquiries/:id', adminController.deleteInquiry);
router.put('/inquiries/:id/read', adminController.markInquiryRead);

module.exports = router;

