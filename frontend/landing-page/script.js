const MODULE_URLS = {
    anomaly: 'https://nitedu.in/anomaly',
    phishing: 'https://nitedu.in/phishing', 
    insider: 'https://nitedu.in/insider'
};

function loadModule(moduleType) {
    const container = document.getElementById('module-container');
    const frame = document.getElementById('module-frame');
    
    if (MODULE_URLS[moduleType]) {
        frame.src = MODULE_URLS[moduleType];
        container.classList.remove('hidden');
    } else {
        alert(`${moduleType} module is under development`);
    }
}

// Close module on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.getElementById('module-container').classList.add('hidden');
    }
});

// Close module on background click
document.getElementById('module-container').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.add('hidden');
    }
});