// Global state
let currentSection = 'dashboard';
let books = [];
let orders = [];
let users = [];

// DOM Elements
const sections = document.querySelectorAll('.content-section');
const navLinks = document.querySelectorAll('.nav-link');

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAdminAuth()) return;
    
    // Add navigation event listeners
    setupNavigation();
    
    // Load initial data
    loadDashboardData();
});

// Authentication
function checkAdminAuth() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = localStorage.getItem('admin') === 'true';

    if (!user || !isAdmin) {
        window.location.href = 'LoginPage.html';
        return false;
    }
    return true;
}

// Navigation
function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.currentTarget.dataset.section;
            if (section) {
                switchSection(section);
            }
        });
    });
}

function switchSection(sectionId) {
    // Update active states
    sections.forEach(section => {
        section.classList.remove('active');
    });
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(`${sectionId}Section`);
    const targetLink = document.querySelector(`[data-section="${sectionId}"]`);
    
    if (targetSection && targetLink) {
        targetSection.classList.add('active');
        targetLink.classList.add('active');
        currentSection = sectionId;
        loadSectionData(sectionId);
    }
}

// Data Loading
async function loadDashboardData() {
    try {
        // Load initial data
        const [booksResponse, ordersResponse, usersResponse] = await Promise.all([
            fetch(`${config.apiUrl}/books`),
            fetch(`${config.apiUrl}/orders`),
            fetch(`${config.apiUrl}/users`)
        ]);

        const booksData = await booksResponse.json();
        const ordersData = await ordersResponse.json();
        const usersData = await usersResponse.json();

        // Store data globally
        books = booksData.books || [];
        orders = ordersData.orders || [];
        users = usersData || [];

        // Update dashboard stats
        updateDashboardStats({
            books: books,
            orders: orders,
            users: users
        });
        
        // Display recent orders
        if (orders.length > 0) {
            displayRecentOrders(orders.slice(0, 5));
        }
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data. Please check your connection and try again.');
    }
}

function loadSectionData(section) {
    switch(section) {
        case 'books':
            loadBooks();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'users':
            loadUsers();
            break;
        case 'reports':
            loadReports();
            break;
    }
}

// Books Management
async function loadBooks() {
    try {
        const response = await fetch(`${config.apiUrl}/books`);
        const data = await response.json();
        
        if (data.success) {
            books = data.books;
            displayBooks(books);
        }
    } catch (error) {
        console.error('Error loading books:', error);
        showError('Failed to load books');
    }
}

