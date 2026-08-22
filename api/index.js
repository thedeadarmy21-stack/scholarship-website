const express = require('express');
const { put, head, del } = require('@vercel/blob');
const path = require('path');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// ===== BLOB KEY =====
const BLOB_KEY = 'users-data.json';

// ===== READ DATA FROM BLOB =====
async function readUsersFromBlob() {
    try {
        const { url } = await head(BLOB_KEY);
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        return [];
    }
}

// ===== WRITE DATA TO BLOB =====
async function writeUsersToBlob(users) {
    const blob = await put(BLOB_KEY, JSON.stringify(users, null, 2), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
    });
    return blob.url;
}

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        storage: 'Vercel Blob',
        timestamp: new Date().toISOString()
    });
});

// ===== DATA SAVE API =====
app.post('/api/save-user', async (req, res) => {
    try {
        const userData = req.body;
        userData.submittedAt = new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' });
        userData.id = Date.now();

        // Read existing users
        let users = await readUsersFromBlob();
        users.push(userData);

        // Write to blob
        const url = await writeUsersToBlob(users);

        console.log('✅ Data saved! Total users:', users.length);
        res.json({ success: true, totalUsers: users.length, url: url });
    } catch (error) {
        console.error('❌ Error saving data:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== GET USERS API =====
app.get('/api/users', async (req, res) => {
    try {
        const users = await readUsersFromBlob();
        res.json(users);
    } catch (error) {
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