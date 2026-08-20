const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// ===== MONGODB CONNECTION =====
// Hardcoded URI for testing (Vercel environment variable issue)
const uri = 'mongodb+srv://db_username:mQJRALPG3UW4EZxTc@cluster0.zes56bz.mongodb.net/scholarshipDB?appName=Cluster0';

console.log('📡 Attempting to connect to MongoDB...');
console.log('🔗 URI:', uri.replace(/:[^:]*@/, ':****@')); // Hide password in logs

const client = new MongoClient(uri);
let db;
let isConnected = false;

async function connectDB() {
    try {
        await client.connect();
        db = client.db('scholarshipDB');
        isConnected = true;
        console.log('✅ MongoDB Connected Successfully!');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        console.error('📋 Full Error:', error);
        isConnected = false;
    }
}

// Connect immediately
connectDB();

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
    res.json({ 
        status: isConnected ? 'healthy' : 'unhealthy',
        mongodb: isConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// ===== DATA SAVE API =====
app.post('/api/save-user', async (req, res) => {
    try {
        if (!isConnected) {
            await connectDB();
        }
        if (!isConnected) {
            return res.json({ success: false, error: 'MongoDB not connected' });
        }
        
        const userData = req.body;
        userData.submittedAt = new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' });
        userData.id = Date.now();
        
        const collection = db.collection('users');
        await collection.insertOne(userData);
        
        const totalUsers = await collection.countDocuments();
        console.log('✅ Data saved! Total users:', totalUsers);
        
        res.json({ success: true, totalUsers: totalUsers });
    } catch (error) {
        console.error('❌ Error saving data:', error.message);
        res.json({ success: false, error: error.message });
    }
});

// ===== GET USERS API =====
app.get('/api/users', async (req, res) => {
    try {
        if (!isConnected) {
            await connectDB();
        }
        if (!isConnected) {
            return res.json([]);
        }
        const collection = db.collection('users');
        const users = await collection.find().toArray();
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