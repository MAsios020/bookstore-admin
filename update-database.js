const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

// Add profile_image column if it doesn't exist
db.serialize(() => {
    db.run(`
        ALTER TABLE users 
        ADD COLUMN profile_image TEXT
    `, (err) => {
        if (err) {
            // Column might already exist
            console.log('Column might already exist:', err.message);
        } else {
            console.log('Added profile_image column');
        }
    });

    // Update existing records with default profile image
    const defaultProfileImage = 'http://localhost:3000/uploads/default-profile.png';
    db.run(`
        UPDATE users 
        SET profile_image = ? 
        WHERE profile_image IS NULL
    `, [defaultProfileImage], function(err) {
        if (err) {
            console.error('Error updating existing records:', err);
        } else {
            console.log(`Updated ${this.changes} records with default profile image`);
        }
    });

    // Verify the table structure
    db.all(`PRAGMA table_info(users)`, [], (err, rows) => {
        if (err) {
            console.error('Error getting table info:', err);
        } else {
            console.log('Current table structure:', rows);
        }
    });

    // Show updated records
    db.all(`SELECT * FROM users`, [], (err, rows) => {
        if (err) {
            console.error('Error getting users:', err);
        } else {
            console.log('Current users:', rows);
        }
    });
});

// Close the database connection after operations complete
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
    });
}, 1000); 