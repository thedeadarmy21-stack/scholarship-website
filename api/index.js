const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// ===== VERCEL BLOB STORAGE =====
const { put, head } = require('@vercel/blob');
const BLOB_KEY = 'users-data.json';

async function readUsers() {
    try {
        const { url } = await head(BLOB_KEY);
        const response = await fetch(url);
        return await response.json();
    } catch {
        return [];
    }
}

async function writeUsers(users) {
    const blob = await put(BLOB_KEY, JSON.stringify(users, null, 2), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
    });
    return blob.url;
}

// ===== API ROUTES =====
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', storage: 'Vercel Blob', timestamp: new Date().toISOString() });
});

app.post('/api/save-user', async (req, res) => {
    try {
        const userData = req.body;
        userData.submittedAt = new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' });
        userData.id = Date.now();

        let users = await readUsers();
        users.push(userData);
        await writeUsers(users);

        console.log('✅ Data saved! Total:', users.length);
        res.json({ success: true, totalUsers: users.length });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await readUsers();
        res.json(users);
    } catch {
        res.json([]);
    }
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;