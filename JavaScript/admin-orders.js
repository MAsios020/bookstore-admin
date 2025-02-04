let allOrders = [];
let allBooks = [];

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
});

async function initializeDashboard() {
    // Load initial data
    await Promise.all([
        loadBooks(),
        loadOrders()
    ]);
    
    // Show default section
    showDashboard();
    
    // Add event listeners
    document.getElementById('bookForm').addEventListener('submit', handleBookSubmit);
    document.getElementById('searchInput').addEventListener('input', searchBooks);
}

async function loadBooks() {
    try {
        const response = await fetch('http://localhost:3000/books');
        const data = await response.json();
        if (data.success) {
            allBooks = data.books;
            displayBooks(allBooks);
            updateDashboardStats(allBooks);
        }
    } catch (error) {
        console.error('Error loading books:', error);
    }
}

function showDashboard() {
    hideAllSections();
    document.querySelector('.stats-grid').style.display = 'grid';
    document.querySelector('.books-table').closest('.table-container').style.display = 'block';
    setActiveLink('dashboard');
}

function showBooksSection() {
    hideAllSections();
    document.querySelector('.books-table').closest('.table-container').style.display = 'block';
    setActiveLink('books');
}

function hideAllSections() {
    // Hide all main sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.style.display = 'none';
    });
    document.querySelector('.stats-grid').style.display = 'none';
    document.querySelector('.books-table').closest('.table-container').style.display = 'none';
}

function setActiveLink(section) {
    // Remove active class from all links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to current section link
    const activeLink = document.querySelector(`.nav-link[onclick*="${section}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

function showOrdersSection() {
    // Hide all sections first
    document.querySelectorAll('.dashboard-section, .stats-grid, .table-container').forEach(section => {
        section.style.display = 'none';
    });

    // Show orders section
    const ordersSection = document.getElementById('ordersSection');
    if (ordersSection) {
        ordersSection.style.display = 'block';
    }

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const ordersLink = document.querySelector('.nav-link[onclick*="showOrdersSection"]');
    if (ordersLink) {
        ordersLink.classList.add('active');
    }

    // Load orders data
    loadOrders();
}

async function loadOrders() {
    try {
        const response = await fetch('http://localhost:3000/orders');
        const data = await response.json();
        
        if (data.success) {
            allOrders = data.orders;
            displayOrders(allOrders);
            updateOrderStats();
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function displayOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    if (!orders.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-orders">
                    <i class="fas fa-box-open fa-3x"></i>
                    <p>No orders found</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>
                <strong>#${order.id}</strong>
            </td>
            <td>
                <div>
                    <div>${order.user_name}</div>
                    <small class="text-secondary">${order.shipping_address}</small>
                </div>
            </td>
            <td>
                <div class="order-items-list">
                    ${order.items.map(item => `
                        <div class="order-item-row">
                            <span>${item.title}</span>
                            <span>×${item.quantity}</span>
                        </div>
                    `).join('')}
                </div>
            </td>
            <td>
                <strong>$${parseFloat(order.total_amount).toFixed(2)}</strong>
            </td>
            <td>
                <span class="order-status status-${order.status.toLowerCase()}">
                    <i class="fas fa-${getStatusIcon(order.status)}"></i>
                    ${order.status}
                </span>
            </td>
            <td>
                <div>
                    <div>${new Date(order.created_at).toLocaleDateString()}</div>
                    <small class="text-secondary">${new Date(order.created_at).toLocaleTimeString()}</small>
                </div>
            </td>
            <td>
                <select 
                    class="status-select"
                    onchange="updateOrderStatus(${order.id}, this.value)"
                    ${order.status === 'cancelled' ? 'disabled' : ''}
                >
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
        </tr>
    `).join('');
}

function getStatusIcon(status) {
    switch (status.toLowerCase()) {
        case 'pending':
            return 'clock';
        case 'completed':
            return 'check-circle';
        case 'cancelled':
            return 'times-circle';
        default:
            return 'circle';
    }
}

function updateOrderStats() {
    const pending = allOrders.filter(order => order.status === 'pending').length;
    const completed = allOrders.filter(order => order.status === 'completed').length;
    const totalRevenue = allOrders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + parseFloat(order.total_amount), 0);

    document.getElementById('pendingOrders').textContent = pending;
    document.getElementById('completedOrders').textContent = completed;
    document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
}

function filterOrders() {
    const status = document.getElementById('orderStatusFilter').value;
    const filteredOrders = status === 'all' 
        ? allOrders 
        : allOrders.filter(order => order.status === status);
    displayOrders(filteredOrders);
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`http://localhost:3000/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();
        if (data.success) {
            loadOrders(); // Reload orders to update the display
        } else {
            alert('Error updating order status');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error updating order status');
    }
}

// Move all other functions from AdminDashboard.html here...
// Include displayBooks, updateDashboardStats, handleBookSubmit, etc.

// Keep your existing orders-related functions...
async function loadOrders() {
    try {
        const response = await fetch('http://localhost:3000/orders');
        const data = await response.json();
        
        if (data.success) {
            allOrders = data.orders;
            displayOrders(allOrders);
            updateOrderStats();
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// ... rest of your orders-related functions 