function displayBooks(books) {
    const tbody = document.getElementById('booksTable');
    if (!tbody) return;

    tbody.innerHTML = books.map(book => `
        <tr>
            <td>
                <img src="${book.image_url || '../images/default-book.jpg'}" 
                     alt="${book.title}" 
                     class="book-thumbnail">
            </td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.category}</td>
            <td>$${book.price.toFixed(2)}</td>
            <td>
                <span class="stock-badge ${book.stock < 10 ? 'low-stock' : ''}">${book.stock}</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button onclick="editBook(${book.id})" class="btn-icon">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteBook(${book.id})" class="btn-icon btn-danger">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Modal Management
function showAddBookModal() {
    document.getElementById('modalTitle').textContent = 'Add New Book';
    document.getElementById('bookForm').reset();
    document.getElementById('bookModal').style.display = 'flex';
}

function hideBookModal() {
    document.getElementById('bookModal').style.display = 'none';
}

async function handleBookSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const bookId = form.dataset.bookId;
    
    try {
        const url = bookId 
            ? `${config.apiUrl}/books/${bookId}`
            : `${config.apiUrl}/books`;
            
        const method = bookId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        
        const result = await response.json();
        if (result.success) {
            hideBookModal();
            loadBooks();
            showSuccess(bookId ? 'Book updated successfully' : 'Book added successfully');
        } else {
            showError(result.message || 'Failed to save book');
        }
    } catch (error) {
        console.error('Error saving book:', error);
        showError('Failed to save book');
    }
}

// Utility Functions
function showError(message) {
    // You can replace this with a better notification system
    alert(message);
}

function showSuccess(message) {
    // You can replace this with a better notification system
    alert(message);
}

function updateDashboardStats(data) {
    // Update total books
    const totalBooksElement = document.getElementById('totalBooks');
    if (totalBooksElement) {
        totalBooksElement.textContent = data.books.length;
    }

    // Update total orders
    const totalOrdersElement = document.getElementById('totalOrders');
    if (totalOrdersElement) {
        totalOrdersElement.textContent = data.orders.length;
    }

    // Update total users
    const totalUsersElement = document.getElementById('totalUsers');
    if (totalUsersElement) {
        totalUsersElement.textContent = data.users.length;
    }
    
    // Calculate and update total revenue
    const revenue = data.orders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
    
    const totalRevenueElement = document.getElementById('totalRevenue');
    if (totalRevenueElement) {
        totalRevenueElement.textContent = `$${revenue.toFixed(2)}`;
    }
}

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('admin');
    window.location.href = 'LoginPage.html';
}

// Orders Management
async function loadOrders() {
    try {
        console.log('Loading orders...');
        const response = await fetch(`${config.apiUrl}/orders`);
        console.log('Orders response:', response);
        
        const data = await response.json();
        console.log('Orders data:', data);
        
        if (data.success) {
            orders = data.orders;
            displayOrders(orders);
            updateOrderStats(orders);
        } else {
            throw new Error(data.message || 'Failed to load orders');
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        showError('Failed to load orders: ' + error.message);
    }
}

function displayOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    if (!orders || orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    No orders found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>
                <div class="user-info">
                    <div>
                        <div class="user-name">${order.user_name || 'Unknown User'}</div>
                        <small class="text-secondary">${order.email || ''}</small>
                    </div>
                </div>
            </td>
            <td>
                <div class="order-items-preview">
                    ${order.items ? order.items.map(item => `
                        <div class="item-preview" title="${item.title}">
                            ${item.title} × ${item.quantity}
                        </div>
                    `).join('') : 'No items'}
                </div>
            </td>
            <td>$${parseFloat(order.total_amount || 0).toFixed(2)}</td>
            <td>
                <span class="status-badge status-${(order.status || 'pending').toLowerCase()}">
                    ${order.status || 'Pending'}
                </span>
            </td>
            <td>${new Date(order.created_at).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="viewOrderDetails(${order.id})" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon" onclick="printOrder(${order.id})" title="Print Order">
                        <i class="fas fa-print"></i>
                    </button>
                    ${order.status === 'pending' ? `
                        <button class="btn-icon btn-danger" onclick="cancelOrder(${order.id})" title="Cancel Order">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function viewOrderDetails(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Populate modal with order details
    document.getElementById('modalOrderId').textContent = `#${order.id}`;
    document.getElementById('modalOrderDate').textContent = new Date(order.created_at).toLocaleString();
    document.getElementById('modalOrderStatus').textContent = order.status;
    document.getElementById('modalOrderTotal').textContent = `$${parseFloat(order.total_amount).toFixed(2)}`;
    
    document.getElementById('modalCustomerName').textContent = order.user_name;
    document.getElementById('modalCustomerEmail').textContent = order.email || 'N/A';
    document.getElementById('modalCustomerPhone').textContent = order.phone || 'N/A';
    document.getElementById('modalCustomerAddress').textContent = order.shipping_address || 'N/A';

    // Populate order items
    const itemsTable = document.getElementById('modalOrderItems');
    itemsTable.innerHTML = order.items.map(item => `
        <tr>
            <td>${item.title}</td>
            <td>$${parseFloat(item.price).toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td>$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');

    // Set current status in select
    document.getElementById('updateOrderStatus').value = order.status.toLowerCase();
    
    // Store order ID for status update
    document.getElementById('updateOrderStatus').dataset.orderId = orderId;

    // Show modal
    document.getElementById('orderModal').style.display = 'flex';
}

function hideOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
}

// Update order status functions
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${config.apiUrl}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();
        if (data.success) {
            loadOrders(); // Reload orders after status update
            showSuccess('Order status updated successfully');
        } else {
            showError(data.message || 'Failed to update order status');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        showError('Failed to update order status');
    }
}

// Update the status change handler in the modal
function handleStatusChange() {
    const select = document.getElementById('updateOrderStatus');
    const orderId = select.dataset.orderId;
    const newStatus = select.value;

    if (orderId && newStatus) {
        updateOrderStatus(orderId, newStatus);
        hideOrderModal();
    }
}

// Update the cancel order function
async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
        return;
    }

    try {
        await updateOrderStatus(orderId, 'cancelled');
    } catch (error) {
        console.error('Error cancelling order:', error);
        showError('Failed to cancel order');
    }
}

function searchOrders() {
    const searchTerm = document.getElementById('orderSearch').value.toLowerCase();
    const filteredOrders = orders.filter(order => 
        order.id.toString().includes(searchTerm) ||
        order.user_name.toLowerCase().includes(searchTerm) ||
        order.items.some(item => item.title.toLowerCase().includes(searchTerm))
    );
    displayOrders(filteredOrders);
}

function filterOrders() {
    const statusFilter = document.getElementById('orderStatusFilter').value;
    const filteredOrders = statusFilter === 'all' 
        ? orders 
        : orders.filter(order => order.status.toLowerCase() === statusFilter);
    displayOrders(filteredOrders);
}

function exportOrders() {
    const csv = [
        ['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date'],
        ...orders.map(order => [
            order.id,
            order.user_name,
            order.items.map(item => `${item.title} × ${item.quantity}`).join('; '),
            order.total_amount,
            order.status,
            new Date(order.created_at).toLocaleString()
        ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

// Users Management
async function loadUsers() {
    try {
        const response = await fetch(`${config.apiUrl}/users`);
        const data = await response.json();
        
        if (response.ok) {
            displayUsers(data);
            updateUserStats(data);
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users');
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>#${user.id}</td>
            <td>
                <div class="user-info">
                    <img src="${user.profile_image || '../images/default-profile.png'}" 
                         alt="${user.fullname}"
                         class="user-avatar">
                    <div>
                        <div class="user-name">${user.fullname}</div>
                        <small class="text-secondary">@${user.username}</small>
                    </div>
                </div>
            </td>
            <td>${user.email}</td>
            <td>
                <span class="role-badge ${user.is_admin ? 'role-admin' : 'role-user'}">
                    ${user.is_admin ? 'Admin' : 'User'}
                </span>
            </td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>
                <span class="status-badge status-active">Active</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="editUser(${user.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteUser(${user.id})"
                            ${user.is_admin ? 'disabled' : ''}>
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateUserStats(users) {
    const totalUsers = users.length;
    const adminUsers = users.filter(user => user.is_admin).length;
    const newUsers = users.filter(user => {
        const userDate = new Date(user.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return userDate >= thirtyDaysAgo;
    }).length;
    const activeUsers = users.length; // You might want to add an active status to users

    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('adminUsers').textContent = adminUsers;
    document.getElementById('newUsers').textContent = newUsers;
    document.getElementById('activeUsers').textContent = activeUsers;
}

// Add these functions for book management

async function editBook(bookId) {
    try {
        const book = books.find(b => b.id === bookId);
        if (!book) return;

        // Populate the modal with book data
        document.getElementById('modalTitle').textContent = 'Edit Book';
        document.getElementById('bookTitle').value = book.title;
        document.getElementById('bookAuthor').value = book.author;
        document.getElementById('bookCategory').value = book.category;
        document.getElementById('bookPrice').value = book.price;
        document.getElementById('bookStock').value = book.stock;
        document.getElementById('bookDescription').value = book.description || '';

        // Store the book ID in the form for update
        const form = document.getElementById('bookForm');
        form.dataset.bookId = bookId;

        // Show the modal
        document.getElementById('bookModal').style.display = 'flex';
    } catch (error) {
        console.error('Error preparing book edit:', error);
        showError('Failed to load book details');
    }
}

async function deleteBook(bookId) {
    if (!confirm('Are you sure you want to delete this book?')) {
        return;
    }

    try {
        const response = await fetch(`${config.apiUrl}/books/${bookId}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (data.success) {
            showSuccess('Book deleted successfully');
            loadBooks(); // Reload the books list
        } else {
            showError(data.message || 'Failed to delete book');
        }
    } catch (error) {
        console.error('Error deleting book:', error);
        showError('Failed to delete book');
    }
}

// Add the displayRecentOrders function
function displayRecentOrders(orders) {
    const tbody = document.getElementById('recentOrdersTable');
    if (!tbody) return;

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>
                <div class="user-info">
                    <div class="user-name">${order.user_name || 'Unknown User'}</div>
                </div>
            </td>
            <td>
                <div class="order-items">
                    ${order.items ? order.items.map(item => `
                        <div class="order-item">
                            ${item.title} x ${item.quantity}
                        </div>
                    `).join('') : 'No items'}
                </div>
            </td>
            <td>$${parseFloat(order.total_amount || 0).toFixed(2)}</td>
            <td>
                <span class="status-badge status-${order.status || 'pending'}">
                    ${order.status || 'Pending'}
                </span>
            </td>
            <td>${new Date(order.created_at).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

// Add some CSS for the status badges
const style = document.createElement('style');
style.textContent = `
    .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
    }
    .status-pending {
        background-color: var(--warning-color);
        color: white;
    }
    .status-completed {
        background-color: var(--success-color);
        color: white;
    }
    .status-cancelled {
        background-color: var(--danger-color);
        color: white;
    }
`;
document.head.appendChild(style);

// User Management Functions
function showAddUserModal() {
    document.getElementById('userModalTitle').textContent = 'Add New User';
    document.getElementById('userForm').reset();
    document.getElementById('password').required = true;
    document.getElementById('userModal').style.display = 'flex';
}

function hideUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

async function editUser(userId) {
    try {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        // Populate the modal with user data
        document.getElementById('userModalTitle').textContent = 'Edit User';
        document.getElementById('fullname').value = user.fullname;
        document.getElementById('username').value = user.username;
        document.getElementById('email').value = user.email;
        document.getElementById('phonenumber').value = user.phonenumber || '';
        document.getElementById('address').value = user.address || '';
        document.getElementById('userRole').value = user.is_admin ? '1' : '0';
        
        // Password is not required when editing
        document.getElementById('password').required = false;

        // Store the user ID in the form for update
        const form = document.getElementById('userForm');
        form.dataset.userId = userId;

        // Show the modal
        document.getElementById('userModal').style.display = 'flex';
    } catch (error) {
        console.error('Error preparing user edit:', error);
        showError('Failed to load user details');
    }
}

async function handleUserSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const userId = form.dataset.userId;
    
    try {
        const url = userId 
            ? `${config.apiUrl}/users/${userId}`
            : `${config.apiUrl}/users`;
            
        const method = userId ? 'PUT' : 'POST';

        // If no password is provided during edit, remove it from formData
        if (userId && !formData.get('password')) {
            formData.delete('password');
        }
        
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        
        const result = await response.json();
        if (result.success) {
            hideUserModal();
            loadUsers();
            showSuccess(userId ? 'User updated successfully' : 'User added successfully');
        } else {
            showError(result.message || 'Failed to save user');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        showError('Failed to save user');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) {
        return;
    }

    try {
        const response = await fetch(`${config.apiUrl}/users/${userId}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        if (data.success) {
            showSuccess('User deleted successfully');
            loadUsers();
        } else {
            showError(data.message || 'Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showError('Failed to delete user');
    }
}

function searchUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase();
    const filteredUsers = users.filter(user => 
        user.fullname.toLowerCase().includes(searchTerm) ||
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
    );
    displayUsers(filteredUsers);
}

function filterUsers() {
    const roleFilter = document.getElementById('userRoleFilter').value;
    const filteredUsers = roleFilter === 'all' 
        ? users 
        : users.filter(user => 
            (roleFilter === 'admin' && user.is_admin) || 
            (roleFilter === 'user' && !user.is_admin)
        );
    displayUsers(filteredUsers);
} 