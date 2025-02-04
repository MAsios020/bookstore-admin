const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

const defaultProfileImage = 'http://localhost:3000/uploads/default-profile.png';

db.run(
    "UPDATE users SET profile_image = ? WHERE profile_image IS NULL",
    [defaultProfileImage],
    function(err) {
        if (err) {
            console.error("Error updating users:", err);
        } else {
            console.log(`Updated ${this.changes} users with default profile image`);
        }
        db.close();
    }
); 