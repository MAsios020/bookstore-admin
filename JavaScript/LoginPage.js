document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Reset error messages
    document.querySelectorAll('.error-message').forEach(error => {
        error.style.display = 'none';
    });

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    let hasError = false;

    // Email validation
    if (!email.match(/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/)) {
        document.getElementById('emailError').textContent = 'Please enter a valid email address';
        document.getElementById('emailError').style.display = 'block';
        hasError = true;
    }

    // Password validation
    if (password.length < 6) {
        document.getElementById('passwordError').textContent = 'Password must be at least 6 characters long';
        document.getElementById('passwordError').style.display = 'block';
        hasError = true;
    }

    if (!hasError) {
        // Add loading state to button
        const button = document.querySelector('.login-button');
        const originalText = button.textContent;
        button.textContent = 'Logging in...';
        button.disabled = true;

        try {
            // Make API call using fetch
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            console.log('Login successful:', data);

            // Store user data in localStorage
            localStorage.setItem('userData', JSON.stringify(data.user));

            // Redirect to dashboard
            window.location.href = 'DashboardPage.html';
        } catch (error) {
            console.error('Error during login:', error);
            // Display error message to user
            document.getElementById('loginError').textContent = 'Login failed. Please try again.';
            document.getElementById('loginError').style.display = 'block';
        } finally {
            // Reset button state
            button.textContent = originalText;
            button.disabled = false;
        }
    }
});

// Add ripple effect to button
document.querySelector('.login-button').addEventListener('click', function(e) {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size/2;
    const y = e.clientY - rect.top - size/2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    button.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
});

// Forgot password handler
document.getElementById('forgotPassword').addEventListener('click', function(e) {
    e.preventDefault();
    // Add your forgot password logic here
    alert('Forgot password functionality will be implemented here');
});

// Hide label when input is not empty
document.querySelectorAll('.form-group input').forEach(input => {
    input.addEventListener('input', function() {
        if (this.value !== '') {
            this.nextElementSibling.style.top = '-10px';
            this.nextElementSibling.style.left = '10px';
            this.nextElementSibling.style.fontSize = '0.8rem';
            this.nextElementSibling.style.background = 'white';
            this.nextElementSibling.style.padding = '0 5px';
            this.nextElementSibling.style.color = '#2980b9';
        } else {
            this.nextElementSibling.style.top = '50%';
            this.nextElementSibling.style.left = '12px';
            this.nextElementSibling.style.fontSize = '1rem';
            this.nextElementSibling.style.background = 'transparent';
            this.nextElementSibling.style.padding = '0';
            this.nextElementSibling.style.color = '#666';
        }
    });
});