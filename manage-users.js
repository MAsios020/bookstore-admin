const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const db = new sqlite3.Database('./database.sqlite');

// Function to add a test user
function addTestUser() {
    const user = {
        fullname: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        phonenumber: '+1234567890',
        address: '123 Test Street, Test City'
    };
    const hashedPassword = bcrypt.hashSync(user.password, 8);

    db.run(
        "INSERT INTO users (fullname, username, email, password, phonenumber, address) VALUES (?, ?, ?, ?, ?, ?)",
        [user.fullname, user.username, user.email, hashedPassword, user.phonenumber, user.address],
        function(err) {
            if (err) {
                console.error("Error adding test user:", err);
            } else {
                console.log(`Test user added successfully with ID: ${this.lastID}`);
            }
        }
    );
}

// Function to list all users
function listAllUsers() {
    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) {
            console.error("Error fetching users:", err);
        } else {
            console.log("\nCurrent Users in Database:");
            console.log("------------------------");
            rows.forEach(row => {
                console.log(`ID: ${row.id}`);
                console.log(`Email: ${row.email}`);
                console.log(`Password Hash: ${row.password}`);
                console.log("------------------------");
            });
        }
    });
}

// Function to add a custom user
function addCustomUser(fullname, username, email, password, phonenumber, address) {
    const hashedPassword = bcrypt.hashSync(password, 8);

    db.run(
        "INSERT INTO users (fullname, username, email, password, phonenumber, address) VALUES (?, ?, ?, ?, ?, ?)",
        [fullname, username, email, hashedPassword, phonenumber, address],
        function(err) {
            if (err) {
                console.error("Error adding user:", err);
            } else {
                console.log(`User added successfully with ID: ${this.lastID}`);
            }
        }
    );
}

// Function to run a query and display results
async function runDatabaseQuery(query) {
    try {
        const response = await fetch(`http://localhost:3000/debug/query?sql=${encodeURIComponent(query)}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error running query:', error);
        throw error;
    }
}

// Example usage:
async function showUserOrders(userId) {
    const query = `
        SELECT o.*, u.fullname 
        FROM orders o 
        JOIN users u ON o.user_id = u.id 
        WHERE u.id = ${userId}
    `;
    
    try {
        const orders = await runDatabaseQuery(query);
        console.log('User orders:', orders);
        // Display orders in UI
    } catch (error) {
        alert('Error fetching orders');
    }
}

// Parse command line arguments
const command = process.argv[2];
const email = process.argv[3];
const password = process.argv[4];

switch(command) {
    case 'add-test':
        addTestUser();
        break;
    case 'add':
        if (email && password) {
            addCustomUser(null, null, email, password, null, null);
        } else {
            console.log("Usage: node manage-users.js add <email> <password>");
        }
        break;
    case 'list':
        listAllUsers();
        break;
    default:
        console.log("Available commands:");
        console.log("  add-test - Add a test user");
        console.log("  add <email> <password> - Add a custom user");
        console.log("  list - List all users");
}

// Keep the connection open briefly to allow operations to complete
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error("Error closing database:", err);
        }
    });
}, 1000); 