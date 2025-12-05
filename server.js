require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const path = require('path');

const app = express();

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/poolnplay';

if (!process.env.MONGODB_URI) {
  console.warn('WARNING: MONGODB_URI not set. Using default local MongoDB.');
}

// Configure mongoose to not crash on connection errors
mongoose.set('strictQuery', false);

// Connect with options to handle errors gracefully
mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('MongoDB connected successfully');
  console.log('Database:', mongoose.connection.name);
})
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  console.error('Error code:', err.code);
  if (err.code === 'ENOTFOUND') {
    console.error('DNS lookup failed. Check your MongoDB connection string.');
    console.error('Your connection string should look like:');
    console.error('mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database');
  }
  console.error('Make sure MONGODB_URI is set correctly in your environment variables.');
  console.error('The app will continue running, but database operations will fail.');
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

// Only use MongoDB store if we have a valid connection string
if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('mongodb')) {
  try {
    sessionStore = MongoStore.create({
      mongoUrl: mongoUri,
      touchAfter: 24 * 3600, // lazy session update
      ttl: 24 * 60 * 60, // 24 hours
    });

    sessionStore.on('error', (error) => {
      console.error('Session store error:', error.message);
      console.warn('Sessions will be stored in memory instead');
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
  console.warn('MONGODB_URI not set or invalid. Using memory store for sessions.');
  console.warn('Note: Sessions will be lost on app restart.');
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: sessionStore, // null = memory store
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'lax',
  },
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make user session available to all views
app.use((req, res, next) => {
  res.locals.isAdmin = req.session.isAdmin || false;
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

