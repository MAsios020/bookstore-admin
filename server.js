const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://book-store-app-2b777b744c19.herokuapp.com/' 
        : 'http://localhost:3000',
    credentials: true
})); // Enable CORS
app.use(bodyParser.json());

// Update database configuration
const dbPath = process.env.NODE_ENV === 'production' 
    ? process.env.DATABASE_URL 
    : './database.sqlite';

const db = new sqlite3.Database(dbPath);

// Create users table if it doesn't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullname TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phonenumber TEXT,
        address TEXT,
        profile_image TEXT,
        theme_settings TEXT DEFAULT '{"mode":"light","color":"blue"}',
        is_admin INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating table:', err);
        } else {
            console.log('Database ready');
        }
    });
});

// Configure multer for file upload with error handling
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = process.env.NODE_ENV === 'production' 
            ? '/tmp/uploads' 
            : './uploads';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
}).single('profile_image');

// Configure multer for book images
const bookImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './uploads/books';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'book-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadBookImage = multer({
    storage: bookImageStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
}).single('image');

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve your HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'HTML', 'AdminDashboard.html'));
});

// Registration endpoint
app.post('/register', (req, res) => {
    const { fullname, username, email, password, phonenumber, address } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);
    const created_at = new Date().toISOString();
    const default_profile_image = `${req.protocol}://${req.get('host')}/uploads/default-profile.png`;

    db.run(
        "INSERT INTO users (fullname, username, email, password, phonenumber, address, profile_image, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [fullname, username, email, hashedPassword, phonenumber, address, default_profile_image, created_at],
        function(err) {
            if (err) {
                console.error("Error registering user:", err);
                return res.status(500).json({ message: "Error registering user" });
            }
            console.log(`User registered with email: ${email}`);
            res.status(200).json({ message: "User registered successfully" });
        }
    );
});

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
        if (err) {
            console.error("Error fetching user:", err);
            return res.status(500).send("Error fetching user");
        }
        if (!user) {
            return res.status(400).send("User not found");
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {
            return res.status(401).send("Invalid password");
        }

        // Send back user data (excluding password)
        res.status(200).json({
            message: "Login successful",
            user: {
                id: user.id,
                fullname: user.fullname,
                username: user.username,
                email: user.email,
                phonenumber: user.phonenumber,
                address: user.address,
                profile_image: user.profile_image,
                theme_settings: user.theme_settings,
                is_admin: user.is_admin,
                created_at: user.created_at
            }
        });
    });
});

// Temporary route to list all users (for debugging)
app.get('/users', (req, res) => {
    db.all("SELECT * FROM users", [], (err, users) => {
        if (err) {
            console.error("Error fetching users:", err);
            return res.status(500).json({
                success: false,
                message: "Error fetching users"
            });
        }
        res.json(users || []);
    });
});

// Add a simple GET route for testing
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Add this new endpoint for fetching user data
app.get('/user/:id', (req, res) => {
    const userId = req.params.id;
    
    db.get(
        "SELECT id, fullname, username, email, phonenumber, address, profile_image, created_at FROM users WHERE id = ?",
        [userId],
        (err, user) => {
            if (err) {
                console.error("Error fetching user:", err);
                return res.status(500).json({ message: "Error fetching user data" });
            }
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            res.json(user);
        }
    );
});

