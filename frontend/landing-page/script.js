// Mobile Navigation
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Scroll to section function
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Clear form fields
function clearForm(formId) {
    const form = document.getElementById(formId);
    form.reset();
    
    // Clear password strength indicator
    const strengthDiv = document.getElementById('passwordStrength');
    if (strengthDiv) {
        strengthDiv.style.display = 'none';
        strengthDiv.className = 'password-strength';
    }
    
    // Reset input border colors
    form.querySelectorAll('input').forEach(input => {
        input.style.borderColor = 'rgba(0, 255, 255, 0.3)';
    });
    
    // Reset password toggles to hidden state
    form.querySelectorAll('input[type="text"]').forEach(input => {
        if (input.id.includes('Password')) {
            input.type = 'password';
            const toggle = input.nextElementSibling;
            if (toggle && toggle.classList.contains('password-toggle')) {
                const icon = toggle.querySelector('i');
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        }
    });
}

// Password Toggle Function
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input.nextElementSibling;
    const icon = toggle.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Password Strength Checker
function checkPasswordStrength(password) {
    let score = 0;
    let feedback = '';
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // Determine strength
    if (score < 3) {
        return { strength: 'weak', message: '🔴 Weak - Add uppercase, numbers, and symbols' };
    } else if (score < 4) {
        return { strength: 'medium', message: '🟡 Medium - Add more character variety' };
    } else if (score < 6) {
        return { strength: 'strong', message: '🟢 Strong - Good password!' };
    } else {
        return { strength: 'very-strong', message: '🔵 Very Strong - Excellent password!' };
    }
}

// Email validation - Allow only legitimate providers
const allowedEmailProviders = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com',
    'icloud.com', 'protonmail.com', 'zoho.com', 'aol.com'
];

const tempEmailProviders = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com',
    'temp-mail.org', 'throwaway.email', 'getnada.com', 'maildrop.cc',
    'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'pokemail.net',
    'spam4.me', 'bccto.me', 'chacuo.net', 'dispostable.com', 'fakeinbox.com'
];

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
        return { valid: false, message: 'Please enter a valid email address.' };
    }
    
    const domain = email.split('@')[1].toLowerCase();
    
    // Check if it's a temporary email provider
    if (tempEmailProviders.includes(domain)) {
        return { valid: false, message: 'Temporary email addresses are not allowed. Please use a permanent email.' };
    }
    
    // Check if it's an allowed provider
    if (!allowedEmailProviders.includes(domain)) {
        return { valid: false, message: 'Please use a valid email provider (Gmail, Yahoo, Outlook, etc.).' };
    }
    
    return { valid: true };
}

// Authentication Functions
function openLoginModal() {
    document.getElementById('loginModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function openSignupModal() {
    document.getElementById('signupModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
    document.body.style.overflow = 'auto';
    clearMessages();
    
    // Clear form fields when closing
    if (modalId === 'signupModal') {
        clearForm('signupForm');
    } else if (modalId === 'loginModal') {
        clearForm('loginForm');
    }
}

function switchToSignup() {
    closeModal('loginModal');
    openSignupModal();
}

function switchToLogin() {
    closeModal('signupModal');
    openLoginModal();
}

function showMessage(message, type, formId) {
    clearMessages();
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    const form = document.getElementById(formId);
    form.insertBefore(messageDiv, form.firstChild);
}

function clearMessages() {
    document.querySelectorAll('.message').forEach(msg => msg.remove());
}

// Simple user storage (in real app, use backend)
const users = JSON.parse(localStorage.getItem('cyberDefenseUsers') || '[]');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

// Login Form Handler
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Find user
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMessage('Login successful! Welcome back.', 'success', 'loginForm');
        
        setTimeout(() => {
            closeModal('loginModal');
            updateAuthUI();
        }, 1500);
    } else {
        showMessage('Invalid email or password.', 'error', 'loginForm');
    }
});

// Signup Form Handler
document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    // Email validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
        showMessage(emailValidation.message, 'error', 'signupForm');
        return;
    }
    
    // Password validation
    if (password !== confirmPassword) {
        showMessage('Passwords do not match.', 'error', 'signupForm');
        return;
    }
    
    const passwordCheck = checkPasswordStrength(password);
    if (passwordCheck.strength === 'weak') {
        showMessage('Password is too weak. Please create a stronger password.', 'error', 'signupForm');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters.', 'error', 'signupForm');
        return;
    }
    
    // Check if user exists
    if (users.find(u => u.email === email)) {
        showMessage('User with this email already exists.', 'error', 'signupForm');
        return;
    }
    
    // Create new user
    const newUser = { name, email, password, joinDate: new Date().toISOString() };
    users.push(newUser);
    localStorage.setItem('cyberDefenseUsers', JSON.stringify(users));
    
    showMessage('Account created successfully! You can now login.', 'success', 'signupForm');
    
    setTimeout(() => {
        closeModal('signupModal');
        openLoginModal();
    }, 1500);
});

// Real-time email validation for signup
document.getElementById('signupEmail').addEventListener('blur', function() {
    const email = this.value;
    if (email) {
        const validation = validateEmail(email);
        if (!validation.valid) {
            this.style.borderColor = '#ff4444';
            showMessage(validation.message, 'error', 'signupForm');
        } else {
            this.style.borderColor = '#00ff7f';
            clearMessages();
        }
    }
});

