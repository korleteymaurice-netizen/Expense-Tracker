const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');

router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }

  res.render('login', {
    title: 'Login',
    error: null
  });
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const result = await pool.query(
      'SELECT id, name, email, password FROM users WHERE email=$1',
      [email]
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).render('login', {
        title: 'Login',
        error: 'Invalid email or password.'
      });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    req.session.save((err) => {
      if (err) {
        console.error('SESSION SAVE ERROR:', err);
        return next(err);
      }

      res.redirect('/dashboard');
    });

  } catch (err) {
    next(err);
  }
});

router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }

  res.render('register', {
    title: 'Create account',
    error: null
  });
});

router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (
      name.length < 2 ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      password.length < 8
    ) {
      return res.status(400).render('register', {
        title: 'Create account',
        error: 'Enter a valid name, email and password of at least 8 characters.'
      });
    }

    const exists = await pool.query(
      'SELECT id FROM users WHERE email=$1',
      [email]
    );

    if (exists.rowCount) {
      return res.status(409).render('register', {
        title: 'Create account',
        error: 'An account with that email already exists.'
      });
    }

    const hash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      'INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING id,name,email',
      [name, email, hash]
    );

    req.session.user = result.rows[0];

    req.session.save((err) => {
      if (err) {
        console.error('SESSION SAVE ERROR:', err);
        return next(err);
      }

      res.redirect('/dashboard');
    });

  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
