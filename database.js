const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./users.db');

// Initialising the database
db.serialize(() => {
    // Create users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )
    `);

    // Create reviews table
    db.run(`
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT NOT NULL,
            type TEXT CHECK(type IN ('movie', 'video_game')) NOT NULL,
            content TEXT,
            rating INTEGER CHECK(rating >= 1 AND rating <= 5),
            company_name TEXT,
            theme TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
});

module.exports = db;
