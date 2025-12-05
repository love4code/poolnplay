// Admin authentication middleware
exports.requireAuth = (req, res, next) => {
  if (req.session.isAdmin) {
    return next();
  }
  res.redirect('/admin/login');
};

// Login check (redirect if already logged in)
exports.redirectIfAuth = (req, res, next) => {
  if (req.session.isAdmin) {
    return res.redirect('/admin');
  }
  next();
};