// Real-time password strength checking
document.getElementById('signupPassword').addEventListener('input', function() {
    const password = this.value;
    const strengthDiv = document.getElementById('passwordStrength');
    
    if (password.length > 0) {
        const result = checkPasswordStrength(password);
        strengthDiv.className = `password-strength ${result.strength}`;
        strengthDiv.textContent = result.message;
        strengthDiv.style.display = 'block';
    } else {
        strengthDiv.style.display = 'none';
    }
});

// Update Auth UI
function updateAuthUI() {
    const authButtons = document.querySelector('.auth-buttons');
    
    if (currentUser) {
        authButtons.innerHTML = `
            <span class="user-welcome">Welcome, ${currentUser.name}</span>
            <button class="logout-btn" onclick="logout()">Logout</button>
        `;
    } else {
        authButtons.innerHTML = `
            <button class="login-btn" onclick="openLoginModal()">Login</button>
            <button class="signup-btn" onclick="openSignupModal()">Sign Up</button>
        `;
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthUI();
    showNotification('Logged out successfully!');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(45deg, #00ffff, #00ff7f);
        color: #0a0a0a;
        padding: 1rem 2rem;
        border-radius: 25px;
        font-weight: bold;
        z-index: 4000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Close modals on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal(this.id);
        }
    });
});

// Close modals on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
            closeModal(modal.id);
        });
        closeModule();
    }
});

// Module URLs
const MODULE_URLS = {
    anomaly: 'https://nitedu.in/anomaly',
    phishing: 'https://nitedu.in/phishing', 
    insider: 'https://nitedu.in/insider'
};

function loadModule(moduleType) {
    if (!currentUser) {
        showNotification('Please login to access the dashboard');
        openLoginModal();
        return;
    }
    
    const container = document.getElementById('module-container');
    const frame = document.getElementById('module-frame');
    
    if (MODULE_URLS[moduleType] && moduleType === 'anomaly') {
        frame.src = MODULE_URLS[moduleType];
        container.classList.remove('hidden');
    } else {
        showNotification(`${moduleType} module is under development by the team`);
    }
}

function closeModule() {
    document.getElementById('module-container').classList.add('hidden');
}

// Close module on background click
document.getElementById('module-container').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModule();
    }
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(0, 0, 0, 0.4)';
    } else {
        navbar.style.background = 'rgba(0, 0, 0, 0.2)';
    }
});

// Intersection Observer for animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, {
    threshold: 0.1
});

// Observe all cards for animation
document.querySelectorAll('.feature-card, .analytics-card, .why-card, .team-member').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'all 0.6s ease';
    observer.observe(card);
});

// Counter animation for metrics
function animateCounter(element, target, suffix = '') {
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + suffix;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current) + suffix;
        }
    }, 20);
}

// Animate counters when they come into view
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const metric = entry.target.querySelector('.metric');
            const statNumber = entry.target.querySelector('.stat-number');
            
            if (metric) {
                const text = metric.textContent;
                if (text.includes('%')) {
                    animateCounter(metric, parseInt(text), '%');
                } else if (text.includes('s')) {
                    metric.textContent = '0.3s';
                } else {
                    animateCounter(metric, parseInt(text));
                }
            }
            
            if (statNumber) {
                const text = statNumber.textContent;
                if (text.includes('%')) {
                    animateCounter(statNumber, parseFloat(text), '%');
                } else if (!isNaN(parseInt(text))) {
                    animateCounter(statNumber, parseInt(text));
                }
            }
        }
    });
}, { threshold: 0.5 });

// Observe analytics cards and stats
document.querySelectorAll('.analytics-card, .stat').forEach(card => {
    counterObserver.observe(card);
});

// Particle animation for background
function createParticle() {
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.width = '2px';
    particle.style.height = '2px';
    particle.style.background = '#00ffff';
    particle.style.borderRadius = '50%';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '-1';
    particle.style.left = Math.random() * window.innerWidth + 'px';
    particle.style.top = window.innerHeight + 'px';
    particle.style.opacity = Math.random();
    
    document.body.appendChild(particle);
    
    const animation = particle.animate([
        { transform: 'translateY(0px)', opacity: particle.style.opacity },
        { transform: `translateY(-${window.innerHeight + 100}px)`, opacity: 0 }
    ], {
        duration: Math.random() * 3000 + 2000,
        easing: 'linear'
    });
    
    animation.onfinish = () => particle.remove();
}

// Create particles periodically
setInterval(createParticle, 300);

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .user-welcome {
        color: #00ff7f;
        font-weight: 500;
        margin-right: 1rem;
    }
    
    .logout-btn {
        padding: 0.5rem 1.5rem;
        background: transparent;
        color: #ff4444;
        border: 1px solid #ff4444;
        border-radius: 25px;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .logout-btn:hover {
        background: #ff4444;
        color: white;
    }
`;
document.head.appendChild(style);

// Initialize auth UI on page load
document.addEventListener('DOMContentLoaded', updateAuthUI);