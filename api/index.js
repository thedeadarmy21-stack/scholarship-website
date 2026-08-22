const express = require('express');
const { put, head } = require('@vercel/blob');
const path = require('path');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// ===== BLOB KEY =====
const BLOB_KEY = 'users-data.json';

// ===== READ DATA FROM BLOB =====
async function readUsersFromBlob() {
    try {
        console.log('📂 Reading from blob...');
        console.log('📂 BLOB_KEY:', BLOB_KEY);
        const { url } = await head(BLOB_KEY);
        console.log('📂 Blob URL:', url);
        const response = await fetch(url);
        const data = await response.json();
        console.log('📂 Users found:', data.length);
        return data;
    } catch (error) {
        console.log('📂 No existing blob, returning empty array');
        console.log('📂 Error:', error.message);
        return [];
    }
}

// ===== WRITE DATA TO BLOB =====
async function writeUsersToBlob(users) {
    console.log('📤 Writing to blob...');
    console.log('📤 Users count:', users.length);
    const blob = await put(BLOB_KEY, JSON.stringify(users, null, 2), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
    });
    console.log('📤 Blob URL:', blob.url);
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
        console.log('📥 Received data:', req.body);
        
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
        console.error('❌ Full error:', error);
        res.status(500).json({ success: false, error: error.message, stack: error.stack });
    }
});

// ===== GET USERS API =====
app.get('/api/users', async (req, res) => {
    try {
        const users = await readUsersFromBlob();
        console.log('📤 Sending users:', users.length);
        res.json(users);
    } catch (error) {
        console.error('❌ Error reading users:', error.message);
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