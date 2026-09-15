require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const pool = require('./db/pool');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'development-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 8 }
}));

app.locals.money = (value) => Number(value || 0).toLocaleString('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2 });
app.locals.dateDisplay = (value) => value ? new Date(value).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '';

app.use((req, res, next) => { res.locals.user = req.session.user || null; next(); });

app.use('/', require('./routes/auth'));
app.use('/', require('./routes/dashboard'));
app.use('/transactions', require('./routes/transactions'));

app.use((req, res) => res.status(404).render('error', { title: 'Page not found', message: 'The page you requested does not exist.' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { title: 'Server error', message: 'Something went wrong. Please try again.' });
});

const port = process.env.PORT || 3000;
pool.query('SELECT 1').then(() => {
  app.listen(port, () => console.log(`Expense Tracker running at http://localhost:${port}`));
}).catch(err => {
  console.error('Database connection failed:', err.message);
  process.exit(1);
});

module.exports = { app, pool };
