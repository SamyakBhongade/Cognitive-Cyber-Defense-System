# 👥 Team Integration Guide

## 🚀 GitHub Repository Setup

### Step 1: Create GitHub Repository
1. Go to GitHub.com → New Repository
2. Name: `cognitive-cyber-defense`
3. Description: `AI-Powered Cyber Defense System - Team Project`
4. Public repository
5. Initialize with README

### Step 2: Add Team Members
1. Repository → Settings → Collaborators
2. Add Rushabh and Riddhi with Write access

### Step 3: Push Current Code
```bash
git remote add origin https://github.com/[username]/cognitive-cyber-defense.git
git add .
git commit -m "feat: Initial team structure with landing page"
git push -u origin main
```

## 📁 Team Workflow

### Samyak (Anomaly Detection)
- ✅ Backend deployed on Render
- ✅ Domain: nitedu.in
- 🔄 Build anomaly dashboard
- 🔄 Integrate with landing page

### Rushabh (Phishing Detection)
- 📂 Work in: `backend/phishing-api/`
- 📂 Dashboard: `frontend/phishing-dashboard/`
- 🎯 Deploy to: `nitedu-phishing.onrender.com`

### Riddhi (Insider Threat)
- 📂 Work in: `backend/insider-api/`
- 📂 Dashboard: `frontend/insider-dashboard/`
- 🎯 Deploy to: `nitedu-insider.onrender.com`

## 🔗 Integration Strategy

### Landing Page Routes
- `/` → Main landing with 3 cards
- `/anomaly` → Samyak's dashboard
- `/phishing` → Rushabh's dashboard  
- `/insider` → Riddhi's dashboard

### API Endpoints
```javascript
const API_ENDPOINTS = {
  anomaly: 'https://nitedu-anomaly-detection.onrender.com',
  phishing: 'https://nitedu-phishing.onrender.com',
  insider: 'https://nitedu-insider.onrender.com'
};
```

## 📋 Next Steps
1. Create GitHub repository
2. Share with team members
3. Each member clones and works in their folder
4. Deploy individual backends
5. Integrate dashboards with landing page