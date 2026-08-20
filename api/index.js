const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// ===== DATA SAVE API =====
app.post('/api/save-user', (req, res) => {
    try {
        const userData = req.body;
        userData.submittedAt = new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' });
        userData.id = Date.now();
        
        const filePath = path.join(__dirname, '../users-data.json');
        let allUsers = [];
        try {
            const fileData = fs.readFileSync(filePath, 'utf8');
            allUsers = JSON.parse(fileData);
        } catch (err) {
            allUsers = [];
        }
        
        allUsers.push(userData);
        fs.writeFileSync(filePath, JSON.stringify(allUsers, null, 2));
        
        res.json({ success: true, totalUsers: allUsers.length });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// ===== GET USERS API =====
app.get('/api/users', (req, res) => {
    try {
        const filePath = path.join(__dirname, '../users-data.json');
        console.log('📂 Looking for file at:', filePath);
        
        let users = [];
        try {
            const fileData = fs.readFileSync(filePath, 'utf8');
            users = JSON.parse(fileData);
            console.log('📤 Sending users:', users.length);
        } catch (err) {
            console.log('📄 File not found or empty');
            users = [];
        }
        res.json(users);
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.json([]);
    }
});

// ===== ADMIN PANEL =====
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// ===== CATCH ALL =====
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;