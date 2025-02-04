// Store state
let books = [];
let categories = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadBooks();
    loadCategories();
    updateCartDisplay();
});

// Load all books
async function loadBooks() {
    try {
        const response = await fetch('http://localhost:3000/books');
        const data = await response.json();
        if (data.success) {
            books = data.books;
            displayBooks(books);
        }
    } catch (error) {
        console.error('Error loading books:', error);
    }
}

// Load categories
async function loadCategories() {
    try {
        const response = await fetch('http://localhost:3000/categories');
        categories = await response.json();
        displayCategories(categories);
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Display categories in select
function displayCategories(categories) {
    const select = document.getElementById('categorySelect');
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

// Display books
function displayBooks(books) {
    const grid = document.getElementById('booksGrid');
    grid.innerHTML = books.map(book => `
        <div class="book-card">
            <div class="book-cover">
                <img src="${book.image_url || '../images/default-book.jpg'}" alt="${book.title}">
                <div class="book-actions">
                    <button class="action-btn cart-btn" onclick="addToCart(${book.id}); event.stopPropagation();">
                        <i class="fas fa-shopping-cart"></i>
                    </button>
                    <button class="action-btn favorite-btn" onclick="toggleFavorite(${book.id}); event.stopPropagation();">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">by ${book.author}</p>
                <span class="book-price">$${book.price}</span>
            </div>
        </div>
    `).join('');

    // Update favorite buttons state
    updateFavoriteButtons();
}

// Sort books
function sortBooks() {
    const sortBy = document.getElementById('sortSelect').value;
    let sortedBooks = [...books];

    switch(sortBy) {
        case 'price-low':
            sortedBooks.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            sortedBooks.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
            sortedBooks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
    }

    displayBooks(sortedBooks);
}

// Filter books by category
function filterBooks() {
    const category = document.getElementById('categorySelect').value;
    
    if (!category) {
        displayBooks(books);
        return;
    }

    const filteredBooks = books.filter(book => book.category === category);
    displayBooks(filteredBooks);
}

// View book details
function viewBookDetails(bookId) {
    window.location.href = `BookDetails.html?id=${bookId}`;
}

// Search functionality
const searchForm = document.querySelector('.search-form');
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const category = searchForm.querySelector('select').value;
    const query = searchForm.querySelector('input').value;

    try {
        const response = await fetch(`http://localhost:3000/books?search=${query}&category=${category}`);
        const data = await response.json();
        if (data.success) {
            displayBooks(data.books);
        }
    } catch (error) {
        console.error('Error searching books:', error);
    }
});

// Add these functions to handle favorites
function toggleFavorite(bookId) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const index = favorites.indexOf(bookId);
    
    if (index === -1) {
        favorites.push(bookId);
        showNotification('Added to favorites!');
    } else {
        favorites.splice(index, 1);
        showNotification('Removed from favorites!');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoriteButtons();
}

function updateFavoriteButtons() {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const buttons = document.querySelectorAll('.favorite-btn');
    
    buttons.forEach(button => {
        const bookId = parseInt(button.getAttribute('onclick').match(/\d+/)[0]);
        if (favorites.includes(bookId)) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// Add these functions to handle cart dropdown
document.getElementById('cartButton').addEventListener('click', function() {
    document.querySelector('.cart-dropdown').classList.toggle('active');
});

// Close cart dropdown when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.cart-dropdown')) {
        document.querySelector('.cart-dropdown').classList.remove('active');
    }
});

function updateCartDisplay() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.querySelector('.cart-count');
    const cartTotal = document.getElementById('cartTotal');
    
    // Update cart count
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Update cart items
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image_url || '../images/default-book.jpg'}" alt="${item.title}">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.title}</div>
                <div class="cart-item-price">$${item.price}</div>
                <div class="cart-item-quantity">
                    <button onclick="updateCartItemQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartItemQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `$${total.toFixed(2)}`;
}

function updateCartItemQuantity(bookId, newQuantity) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    if (newQuantity < 1) {
        cart = cart.filter(item => item.id !== bookId);
    } else {
        const item = cart.find(item => item.id === bookId);
        if (item) {
            item.quantity = newQuantity;
        }
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
}

function proceedToCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }
    window.location.href = 'OrderPage.html';
}

// Update addToCart function to call updateCartDisplay
function addToCart(bookId) {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartItem = cart.find(item => item.id === bookId);

    if (cartItem) {
        cartItem.quantity++;
    } else {
        cart.push({ ...book, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
    showNotification('Added to cart!');
}

// Add notification function if not already present
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 2000);
} 