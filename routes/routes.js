const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Helper Function to calculate average (relies on the database)
const calculateAverageRating = (contentName, contentType) => {
    return new Promise((resolve, reject) => {
        db.all(
            'SELECT rating FROM reviews WHERE name = ? AND type = ?',
            [contentName, contentType],
            (err, rows) => {
                if (err) {
                    console.error('Error calculating average rating:', err);
                    return reject(err);
                }

                if (rows.length === 0) {
                    return resolve(0);
                }

                const total = rows.reduce((sum, row) => sum + row.rating, 0);
                const average = total / rows.length;

                resolve(Number.isInteger(average) ? average : average.toFixed(1));
            }
        );
    });
};


// Middleware passing variables to all routes
router.use((req, res, next) => {
    res.locals.isLoggedIn = req.session && req.session.user ? true : false;
    next();
});

// Middleware to redirect logged in users
function redirectIfLoggedIn(req, res, next) {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    next();
}

// Middleware to make sure user is authenticated
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

        req.session.user = { id: user.id, username: user.username };
        res.redirect('/dashboard');
    });
});

// Register page
router.get('/register', redirectIfLoggedIn, (req, res) => {
    res.render('register');
});

// Creating account handler
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
        if (err) return res.send('Username already exists.');
        res.redirect('/login');
    });
});

