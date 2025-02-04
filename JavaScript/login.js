async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Check if user is admin and redirect accordingly
            if (data.user.is_admin) {
                localStorage.setItem('admin', 'true');
                window.location.href = 'AdminDashboard.html';
            } else {
                window.location.href = 'index.html';
            }
        } else {
            errorMessage.textContent = data.message || 'Invalid email or password';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = 'An error occurred during login';
        errorMessage.style.display = 'block';
    }
}

// Clear error message when user starts typing
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
        document.getElementById('errorMessage').style.display = 'none';
    });
}); 