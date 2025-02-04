const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Create a simple default profile image using data URL
const defaultImagePath = path.join(uploadsDir, 'default-profile.png');
if (!fs.existsSync(defaultImagePath)) {
    // Copy from an existing default image or create a new one
    fs.copyFileSync(
        path.join(__dirname, 'assets', 'default-profile.png'), // Make sure this exists
        defaultImagePath
    );
}

console.log('Default files setup complete'); 