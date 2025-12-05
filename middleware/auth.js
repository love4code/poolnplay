// Admin authentication middleware
exports.requireAuth = (req, res, next) => {
  console.log('=== AUTH CHECK ===');
  console.log('Session ID:', req.sessionID);
  console.log('isAdmin:', req.session.isAdmin);
  console.log('Session data:', JSON.stringify(req.session));
  console.log('Cookie:', req.headers.cookie);
  
  if (req.session.isAdmin) {
    console.log('Auth passed - allowing access');
    return next();
  }
  
  console.log('Auth failed - redirecting to login');
  res.redirect('/admin/login');
};

// Login check (redirect if already logged in)
exports.redirectIfAuth = (req, res, next) => {
  if (req.session.isAdmin) {
    return res.redirect('/admin');
  }
  next();
};

