const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');
const bcrypt = require('bcryptjs');

// Create users table
db.serialize(() => {
    // Drop table if it exists
    db.run("DROP TABLE IF EXISTS users", (err) => {
        if (err) {
            console.error("Error dropping table:", err);
            return;
        }
        console.log("Dropped existing users table if it existed");
    });

    // Create new table with all fields
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_admin BOOLEAN DEFAULT 0
    )`, (err) => {
        if (err) {
            console.error("Error creating table:", err);
            return;
        }
        console.log("Users table created successfully");

        // Create a default user
        const defaultUser = {
            fullname: 'Admin User',
            username: 'admin',
            email: 'admin@example.com',
            password: bcrypt.hashSync('admin123', 8),
            phonenumber: '+1234567890',
            address: '123 Admin St',
            profile_image: 'http://localhost:3000/uploads/default-profile.png',
            theme_settings: '{"mode":"light","color":"blue"}',
            is_admin: 1
        };

        db.run(`
            INSERT INTO users (
                fullname, username, email, password, 
                phonenumber, address, profile_image, theme_settings,
                is_admin
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            defaultUser.fullname,
            defaultUser.username,
            defaultUser.email,
            defaultUser.password,
            defaultUser.phonenumber,
            defaultUser.address,
            defaultUser.profile_image,
            defaultUser.theme_settings,
            defaultUser.is_admin
        ], (err) => {
            if (err) {
                console.error("Error creating default user:", err);
            } else {
                console.log("Default admin user created successfully");
            }
        });
    });

    // Drop books table if it exists
    db.run(`DROP TABLE IF EXISTS books`, (err) => {
        if (err) {
            console.error("Error dropping books table:", err);
            return;
        }
        console.log("Dropped existing books table if it existed");

        // Create books table
        db.run(`CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            image_url TEXT,
            category TEXT,
            stock INTEGER DEFAULT 0,
            featured BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error("Error creating books table:", err);
            } else {
                console.log("Books table created successfully");
                
                // Real book data
                const books = [
                    {
                        title: 'Atomic Habits',
                        author: 'James Clear',
                        description: "An Easy & Proven Way to Build Good Habits & Break Bad Ones. No matter your goals, Atomic Habits offers a proven framework for improving--every day.",
                        price: 24.99,
                        image_url: 'https://images-na.ssl-images-amazon.com/images/I/81wgcld4wxL.jpg',
                        category: 'Self-Help',
                        stock: 25,
                        featured: 1
                    },
                    {
                        title: 'The Psychology of Money',
                        author: 'Morgan Housel',
                        description: "Timeless lessons on wealth, greed, and happiness. Doing well with money isn't necessarily about what you know. It's about how you behave.",
                        price: 19.99,
                        image_url: 'https://images-na.ssl-images-amazon.com/images/I/71r3ktfqkwL.jpg',
                        category: 'Finance',
                        stock: 30,
                        featured: 1
                    },
                    {
                        title: 'Project Hail Mary',
                        author: 'Andy Weir',
                        description: 'A lone astronaut must save the earth from disaster in this incredible new science-based thriller from the #1 New York Times bestselling author of The Martian.',
                        price: 29.99,
                        image_url: 'https://images-na.ssl-images-amazon.com/images/I/91Bd7P8UwxL.jpg',
                        category: 'Science Fiction',
                        stock: 20,
                        featured: 1
                    },
                    {
                        title: 'Dune',
                        author: 'Frank Herbert',
                        description: 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world.',
                        price: 15.99,
                        image_url: 'https://images-na.ssl-images-amazon.com/images/I/91EsWP2GB5L.jpg',
                        category: 'Science Fiction',
                        stock: 15
                    },
                    {
                        title: 'The Midnight Library',
                        author: 'Matt Haig',
                        description: 'Between life and death there is a library. When Nora finds herself in the Midnight Library, she has a chance to make things right.',
                        price: 22.99,
                        image_url: 'https://images-na.ssl-images-amazon.com/images/I/81tCtHFtOgL.jpg',
                        category: 'Fiction',
                        stock: 18,
                        featured: 1
                    },
                    {
                        title: 'Think and Grow Rich',
                        author: 'Napoleon Hill',
                        description: 'This book contains money-making secrets that can change your life.',
                        price: 14.99,
                        image_url: 'https://images-na.ssl-images-amazon.com/images/I/71UypkUjStL.jpg',
                        category: 'Business',
                        stock: 40
                    },
                    {
                        title: '1984',
                        author: 'George Orwell',
                        description: 'A dystopian social science fiction novel and cautionary tale.',
                        price: 12.99,
                        image_url: 'https://images-na.ssl-images-amazon.com/images/I/71kxa1-0mfL.jpg',
                        category: 'Fiction',
                        stock: 22
                    },
                    {
                        title: 'The Silent Patient',
                        author: 'Alex Michaelides',
                        description: 'A woman shoots her husband five times and then never speaks another word.',
                        price: 21.99,
                        image_url: 'https://images-na.ssl-images-amazon.com/images/I/91PpDVWjhLL.jpg',
                        category: 'Thriller',
                        stock: 25,
                        featured: 1
                    },
                    {
                        title: 'Rich Dad Poor Dad',
                        author: 'Robert T. Kiyosaki',
                        description: 'What the Rich Teach Their Kids About Money That the Poor and Middle Class Do Not!',
                        price: 17.99,
                        image_url: 'https://images-na.ssl-images-amazon.com/images/I/81bsw6fnUiL.jpg',
                        category: 'Finance',
                        stock: 35
                    },
                    {
                        title: 'To Kill a Mockingbird',
                        author: 'Harper Lee',
                        description: 'A classic of modern American literature.',
                        price: 13.99,
                        image_url: 'https://images-na.ssl-images-amazon.com/images/I/71FxgtFKcQL.jpg',
                        category: 'Fiction',
                        stock: 28
                    },
                    {
                        title: 'The Alchemist',
                        author: 'Paulo Coelho',
                        description: "A mystical story of Santiago, an Andalusian shepherd boy who yearns to travel.",
                        price: 16.99,
                        image_url: 'https://images-na.ssl-images-amazon.com/images/I/71aFt4+OTOL.jpg',
                        category: 'Fiction',
                        stock: 30,
                        featured: 1
                    },
                    {
                        title: 'The Power of Now',
                        author: 'Eckhart Tolle',
                        description: 'Guide to spiritual enlightenment.',
                        price: 18.99,
                        image_url: 'https://images-na.ssl-images-amazon.com/images/I/714FbKtXS+L.jpg',
                        category: 'Self-Help',
                        stock: 20
                    }
                ];

                // Insert books
                books.forEach(book => {
                    db.run(`
                        INSERT INTO books (
                            title, author, description, price, 
                            image_url, category, stock, featured
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        book.title,
                        book.author,
                        book.description,
                        book.price,
                        book.image_url,
                        book.category,
                        book.stock,
                        book.featured || 0
                    ], (err) => {
                        if (err) {
                            console.error("Error inserting book:", err);
                        } else {
                            console.log(`Book "${book.title}" added successfully`);
                        }
                    });
                });
            }
        });
    });

    // Create orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'pending',
        shipping_address TEXT,
        shipping_city TEXT,
        shipping_state TEXT,
        shipping_zip TEXT,
        shipping_phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`, (err) => {
        if (err) {
            console.error("Error creating orders table:", err);
        } else {
            console.log("Orders table created successfully");
        }
    });

    // Create order_items table
    db.run(`CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (book_id) REFERENCES books(id)
    )`, (err) => {
        if (err) {
            console.error("Error creating order_items table:", err);
        } else {
            console.log("Order items table created successfully");
        }
    });

    // Add sample orders
    const sampleOrders = [
        {
            user_id: 1, // admin user
            total_amount: 44.98,
            status: 'completed',
            shipping_address: '123 Main St',
            shipping_city: 'New York',
            shipping_state: 'NY',
            shipping_zip: '10001',
            shipping_phone: '+1234567890',
            items: [
                { book_id: 1, quantity: 1, price: 24.99 },
                { book_id: 2, quantity: 1, price: 19.99 }
            ]
        },
        {
            user_id: 1,
            total_amount: 52.97,
            status: 'pending',
            shipping_address: '456 Oak Avenue',
            shipping_city: 'Los Angeles',
            shipping_state: 'CA',
            shipping_zip: '90001',
            shipping_phone: '+1987654321',
            items: [
                { book_id: 3, quantity: 1, price: 29.99 },
                { book_id: 4, quantity: 1, price: 15.99 },
                { book_id: 5, quantity: 1, price: 6.99 }
            ]
        }
    ];

    // Insert sample orders
    console.log("Inserting sample orders...");
    sampleOrders.forEach(order => {
        db.run(`
            INSERT INTO orders (
                user_id, total_amount, status,
                shipping_address, shipping_city, shipping_state,
                shipping_zip, shipping_phone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            order.user_id,
            order.total_amount,
            order.status,
            order.shipping_address,
            order.shipping_city,
            order.shipping_state,
            order.shipping_zip,
            order.shipping_phone
        ], function(err) {
            if (err) {
                console.error("Error inserting order:", err);
                return;
            }

            const orderId = this.lastID;
            console.log(`Order ${orderId} created successfully`);

            // Insert order items
            order.items.forEach(item => {
                db.run(`
                    INSERT INTO order_items (
                        order_id, book_id, quantity, price
                    ) VALUES (?, ?, ?, ?)
                `, [
                    orderId,
                    item.book_id,
                    item.quantity,
                    item.price
                ], (err) => {
                    if (err) {
                        console.error("Error inserting order item:", err);
                    } else {
                        console.log(`Order item added for order ${orderId}`);
                    }
                });
            });
        });
    });
});

// Close the database connection
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error("Error closing database:", err);
            return;
        }
        console.log("Database connection closed");
    });
}, 1000); 