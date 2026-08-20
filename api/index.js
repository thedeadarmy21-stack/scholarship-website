const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '50mb' }));

// ===== STATIC FILES =====
app.use(express.static(path.join(__dirname, '../public')));

// ===== DATA SAVE KARNE KA API =====
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
        
        res.json({ success: true, totalUsers: allUsers.length, message: 'Data saved!' });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// ===== SAB USERS DEKHNE KA API =====
app.get('/api/users', (req, res) => {
    try {
        const filePath = path.join(__dirname, '../users-data.json');
        let users = [];
        try {
            const fileData = fs.readFileSync(filePath, 'utf8');
            users = JSON.parse(fileData);
        } catch (err) {
            users = [];
        }
        res.json(users);
    } catch (error) {
        res.json([]);
    }
});

// ===== ADMIN PANEL =====
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// ===== DEFAULT ROUTE =====
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;