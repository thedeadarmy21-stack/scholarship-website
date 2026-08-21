const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// ===== SUPABASE CONNECTION =====
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials missing!');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ===== DATA SAVE API =====
app.post('/api/save-user', async (req, res) => {
    try {
        const userData = req.body;
        userData.submittedAt = new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' });

        const { data, error } = await supabase
            .from('users')
            .insert([userData])
            .select();

        if (error) {
            console.error('❌ Supabase Error:', error);
            return res.status(400).json({ success: false, error: error.message });
        }

        console.log('✅ Data saved!', data);
        res.json({ success: true, data: data });
    } catch (error) {
        console.error('❌ Error saving data:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== GET USERS API =====
app.get('/api/users', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Supabase Error:', error);
            return res.json([]);
        }

        res.json(data);
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