// Dashboard (main-page) handling
router.get('/dashboard', async (req, res) => {
    const movieQuery = `SELECT * FROM reviews WHERE type = 'movie'`;
    const videoGameQuery = `SELECT * FROM reviews WHERE type = 'video_game'`;

    let movieReviews = [];
    let videoGameReviews = [];

    db.all(movieQuery, async (err, movies) => {
        if (err) {
            console.error('Error fetching movie reviews:', err);
            return res.status(500).send('Internal Server Error');
        }
        movieReviews = await Promise.all(
            movies.map(async (movie) => ({
                ...movie,
                averageRating: await calculateAverageRating(movie.name, 'movie'),
            }))
        );

        db.all(videoGameQuery, async (err, games) => {
            if (err) {
                console.error('Error fetching video game reviews:', err);
                return res.status(500).send('Internal Server Error');
            }
            videoGameReviews = await Promise.all(
                games.map(async (game) => ({
                    ...game,
                    averageRating: await calculateAverageRating(game.name, 'video_game'),
                }))
            );

            res.render('dashboard', {
                username: req.session?.user?.username || null,
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
router.get('/add-review', (req, res) => {
    const { name, type, age, company_name, theme, image_path } = req.query;
    res.render('add-review', {
        prefill: { name, type, age, company_name, theme, image_path },
    });
});

// Image storage handling
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Route to handle adding reviews
router.post('/reviews', ensureAuthenticated, upload.single('image'), async (req, res) => {
    try {
        const { name, type, age, content, rating, company_name, theme } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        // Set reviewItem to true if an image is uploaded, otherwise false
        const reviewItem = req.file ? true : false;

        const query = `
            INSERT INTO reviews (name, type, age, content, rating, company_name, theme, user_id, username, image_path, reviewItem)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            name,
            type,
            age,
            content,
            rating,
            company_name,
            theme,
            req.session.user.id,
            req.session.user.username,
            imagePath,
            reviewItem
        ];

        db.run(query, values, function (err) {
            if (err) {
                console.error('Error adding review:', err.message);
                return res.status(500).send('Error adding review');
            }
            res.redirect('/dashboard');
        });
    } catch (error) {
        console.error('Error adding review:', error.message);
        res.status(500).send('Error adding review');
    }
});


// View all reviews for the logged-in user
router.get('/reviews', ensureAuthenticated, (req, res) => {
    const userId = req.session.user.id;

    const sql = `
        SELECT * FROM reviews 
        WHERE user_id = ? AND reviewItem = FALSE
    `;

    db.all(sql, [userId], (err, rows) => {
        if (err) {
            return res.send('Error fetching reviews: ' + err.message);
        }
        res.render('reviews', { reviews: rows });
    });
});

// Handling delete & update routes
router.post('/reviews/delete/:id', ensureAuthenticated, (req, res) => {
    const reviewId = req.params.id;

    db.get(`SELECT image_path FROM reviews WHERE id = ?`, [reviewId], (err, row) => {
        if (err) {
            return res.send('Error retrieving review: ' + err.message);
        }
        if (row && row.image_path) {
            const filePath = path.join(__dirname, '..', row.image_path);
            console.log(filePath);

            fs.unlink(filePath, (fsErr) => {
                if (fsErr && fsErr.code !== 'ENOENT') {
                    console.error('Error deleting file:', fsErr.message);
                }
            });
        }

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
    const { name, type, age, content, rating, company_name, theme } = req.body;

    db.run(
        `UPDATE reviews SET name = ?, type = ?, age = ?, content = ?, rating = ?, company_name = ?, theme = ? WHERE id = ?`,
        [name, type, age, content, rating, company_name, theme, reviewId],
        (err) => {
            if (err) {
                return res.send('Error updating review: ' + err.message);
            }
            res.redirect('/reviews');
        }
    );
});

// Handling route to each individual review page
router.get('/view-content/:id', async function (req, res) {
    const reviewId = req.params.id;

    // Fetch the specific review by ID
    db.get(`SELECT * FROM reviews WHERE id = ?`, [reviewId], async (err, review) => {
        if (err) {
            return res.send('Error fetching review: ' + err.message);
        }

        if (!review) {
            return res.status(404).send('Review not found');
        }

        try {
            // Calculate the average rating for the content
            const averageRating = await calculateAverageRating(review.name, review.type);

            // Fetch all reviews for the same content
            db.all(`SELECT * FROM reviews WHERE name = ?`, [review.name], (err, reviews) => {
                if (err) {
                    return res.send('Error fetching personal reviews: ' + err.message);
                }

                // Render the view-content template with data
                res.render('view-content', {
                    review,  // Pass the single review data
                    reviews, // Pass the list of reviews
                    averageRating, // Pass the calculated average rating
                });
            });
        } catch (error) {
            res.send('Error calculating average rating: ' + error.message);
        }
    });
});



// Search Handling
router.get('/search', (req, res) => {
    const query = req.query.query.trim().toLowerCase();

    if (!query) {
        return res.redirect('/dashboard');
    }

    const movieQuery = `SELECT * FROM reviews WHERE type = 'movie' AND name LIKE ? AND reviewItem = TRUE`;
    const videoGameQuery = `SELECT * FROM reviews WHERE type = 'video_game' AND name LIKE ? AND reviewItem = TRUE`;

    db.all(movieQuery, [`%${query}%`], (err, movieResults) => {
        if (err) {
            console.error('Error fetching movie data:', err);
            return res.status(500).send('Internal Server Error');
        }

        db.all(videoGameQuery, [`%${query}%`], (err, videoGameResults) => {
            if (err) {
                console.error('Error fetching video game data:', err);
                return res.status(500).send('Internal Server Error');
            }

            res.render('search', {
                query: query,
                movieResults: movieResults,
                videoGameResults: videoGameResults
            });
        });
    });
});

// Server-side route for search suggestions
router.get('/search-suggestions', (req, res) => {
    const query = req.query.query.trim().toLowerCase();

    if (!query) {
        return res.json({ movieResults: [], videoGameResults: [] });
    }

    const movieQuery = `SELECT * FROM reviews WHERE type = 'movie' AND name LIKE ? AND reviewItem = TRUE`;
    const videoGameQuery = `SELECT * FROM reviews WHERE type = 'video_game' AND name LIKE ? AND reviewItem = TRUE`;

    db.all(movieQuery, [`%${query}%`], (err, movieResults) => {
        if (err) {
            console.error('Error fetching movie data:', err);
            return res.status(500).send('Internal Server Error');
        }

        db.all(videoGameQuery, [`%${query}%`], (err, videoGameResults) => {
            if (err) {
                console.error('Error fetching video game data:', err);
                return res.status(500).send('Internal Server Error');
            }

            res.json({ movieResults, videoGameResults });
        });
    });
});

router.get('/reviews/search', (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).send({ error: 'Query parameter is required' });
    }

    const sql = `
        SELECT name, type, age, company_name, theme, image_path 
        FROM reviews 
        WHERE reviewItem = TRUE AND name LIKE ?
        LIMIT 5
    `;
    const params = [`%${query}%`];

    db.all(sql, params, (err, reviews) => {
        if (err) {
            console.error('Error fetching reviews:', err);
            return res.status(500).send({ error: 'Internal Server Error' });
        }

        res.json(reviews);
    });
});


module.exports = router;