const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Public routes
router.get('/', publicController.getHome);
router.get('/about', publicController.getAbout);
router.get('/contact', publicController.getContact);
router.get('/products', publicController.getProducts);
router.get('/products/:id', publicController.getProduct);
router.get('/portfolio', publicController.getPortfolio);

// Form submission
router.post('/inquiry', publicController.submitInquiry);

module.exports = router;

