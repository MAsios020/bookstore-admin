const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./database.sqlite');

// Function to add a user
function addUser(email, password) {
    const hashedPassword = bcrypt.hashSync(password, 8);
    
    db.run(
        "INSERT INTO users (email, password) VALUES (?, ?)",
        [email, hashedPassword],
        function(err) {
            if (err) {
                console.error("Error adding user:", err);
            } else {
                console.log(`User added successfully with ID: ${this.lastID}`);
            }
        }
    );
}

// Function to list all users
function listUsers() {
    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) {
            console.error("Error fetching users:", err);
            return;
        }
        console.log("\nAll Users:");
        rows.forEach(row => {
            console.log(`ID: ${row.id}, Email: ${row.email}`);
        });
    });
}

// Example usage
const command = process.argv[2];
const email = process.argv[3];
const password = process.argv[4];

switch(command) {
    case 'add':
        if (email && password) {
            addUser(email, password);
            // Wait a bit for the operation to complete
            setTimeout(() => {
                db.close();
            }, 1000);
        } else {
            console.log("Usage: node database-tools.js add <email> <password>");
            db.close();
        }
        break;
        
    case 'list':
        listUsers();
        // Wait a bit for the operation to complete
        setTimeout(() => {
            db.close();
        }, 1000);
        break;
        
    default:
        console.log("Available commands:");
        console.log("  add <email> <password> - Add a new user");
        console.log("  list - List all users");
        db.close();
} 