// Update the user endpoint
app.put('/user/:id', async (req, res) => {
    // Set response header to JSON
    res.setHeader('Content-Type', 'application/json');
    
    const userId = req.params.id;
    const { fullname, username, email, phonenumber, address } = req.body;
    
    console.log('Received update request:', { userId, ...req.body });

    // Validate required fields
    if (!fullname || !username || !email) {
        return res.status(400).json({ 
            success: false,
            message: "Fullname, username, and email are required" 
        });
    }

    try {
        // Get current user data first
        const currentUser = await new Promise((resolve, reject) => {
            db.get("SELECT profile_image FROM users WHERE id = ?", [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        // Proceed with update
        db.run(
            `UPDATE users 
             SET fullname = ?, username = ?, email = ?, phonenumber = ?, address = ?
             WHERE id = ?`,
            [fullname, username, email, phonenumber || null, address || null, userId],
            function(err) {
                if (err) {
                    console.error("Error updating user:", err);
                    return res.status(500).json({ 
                        success: false,
                        message: "Error updating user data",
                        error: err.message 
                    });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ 
                        success: false,
                        message: "User not found" 
                    });
                }
                
                // Send back updated user data
                return res.status(200).json({ 
                    success: true,
                    message: "User updated successfully",
                    user: {
                        id: userId,
                        fullname,
                        username,
                        email,
                        phonenumber: phonenumber || '',
                        address: address || '',
                        profile_image: currentUser.profile_image
                    }
                });
            }
        );
    } catch (error) {
        console.error("Error in update process:", error);
        return res.status(500).json({ 
            success: false,
            message: "Server error during update",
            error: error.message 
        });
    }
});

// Update the profile image endpoint with better error handling
app.post('/user/:id/profile-image', (req, res) => {
    upload(req, res, function(err) {
        if (err) {
            console.error('Error in file upload:', err);
            return res.status(400).json({
                success: false,
                message: err.message || 'Error uploading file'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const userId = req.params.id;
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        db.run(
            "UPDATE users SET profile_image = ? WHERE id = ?",
            [imageUrl, userId],
            function(err) {
                if (err) {
                    console.error("Error updating profile image in database:", err);
                    return res.status(500).json({
                        success: false,
                        message: "Error saving image to database"
                    });
                }

                res.json({
                    success: true,
                    message: "Profile image updated successfully",
                    imageUrl: imageUrl
                });
            }
        );
    });
});

// Add theme settings endpoint
app.put('/user/:id/theme', async (req, res) => {
    const userId = req.params.id;
    const { theme_settings } = req.body;

    db.run(
        "UPDATE users SET theme_settings = ? WHERE id = ?",
        [JSON.stringify(theme_settings), userId],
        function(err) {
            if (err) {
                console.error("Error updating theme settings:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error updating theme settings"
                });
            }
            res.json({
                success: true,
                message: "Theme settings updated successfully"
            });
        }
    );
});

// Get all books
app.get('/books', (req, res) => {
    db.all("SELECT * FROM books", [], (err, books) => {
        if (err) {
            console.error("Error fetching books:", err);
            return res.status(500).json({
                success: false,
                message: "Error fetching books"
            });
        }
        res.json({
            success: true,
            books: books || []
        });
    });
});

// Get single book
app.get('/books/:id', (req, res) => {
    const bookId = req.params.id;
    db.get("SELECT * FROM books WHERE id = ?", [bookId], (err, book) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: "Error fetching book" 
            });
        }
        if (!book) {
            return res.status(404).json({ 
                success: false, 
                message: "Book not found" 
            });
        }
        res.json(book);
    });
});

// Add new book
app.post('/books', (req, res) => {
    uploadBookImage(req, res, async function(err) {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        const { title, author, description, price, category, stock } = req.body;
        const imageUrl = req.file ? 
            `${req.protocol}://${req.get('host')}/uploads/books/${req.file.filename}` : 
            null;

        db.run(`
            INSERT INTO books (
                title, author, description, price, 
                image_url, category, stock
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            title, author, description, price, 
            imageUrl, category, stock
        ], function(err) {
            if (err) {
                console.error("Error adding book:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error adding book"
                });
            }
            res.status(201).json({
                success: true,
                message: "Book added successfully",
                bookId: this.lastID
            });
        });
    });
});

// Update book
app.put('/books/:id', (req, res) => {
    uploadBookImage(req, res, async function(err) {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        const bookId = req.params.id;
        const { title, author, description, price, category, stock } = req.body;
        const imageUrl = req.file ? 
            `${req.protocol}://${req.get('host')}/uploads/books/${req.file.filename}` : 
            undefined;

        let query = `
            UPDATE books 
            SET title = ?, author = ?, description = ?,
                price = ?, category = ?, stock = ?
        `;
        let params = [title, author, description, price, category, stock];

        if (imageUrl) {
            query += ", image_url = ?";
            params.push(imageUrl);
        }

        query += ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        params.push(bookId);

        db.run(query, params, function(err) {
            if (err) {
                console.error("Error updating book:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error updating book"
                });
            }
            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Book not found"
                });
            }
            res.json({
                success: true,
                message: "Book updated successfully"
            });
        });
    });
});

// Delete book
app.delete('/books/:id', (req, res) => {
    const bookId = req.params.id;
    
    // First get the book to delete its image
    db.get("SELECT image_url FROM books WHERE id = ?", [bookId], (err, book) => {
        if (err) {
            console.error("Error fetching book:", err);
            return res.status(500).json({
                success: false,
                message: "Error deleting book"
            });
        }

        // Delete the book from database
        db.run("DELETE FROM books WHERE id = ?", [bookId], function(err) {
            if (err) {
                console.error("Error deleting book:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error deleting book"
                });
            }

            // If book had an image, delete it from filesystem
            if (book && book.image_url) {
                const imagePath = book.image_url.split('/uploads/')[1];
                if (imagePath) {
                    fs.unlink(path.join(__dirname, 'uploads', imagePath), (err) => {
                        if (err) console.error("Error deleting image file:", err);
                    });
                }
            }

            res.json({
                success: true,
                message: "Book deleted successfully"
            });
        });
    });
});

// Get categories with book counts
app.get('/categories', (req, res) => {
    db.all(`
        SELECT category as name, COUNT(*) as count 
        FROM books 
        WHERE category IS NOT NULL 
        GROUP BY category
    `, [], (err, categories) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(categories);
    });
});

