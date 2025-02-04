document.addEventListener('DOMContentLoaded', () => {
    displayOrderSummary();
    prefillUserData();
});

function displayOrderSummary() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const orderItems = document.getElementById('orderItems');
    const orderTotal = document.getElementById('orderTotal');
    
    if (cart.length === 0) {
        window.location.href = 'StorePage.html';
        return;
    }
    
    orderItems.innerHTML = cart.map(item => `
        <div class="order-item">
            <img src="${item.image_url || '../images/default-book.jpg'}" alt="${item.title}">
            <div class="order-item-info">
                <div class="order-item-title">${item.title}</div>
                <div class="order-item-price">$${item.price} × ${item.quantity}</div>
            </div>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    orderTotal.textContent = `$${total.toFixed(2)}`;
}

function prefillUserData() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.fullname) {
        document.getElementById('fullName').value = userData.fullname;
    }
    if (userData.email) {
        document.getElementById('email').value = userData.email;
    }
    if (userData.address) {
        document.getElementById('address').value = userData.address;
    }
    if (userData.phonenumber) {
        document.getElementById('phone').value = userData.phonenumber;
    }
}

async function processOrder(event) {
    event.preventDefault();
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (!userData.id) {
        alert('Please login to place an order');
        window.location.href = 'LoginPage.html';
        return;
    }

    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const orderData = {
        user_id: userData.id,
        total_amount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        shipping_address: document.getElementById('address').value,
        shipping_city: document.getElementById('city').value,
        shipping_state: document.getElementById('state').value,
        shipping_zip: document.getElementById('zipCode').value,
        shipping_phone: document.getElementById('phone').value,
        items: cart.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price
        }))
    };

    console.log('Sending order data:', orderData); // Debug log

    try {
        const response = await fetch('http://localhost:3000/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const data = await response.json();
        console.log('Server response:', data); // Debug log
        
        if (data.success) {
            alert('Order placed successfully! Order ID: ' + data.orderId);
            localStorage.removeItem('cart');
            window.location.href = 'StorePage.html';
        } else {
            alert('Error placing order: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error placing order. Please try again.');
    }
} 