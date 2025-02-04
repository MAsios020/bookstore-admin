// Charts initialization
let salesChart, topBooksChart, orderStatusChart, categorySalesChart, customerInsightsChart;

// Initialize all charts
function initializeCharts() {
    // Sales Overview Chart
    const salesCtx = document.getElementById('salesChart').getContext('2d');
    salesChart = new Chart(salesCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Daily Sales',
                data: [],
                borderColor: '#2563eb',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Top Books Chart
    const topBooksCtx = document.getElementById('topBooksChart').getContext('2d');
    topBooksChart = new Chart(topBooksCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Units Sold',
                data: [],
                backgroundColor: '#3b82f6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Order Status Chart
    const orderStatusCtx = document.getElementById('orderStatusChart').getContext('2d');
    orderStatusChart = new Chart(orderStatusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#fbbf24',
                    '#2563eb',
                    '#64748b',
                    '#22c55e',
                    '#ef4444'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Category Sales Chart
    const categorySalesCtx = document.getElementById('categorySalesChart').getContext('2d');
    categorySalesChart = new Chart(categorySalesCtx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#2563eb',
                    '#3b82f6',
                    '#60a5fa',
                    '#93c5fd',
                    '#bfdbfe'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Customer Insights Chart
    const customerInsightsCtx = document.getElementById('customerInsightsChart').getContext('2d');
    customerInsightsChart = new Chart(customerInsightsCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'New Customers',
                data: [],
                borderColor: '#2563eb',
                tension: 0.4
            }, {
                label: 'Returning Customers',
                data: [],
                borderColor: '#22c55e',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Update reports based on selected period
async function updateReports() {
    const period = document.getElementById('reportPeriod').value;
    
    try {
        const response = await fetch(`${config.apiUrl}/reports?period=${period}`);
        const data = await response.json();
        
        if (data.success) {
            updateCharts(data);
            updateStats(data);
            updateTables(data);
        }
    } catch (error) {
        console.error('Error updating reports:', error);
        showError('Failed to update reports');
    }
}

// Export reports to CSV
function exportReports() {
    const period = document.getElementById('reportPeriod').value;
    window.location.href = `${config.apiUrl}/reports/export?period=${period}`;
}

// Add this to your existing loadReports function
function loadReports() {
    initializeCharts();
    updateReports();
} 