require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const path = require('path');

const app = express();

// CRITICAL: Trust Heroku's proxy for secure cookies
// This is required for sessions to work on Heroku
app.set('trust proxy', 1);

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/poolnplay';

if (!process.env.MONGODB_URI) {
  console.warn('WARNING: MONGODB_URI not set. Using default local MongoDB.');
}

// Configure mongoose to not crash on connection errors
mongoose.set('strictQuery', false);

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
  console.log('Database:', mongoose.connection.name);
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
  if (err.code === 'ENOTFOUND') {
    console.error('DNS lookup failed. Check your MongoDB connection string.');
    console.error('Your connection string should look like:');
    console.error('mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database');
  }
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Connect with options to handle errors gracefully
mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000,
})
.then(() => {
  // Connection successful - event handler will log
})
.catch(err => {
  console.error('❌ MongoDB initial connection failed:', err.message);
  console.error('Error code:', err.code);
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    console.error('\n📝 To fix this:');
    console.error('1. For local development: Start MongoDB locally or');
    console.error('2. Set MONGODB_URI environment variable to your MongoDB Atlas connection string');
    console.error('   Example: mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/database');
    console.error('\n💡 Create a .env file with: MONGODB_URI=your_connection_string');
  }
  console.error('\n⚠️  The app will continue running, but database operations will fail.');
  // Don't crash the app - let it continue without MongoDB
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
// Use memory store if MongoDB connection string is invalid or missing
let sessionStore = null;

// Check if MongoDB URI is valid (not a placeholder)
const hasMongoUri = process.env.MONGODB_URI && process.env.MONGODB_URI.includes('mongodb');
const hasPlaceholder = process.env.MONGODB_URI && (
  process.env.MONGODB_URI.includes('YOURCLUSTER') ||
  process.env.MONGODB_URI.includes('cluster.mongodb.net') || // Invalid format without cluster ID
  !process.env.MONGODB_URI.match(/cluster\d+\.\w+\.mongodb\.net/) // Doesn't match valid format
);

const isValidMongoUri = hasMongoUri && !hasPlaceholder;

// Only use MongoDB store if we have a valid connection string
if (isValidMongoUri) {
  try {
    sessionStore = MongoStore.create({
      mongoUrl: mongoUri,
      touchAfter: 24 * 3600, // lazy session update
      ttl: 24 * 60 * 60, // 24 hours
      autoRemove: 'native',
    });

    sessionStore.on('error', (error) => {
      console.error('Session store error:', error.message);
      console.warn('Session store will fall back to memory');
      // Don't set to null here - let it try to reconnect
    });

    sessionStore.on('connect', () => {
      console.log('Session store connected to MongoDB');
    });
  } catch (error) {
    console.error('Failed to create MongoDB session store:', error.message);
    console.warn('Using memory store for sessions');
    sessionStore = null;
  }
} else {
  console.warn('MONGODB_URI not set, invalid, or contains placeholder. Using memory store for sessions.');
  console.warn('Note: Sessions will be lost on app restart.');
  if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('YOURCLUSTER')) {
    console.error('ERROR: MONGODB_URI contains "YOURCLUSTER" placeholder. Please set a real MongoDB connection string.');
  }
}

// Session middleware - use memory store if MongoDB store failed
// If no store, express-session will use MemoryStore by default
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  name: 'connect.sid', // Explicitly use default name
  resave: false, // Only save if session was modified
  saveUninitialized: false, // Don't save uninitialized sessions
  rolling: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    secure: process.env.NODE_ENV === 'production', // Secure in production (Heroku uses HTTPS)
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  },
  // Ensure cookie is always set when session is saved
  genid: function(req) {
    return require('crypto').randomBytes(16).toString('hex');
  },
};

// Only set store if we have a valid MongoDB store
if (sessionStore) {
  sessionConfig.store = sessionStore;
  console.log('Session: Using MongoDB store');
} else {
  console.log('Session: Using default MemoryStore (sessions lost on restart)');
  // Don't set store - let express-session use default MemoryStore
}

app.use(session(sessionConfig));

// Log session store status
if (sessionStore) {
  console.log('Session: Using MongoDB store');
  sessionStore.on('error', (error) => {
    console.error('Session store error (will use memory):', error.message);
  });
} else {
  console.log('Session: Using default MemoryStore (sessions lost on restart)');
  console.log('Session cookie name:', sessionConfig.name || 'connect.sid (default)');
}

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to ensure session cookie is set
// This runs after session middleware
app.use((req, res, next) => {
  // Hook into response to check/ensure cookie is set
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    // Check if this is a response that should have a session cookie
    if (req.session && req.sessionID) {
      const headers = this.getHeaders();
      const setCookie = headers['set-cookie'] || this.getHeader('Set-Cookie');
      
      // If no Set-Cookie and session exists, log it
      if (!setCookie && req.path.startsWith('/admin')) {
        console.log('⚠️ WARNING: Session exists but no Set-Cookie header!');
        console.log('Session ID:', req.sessionID);
        console.log('Path:', req.path);
        console.log('Method:', req.method);
      }
    }
    originalEnd.call(this, chunk, encoding);
  };
  next();
});

// Make user session available to all views
app.use((req, res, next) => {
  res.locals.isAdmin = req.session.isAdmin || false;
  // Debug session on each request
  if (req.path.startsWith('/admin') && req.path !== '/admin/login') {
    console.log('Request to:', req.path);
    console.log('Session ID:', req.sessionID);
    console.log('Session isAdmin:', req.session.isAdmin);
  }
  next();
});

// Routes
app.use('/', require('./routes/public'));
app.use('/admin', require('./routes/admin'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).render('error', { 
    error: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message,
    title: 'Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    error: 'Page not found',
    title: '404 - Not Found'
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err.message);
  console.error('Stack:', err.stack);
  // Don't exit - let the app continue
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error('Stack:', err.stack);
  // Don't exit - let the app continue
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (!process.env.MONGODB_URI || !process.env.MONGODB_URI.includes('mongodb')) {
    console.warn('⚠️  MONGODB_URI not properly configured. Some features may not work.');
  }
});

