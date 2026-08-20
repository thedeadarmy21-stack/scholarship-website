const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// ============================================================
// ===== DATA SAVE API =====
// ============================================================
app.post('/api/save-user', (req, res) => {
    try {
        console.log('📥 Data received:', req.body);
        
        const userData = req.body;
        userData.submittedAt = new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' });
        userData.id = Date.now();
        
        const filePath = path.join(__dirname, '../users-data.json');
        console.log('📂 Saving to:', filePath);
        
        let allUsers = [];
        try {
            const fileData = fs.readFileSync(filePath, 'utf8');
            allUsers = JSON.parse(fileData);
            console.log('📄 Existing users:', allUsers.length);
        } catch (err) {
            console.log('📄 No existing file, creating new');
            allUsers = [];
        }
        
        allUsers.push(userData);
        fs.writeFileSync(filePath, JSON.stringify(allUsers, null, 2));
        console.log('✅ Data saved! Total users:', allUsers.length);
        
        res.json({ 
            success: true, 
            totalUsers: allUsers.length, 
            message: 'Data saved successfully!',
            savedData: userData
        });
    } catch (error) {
        console.error('❌ Error saving data:', error.message);
        res.json({ 
            success: false, 
            error: error.message,
            stack: error.stack
        });
    }
});

// ============================================================
// ===== GET USERS API =====
// ============================================================
app.get('/api/users', (req, res) => {
    try {
        const filePath = path.join(__dirname, '../users-data.json');
        console.log('📂 Reading from:', filePath);
        
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
        console.error('❌ Error reading users:', error.message);
        res.json([]);
    }
});

// ============================================================
// ===== DIAGNOSTIC API - REAL PROBLEM BATAYEGA =====
// ============================================================
app.get('/api/debug', (req, res) => {
    try {
        const filePath = path.join(__dirname, '../users-data.json');
        const dirPath = path.dirname(filePath);
        
        const result = {
            timestamp: new Date().toISOString(),
            filePath: filePath,
            dirPath: dirPath,
            fileExists: fs.existsSync(filePath),
            directoryExists: fs.existsSync(dirPath),
            cwd: process.cwd(),
            __dirname: __dirname,
            nodeVersion: process.version,
            platform: process.platform
        };
        
        // Agar file exist karti hai toh content bhi dikhayein
        if (fs.existsSync(filePath)) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                result.content = JSON.parse(content);
                result.contentLength = content.length;
                result.fileSizeKB = (content.length / 1024).toFixed(2);
            } catch (readError) {
                result.readError = readError.message;
            }
        }
        
        // Directory mein files list karein
        try {
            const files = fs.readdirSync(dirPath);
            result.filesInDirectory = files.filter(f => f.endsWith('.json'));
        } catch (dirError) {
            result.dirError = dirError.message;
        }
        
        res.json(result);
    } catch (error) {
        res.json({ 
            error: error.message, 
            stack: error.stack 
        });
    }
});

// ============================================================
// ===== CLEAR DATA API (Testing Ke Liye) =====
// ============================================================
app.delete('/api/clear-data', (req, res) => {
    try {
        const filePath = path.join(__dirname, '../users-data.json');
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true, message: 'Data cleared successfully!' });
        } else {
            res.json({ success: true, message: 'No data file found.' });
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// ============================================================
// ===== ADMIN PANEL =====
// ============================================================
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// ============================================================
// ===== HEALTH CHECK =====
// ============================================================
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ============================================================
// ===== CATCH ALL - SPA SUPPORT =====
// ============================================================
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ============================================================
// ===== EXPORT FOR VERCEL =====
// ============================================================
module.exports = app;