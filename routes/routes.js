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
    db.all(`SELECT * FROM reviews`, (err, reviews) => {
        if (err) {
            return res.send('Error fetching reviews: ' + err.message);
        }

        // Separating reviews by type
        const videoGameReviews = reviews.filter(review => review.type === 'video_game');
        const movieReviews = reviews.filter(review => review.type === 'movie');

        // Rendering the dashboard with the separated reviews
        res.render('dashboard', {
            username: req.session.user.username,
            videoGameReviews: videoGameReviews,
            movieReviews: movieReviews
        });
    });
});


// Logout handler
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// Review handling routes
router.get('/add-review', ensureAuthenticated, (req, res) => {
    res.render('add-review');
});

router.post('/reviews', ensureAuthenticated, (req, res) => {
    const { name, type, content, rating, company_name, theme } = req.body;
    const userId = req.session.user.id;

    db.run(
        `INSERT INTO reviews (user_id, name, type, content, rating, company_name, theme) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, name, type, content, rating, company_name, theme],
        (err) => {
            if (err) {
                return res.send('Error adding review: ' + err.message);
            }
            res.redirect('/dashboard');
        }
    );
});

// View all reviews for the logged-in user
router.get('/reviews', ensureAuthenticated, (req, res) => {
    const userId = req.session.user.id;

    db.all(`SELECT * FROM reviews WHERE user_id = ?`, [userId], (err, rows) => {
        if (err) {
            return res.send('Error fetching reviews: ' + err.message);
        }
        res.render('reviews', { reviews: rows });
    });
});

// Handling delete & update routes

router.post('/reviews/delete/:id', ensureAuthenticated, (req, res) => {
    const reviewId = req.params.id;
    db.run(`DELETE FROM reviews WHERE id = ?`, [reviewId], (err) => {
        if (err) {
            return res.send('Error deleting review: ' + err.message);
        }
        res.redirect('/dashboard');
    });
});

router.get('/reviews/update/:id', ensureAuthenticated, (req, res) => {
    const reviewId = req.params.id;
    db.get(`SELECT * FROM reviews WHERE id = ?`, [reviewId], (err, review) => {
        if (err) {
            return res.send('Error fetching review: ' + err.message);
        }
        res.render('updateReview', { review: review });
    });
});


router.post('/reviews/update/:id', ensureAuthenticated, (req, res) => {
    const reviewId = req.params.id;
    const { name, type, content, rating, company_name, theme } = req.body;

    db.run(
        `UPDATE reviews SET name = ?, type = ?, content = ?, rating = ?, company_name = ?, theme = ? WHERE id = ?`,
        [name, type, content, rating, company_name, theme, reviewId],
        (err) => {
            if (err) {
                return res.send('Error updating review: ' + err.message);
            }
            res.redirect('/reviews');
        }
    );
});

module.exports = router;