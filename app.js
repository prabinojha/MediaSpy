const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('./database');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: '_',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));
app.set('view engine', 'ejs');

// Debugging middleware
app.use((req, res, next) => {
    console.log('Session data:', req.session);
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

// Routes
// Login page
app.get('/', redirectIfLoggedIn, (req, res) => {
    res.render('login');
});

// Login handler
app.post('/login', (req, res) => {
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
app.get('/register', redirectIfLoggedIn, (req, res) => {
    res.render('register');
});

// Register handler
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
        if (err) return res.send('Username already exists.');
        res.redirect('/');
    });
});

// Dashboard
app.get('/dashboard', ensureAuthenticated, (req, res) => {
    res.render('dashboard', { username: req.session.user.username });
});

// Logout handler
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

app.listen(3000);