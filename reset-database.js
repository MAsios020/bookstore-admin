const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
    // Drop existing table
    db.run(`DROP TABLE IF EXISTS users`, (err) => {
        if (err) {
            console.error('Error dropping table:', err);
        } else {
            console.log('Dropped existing table');
        }
    });

    // Create new table with all columns
    db.run(`
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullname TEXT NOT NULL,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            phonenumber TEXT,
            address TEXT,
            profile_image TEXT,
            theme_settings TEXT DEFAULT '{"mode":"light","color":"blue"}',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating table:', err);
        } else {
            console.log('Created new table with all columns');
        }
    });
});

// Close the database connection
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
    });
}, 1000); 