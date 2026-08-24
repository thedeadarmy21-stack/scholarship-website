const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// ===== VERCEL BLOB STORAGE =====
const { put, head } = require('@vercel/blob');
const BLOB_KEY = 'users-data.json';

// ===== READ USERS FROM BLOB =====
async function readUsers() {
    try {
        const { url } = await head(BLOB_KEY);
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.log('📂 No existing blob, starting fresh');
        return [];
    }
}

// ===== WRITE USERS TO BLOB =====
async function writeUsers(users) {
    const blob = await put(BLOB_KEY, JSON.stringify(users, null, 2), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
    });
    return blob.url;
}

// ============================================================
// ===== API ROUTES =====
// ============================================================

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        storage: 'Vercel Blob (Public)',
        timestamp: new Date().toISOString()
    });
});

// ===== SAVE USER DATA - MERGE BY ID =====
app.post('/api/save-user', async (req, res) => {
    try {
        const userData = req.body;
        userData.submittedAt = new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' });

        console.log('📥 Received data:', userData);

        let users = await readUsers();
        
        // Check if user already exists by ID
        const existingIndex = users.findIndex(u => u.id === userData.id);
        
        if (existingIndex !== -1) {
            // Merge data with existing user
            users[existingIndex] = { ...users[existingIndex], ...userData };
            console.log('✅ User updated:', userData.id);
        } else {
            // New user
            users.push(userData);
            console.log('✅ New user added:', userData.id);
        }

        await writeUsers(users);
        console.log('✅ Data saved! Total:', users.length);
        res.status(200).json({ success: true, totalUsers: users.length });
        
    } catch (error) {
        console.error('❌ Error saving data:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ===== GET ALL USERS =====
app.get('/api/users', async (req, res) => {
    try {
        const users = await readUsers();
        res.json(users);
    } catch (error) {
        console.error('❌ Error reading users:', error.message);
        res.json([]);
    }
});

// ===== CLEAR ALL DATA =====
app.delete('/api/clear-data', async (req, res) => {
    try {
        await writeUsers([]);
        console.log('🗑️ All data cleared!');
        res.json({ success: true, message: 'All data cleared!' });
    } catch (error) {
        console.error('❌ Error clearing data:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================================
// ===== FRONTEND ROUTES =====
// ============================================================

// ===== ADMIN PANEL =====
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// ===== CATCH ALL - SPA SUPPORT =====
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ============================================================
// ===== EXPORT FOR VERCEL =====
// ============================================================

module.exports = app;