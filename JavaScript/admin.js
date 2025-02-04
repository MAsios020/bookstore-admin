function checkAdminStatus() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    if (!userData) {
        window.location.href = 'LoginPage.html';
        return;
    }
    
    if (!userData.is_admin) {
        window.location.href = 'HomePage.html';
        return;
    }
}

function logout() {
    localStorage.removeItem('userData');
    window.location.href = 'LoginPage.html';
} 