require('dotenv').config();

const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');

const pool = require('./db/pool');

const app = express();
app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(
  session({
    store: new pgSession({
      pool,
      tableName: 'user_sessions',
      createTableIfMissing: true
    }),

    secret: process.env.SESSION_SECRET,

    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

// Global template helpers
app.locals.money = (value) =>
  Number(value || 0).toLocaleString('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2
  });

app.locals.dateDisplay = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : '';

// Make logged-in user available to all EJS templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/dashboard'));
app.use('/transactions', require('./routes/transactions'));

// 404
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page not found',
    message: 'The page you requested does not exist.'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).render('error', {
    title: 'Server error',
    message: 'Something went wrong. Please try again.'
  });
});

module.exports = app;
