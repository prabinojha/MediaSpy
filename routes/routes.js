const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database');

// Debugging middleware
router.use((req, res, next) => {
    next();
});

// Middleware to redirect logged-in users
function redirectIfLoggedIn(req, res, next) {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    next();
}

// Middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/');
    }
    next();
}

// Login page
router.get('/', redirectIfLoggedIn, (req, res) => {
    res.render('login');
});

router.get('/login', redirectIfLoggedIn, (req, res) => {
    res.render('login');
});

// Login handler
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) return res.send('Database error.');
        if (!user) return res.send('Invalid username or password.');

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.send('Invalid username or password.');

        req.session.user = { id: user.id, username: user.username }; // Store user info in session
        res.redirect('/dashboard');
    });
});

// Register page
router.get('/register', redirectIfLoggedIn, (req, res) => {
    res.render('register');
});

// Register handler
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
        if (err) return res.send('Username already exists.');
        res.redirect('/');
    });
});

// Dashboard
router.get('/dashboard', ensureAuthenticated, (req, res) => {
    res.render('dashboard', { username: req.session.user.username });
});

// Logout handler
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

module.exports = router;