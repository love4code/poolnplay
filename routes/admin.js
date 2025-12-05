const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, redirectIfAuth } = require('../middleware/auth');

// Test endpoint to check session
router.get('/test-session', (req, res) => {
  // Try setting a test cookie
  res.cookie('test-cookie', 'test-value', {
    maxAge: 1000 * 60 * 60,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });
  
  res.json({
    sessionID: req.sessionID,
    isAdmin: req.session.isAdmin,
    session: req.session,
    cookies: req.cookies,
    headers: {
      cookie: req.headers.cookie,
    },
    message: 'Test cookie set. Refresh and check if test-cookie appears in cookies.',
  });
});

// Test endpoint to set session manually
router.get('/test-set-session', (req, res) => {
  req.session.isAdmin = true;
  req.session.test = 'This is a test';
  
  console.log('=== TEST SET SESSION ===');
  console.log('Session ID before save:', req.sessionID);
  console.log('Session data before save:', req.session);
  
  // Mark session as modified
  req.session.touch();
  
  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
      return res.json({ error: 'Session save failed', err: err.message });
    }
    
    console.log('Session saved. ID:', req.sessionID);
    
    // Check response headers AFTER save but BEFORE sending response
    // Use a hook to check headers when response is sent
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const headers = this.getHeaders();
      console.log('=== RESPONSE BEING SENT ===');
      console.log('All headers:', Object.keys(headers));
      if (headers['set-cookie']) {
        console.log('✅ Set-Cookie header:', headers['set-cookie']);
      } else {
        console.log('❌ Set-Cookie header MISSING in response!');
      }
      originalEnd.call(this, chunk, encoding);
    };
    
    res.json({
      success: true,
      sessionID: req.sessionID,
      session: req.session,
      message: 'Session set. Check logs for Set-Cookie header. Then visit /admin/test-session.',
    });
  });
});

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

