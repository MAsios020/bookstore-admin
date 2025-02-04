const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
        console.error("Error querying database:", err);
    } else {
        console.log("Current users in database:");
        console.log(rows);
    }
    db.close();
}); 