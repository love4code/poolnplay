// Admin authentication middleware
exports.requireAuth = (req, res, next) => {
  console.log('=== AUTH CHECK ===');
  console.log('Session ID:', req.sessionID);
  console.log('isAdmin:', req.session.isAdmin);
  console.log('Session data:', JSON.stringify(req.session));
  console.log('Cookie header:', req.headers.cookie);
  console.log('All cookies:', req.cookies);
  console.log('Signed cookies:', req.signedCookies);
  
  if (req.session && req.session.isAdmin === true) {
    console.log('Auth passed - allowing access');
    return next();
  }
  
  console.log('Auth failed - redirecting to login');
  console.log('Reason: isAdmin is', req.session ? req.session.isAdmin : 'session is null');
  res.redirect('/admin/login');
};

// Login check (redirect if already logged in)
exports.redirectIfAuth = (req, res, next) => {
  if (req.session.isAdmin) {
    return res.redirect('/admin');
  }
  next();
};

