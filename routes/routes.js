const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Debugging middleware
router.use((req, res, next) => {
    res.locals.isLoggedIn = req.session && req.session.user ? true : false;
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
        return res.redirect('/login');
    }
    next();
}

// Login page
router.get('/', (req, res) => {
    res.redirect('/dashboard');
});

router.get('/login', (req, res) => {
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

// Dashboard (accessible by both logged-in and non-logged-in users)
router.get('/dashboard', (req, res) => {
    const movieQuery = `SELECT * FROM reviews WHERE type = 'movie'`;
    const videoGameQuery = `SELECT * FROM reviews WHERE type = 'video_game'`;

    let movieReviews = [];
    let videoGameReviews = [];

    db.all(movieQuery, (err, movies) => {
        if (err) {
            console.error('Error fetching movie reviews:', err);
            return res.status(500).send('Internal Server Error');
        }
        movieReviews = movies;

        db.all(videoGameQuery, (err, games) => {
            if (err) {
                console.error('Error fetching video game reviews:', err);
                return res.status(500).send('Internal Server Error');
            }
            videoGameReviews = games;

            res.render('dashboard', {
                username: req.session?.user?.username || null, // Show username only if logged in
                movieReviews,
                videoGameReviews,
            });
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

// Image storage handling
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save files in the uploads folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
    }
});

const upload = multer({ storage });

// Route to handle adding reviews
router.post('/reviews', ensureAuthenticated, upload.single('image'), async (req, res) => {
    try {
        const { name, type, content, rating, company_name, theme } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        const query = `
            INSERT INTO reviews (name, type, content, rating, company_name, theme, user_id, image_path)
            VALUES (? ,?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [name, type, content, rating, company_name, theme, req.session.user.id, imagePath];

        db.run(query, values);
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error adding review:', error.message);
        res.status(500).send('Error adding review');
    }
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

    // Step 1: Retrieve the image path from the database
    db.get(`SELECT image_path FROM reviews WHERE id = ?`, [reviewId], (err, row) => {
        if (err) {
            return res.send('Error retrieving review: ' + err.message);
        }

        // Step 2: If an image path exists, delete the file from the uploads folder
        if (row && row.image_path) {
            const filePath = path.join(__dirname, '..', row.image_path);
            console.log(filePath);

            fs.unlink(filePath, (fsErr) => {
                if (fsErr && fsErr.code !== 'ENOENT') {
                    // Log the error if it's not a "file not found" error
                    console.error('Error deleting file:', fsErr.message);
                }
            });
        }

        // Step 3: Delete the review from the database
        db.run(`DELETE FROM reviews WHERE id = ?`, [reviewId], (err) => {
            if (err) {
                return res.send('Error deleting review: ' + err.message);
            }
            res.redirect('/reviews');
        });
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

// Suggestions route
router.get('/suggestions', ensureAuthenticated, (req, res) => {
    const { name, type } = req.query; // The name and type from the user's input

    let query = `SELECT * FROM reviews WHERE name LIKE ?`;
    let params = [`%${name}%`];

    // If the type is specified, filter by it
    if (type) {
        query += ` AND type = ?`;
        params.push(type);
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Send back the matching reviews as suggestions
        const suggestions = rows.map(row => ({
            name: row.name,
            type: row.type,
            content: row.content,
            rating: row.rating,
            company_name: row.company_name,
            theme: row.theme
        }));
        res.json(suggestions);
    });
});

module.exports = router;