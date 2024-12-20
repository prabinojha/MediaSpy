const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./users.db');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            username TEXT NOT NULL,
            name TEXT NOT NULL,
            type TEXT CHECK(type IN ('movie', 'video_game')) NOT NULL,
            age TEXT CHECK(age IN ('General', 'Parental Guidance', 'Mature', 'Restricted R', 'Restricted X')) NOT NULL,
            content TEXT,
            rating INTEGER CHECK(rating >= 1 AND rating <= 5),
            company_name TEXT,
            theme TEXT,
            image_path TEXT,
            reviewItem BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);    
});

module.exports = db;