// Add this debug endpoint
app.get('/debug/tables', (req, res) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        const tablePromises = tables.map(table => {
            return new Promise((resolve, reject) => {
                db.all(`PRAGMA table_info(${table.name})`, [], (err, columns) => {
                    if (err) reject(err);
                    else resolve({ table: table.name, columns });
                });
            });
        });

        Promise.all(tablePromises)
            .then(tableInfo => {
                res.json(tableInfo);
            })
            .catch(error => {
                res.status(500).json({ error: error.message });
            });
    });
});

// Add this debug endpoint to run queries from browser
app.get('/debug/query', (req, res) => {
    const query = req.query.sql;
    
    if (!query) {
        return res.status(400).json({ error: 'No query provided' });
    }

    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Add this endpoint to update order status
app.put('/orders/:orderId/status', (req, res) => {
    const orderId = req.params.orderId;
    const { status } = req.body;

    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid status. Must be one of: pending, processing, shipped, delivered, cancelled"
        });
    }

    db.run(
        "UPDATE orders SET status = ? WHERE id = ?",
        [status, orderId],
        function(err) {
            if (err) {
                console.error("Error updating order status:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error updating order status"
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found"
                });
            }

            res.json({
                success: true,
                message: "Order status updated successfully"
            });
        }
    );
});

// Add new user
app.post('/users', (req, res) => {
    upload(req, res, async function(err) {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        const { fullname, username, email, password, phonenumber, address, is_admin } = req.body;
        const hashedPassword = bcrypt.hashSync(password, 8);
        const imageUrl = req.file ? 
            `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : 
            `${req.protocol}://${req.get('host')}/uploads/default-profile.png`;

        db.run(`
            INSERT INTO users (
                fullname, username, email, password, 
                phonenumber, address, profile_image, is_admin
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            fullname, username, email, hashedPassword,
            phonenumber, address, imageUrl, is_admin
        ], function(err) {
            if (err) {
                console.error("Error adding user:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error adding user"
                });
            }
            res.status(201).json({
                success: true,
                message: "User added successfully",
                userId: this.lastID
            });
        });
    });
});

// Update user
app.put('/users/:id', (req, res) => {
    upload(req, res, async function(err) {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        const userId = req.params.id;
        const { fullname, username, email, password, phonenumber, address, is_admin } = req.body;
        const imageUrl = req.file ? 
            `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : 
            undefined;

        let query = `
            UPDATE users 
            SET fullname = ?, username = ?, email = ?,
                phonenumber = ?, address = ?, is_admin = ?
        `;
        let params = [fullname, username, email, phonenumber, address, is_admin];

        if (password) {
            query += ", password = ?";
            params.push(bcrypt.hashSync(password, 8));
        }

        if (imageUrl) {
            query += ", profile_image = ?";
            params.push(imageUrl);
        }

        query += " WHERE id = ?";
        params.push(userId);

        db.run(query, params, function(err) {
            if (err) {
                console.error("Error updating user:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error updating user"
                });
            }
            res.json({
                success: true,
                message: "User updated successfully"
            });
        });
    });
});

// Delete user
app.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
    
    db.get("SELECT is_admin FROM users WHERE id = ?", [userId], (err, user) => {
        if (err || !user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.is_admin) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete admin users"
            });
        }

        db.run("DELETE FROM users WHERE id = ?", [userId], function(err) {
            if (err) {
                console.error("Error deleting user:", err);
                return res.status(500).json({
                    success: false,
                    message: "Error deleting user"
                });
            }

            res.json({
                success: true,
                message: "User deleted successfully"
            });
        });
    });
});

// Get all orders (simplified query for debugging)
app.get('/orders/debug', (req, res) => {
    db.all(`SELECT * FROM orders`, [], (err, orders) => {
        if (err) {
            console.error("Error:", err);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, orders: orders });
    });
});

// Add order status endpoint
app.get('/orders', (req, res) => {
    db.all(`
        SELECT o.*, u.fullname as user_name, u.email,
            GROUP_CONCAT(json_object(
                'id', b.id,
                'title', b.title,
                'quantity', oi.quantity,
                'price', oi.price
            )) as items
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN books b ON oi.book_id = b.id
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `, [], (err, orders) => {
        if (err) {
            console.error("Error fetching orders:", err);
            return res.status(500).json({
                success: false,
                message: "Error fetching orders",
                error: err.message
            });
        }

        // Handle case when there are no orders
        if (!orders || orders.length === 0) {
            return res.json({
                success: true,
                orders: []
            });
        }

        // Parse the items JSON string for each order
        const processedOrders = orders.map(order => ({
            ...order,
            items: order.items ? JSON.parse(`[${order.items}]`) : []
        }));

        res.json({
            success: true,
            orders: processedOrders
        });
    });
});

// Add this before your routes
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something broke!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 