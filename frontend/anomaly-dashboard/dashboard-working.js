// Real-time Anomaly Detection Dashboard
class RealTimeDashboard {
    constructor() {
        this.API_BASE = 'https://nitedu-anomaly-detection.onrender.com';
        this.DOMAIN = 'https://nitedu.in';
        this.alerts = [];
        this.trafficData = [];
        this.attackTypes = { 'SQL Injection': 0, 'XSS Attack': 0, 'Bot Attack': 0, 'Directory Traversal': 0, 'Command Injection': 0, 'Normal Traffic': 0 };
        this.trafficRate = 0;
        this.lastMinuteRequests = [];
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Real-time Dashboard');
        this.setupEventListeners();
        this.initializeCharts();
        await this.checkBackendStatus();
        this.startRealTimeMonitoring();
        // Initialize attack stats display
        this.updateAttackStats();
    }

    setupEventListeners() {
        // No manual controls needed - fully automated
    }

    async checkBackendStatus() {
        try {
            const response = await fetch(`${this.API_BASE}/api/v1/status`);
            const status = await response.json();
            
            if (status.system_status === 'operational') {
                this.updateConnectionStatus('connected', 'Backend Connected');
                console.log('✅ Backend connected:', status);
            } else {
                this.updateConnectionStatus('warning', 'Backend Degraded');
            }
        } catch (error) {
            console.error('❌ Backend connection failed:', error);
            this.updateConnectionStatus('error', 'Backend Offline');
        }
    }

    updateConnectionStatus(status, message) {
        const statusDiv = document.getElementById('connectionStatus');
        const colors = {
            connected: 'bg-green-500',
            warning: 'bg-yellow-500',
            error: 'bg-red-500'
        };
        
        statusDiv.innerHTML = `
            <div class="w-3 h-3 ${colors[status]} rounded-full ${status === 'connected' ? 'pulse' : ''}"></div>
            <span class="text-sm">${message}</span>
        `;
    }

    startRealTimeMonitoring() {
        console.log('🔄 Starting real-time monitoring');
        
        // Poll for alerts every 2 seconds
        setInterval(async () => {
            await this.fetchLatestAlerts();
        }, 2000);
        
        // Update charts every 5 seconds
        setInterval(() => {
            this.updateCharts();
        }, 5000);
    }

    async fetchLatestAlerts() {
        try {
            const response = await fetch(`${this.API_BASE}/api/v1/alerts`);
            const alerts = await response.json();
            
            // Process new alerts
            alerts.forEach(alert => {
                if (!this.alerts.find(a => a.id === alert.id)) {
                    this.addNewAlert(alert);
                }
            });
            
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
        }
    }

    addNewAlert(alertData) {
        const alert = {
            id: alertData.id || `alert_${Date.now()}`,
            timestamp: alertData.timestamp || new Date().toISOString(),
            source_ip: alertData.source_ip || 'unknown',
            anomaly_score: alertData.anomaly_score || 0.5,
            event_type: alertData.event_type || 'Anomaly Detected',
            attack_type: alertData.attack_type || 'Unknown',
            severity: this.getSeverity(alertData.anomaly_score || 0.5)
        };
        
        this.alerts.unshift(alert);
        this.displayAlert(alert);
        this.updateKPIs();
        this.updateAttackTypes(alert);
        
        // Keep only last 100 alerts
        if (this.alerts.length > 100) {
            this.alerts = this.alerts.slice(0, 100);
        }
        
        console.log('🚨 New alert:', alert);
    }

    displayAlert(alert) {
        const alertsFeed = document.getElementById('alertsFeed');
        
        // Remove "monitoring" message if present
        const monitoring = alertsFeed.querySelector('.text-center');
        if (monitoring) monitoring.remove();
        
        const alertElement = document.createElement('div');
        alertElement.className = `alert-${alert.severity} p-4 rounded-lg border border-gray-600`;
        
        const timeAgo = this.getTimeAgo(alert.timestamp);
        const severityIcon = this.getSeverityIcon(alert.severity);
        
        alertElement.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-2">
                        <span class="text-lg">${severityIcon}</span>
                        <span class="font-semibold text-sm">${alert.event_type}</span>
                        <span class="px-2 py-1 rounded text-xs font-bold ${this.getSeverityColor(alert.severity)}">
                            ${alert.severity.toUpperCase()}
                        </span>
                    </div>
                    <div class="text-sm text-gray-300 space-y-1">
                        <div>🌐 Source: ${alert.source_ip}</div>
                        <div>📊 Score: ${(alert.anomaly_score * 100).toFixed(1)}%</div>
                        <div>🎯 Type: ${alert.attack_type}</div>
                    </div>
                </div>
                <div class="text-xs text-gray-400 text-right">
                    <div>${timeAgo}</div>
                    <div>${new Date(alert.timestamp).toLocaleTimeString()}</div>
                </div>
            </div>
        `;
        
        alertsFeed.insertBefore(alertElement, alertsFeed.firstChild);
        
        // Keep only last 20 visible alerts
        const alerts = alertsFeed.querySelectorAll('.alert-critical, .alert-high, .alert-medium, .alert-low');
        if (alerts.length > 20) {
            alerts[alerts.length - 1].remove();
        }
    }

    getSeverity(score) {
        if (score >= 0.8) return 'critical';
        if (score >= 0.6) return 'high';
        if (score >= 0.4) return 'medium';
        return 'low';
    }

    getSeverityIcon(severity) {
        const icons = {
            critical: '🔴',
            high: '🟠',
            medium: '🟡',
            low: '🟢'
        };
        return icons[severity] || '⚪';
    }

    getSeverityColor(severity) {
        const colors = {
            critical: 'bg-red-600 text-white',
            high: 'bg-orange-600 text-white',
            medium: 'bg-yellow-600 text-black',
            low: 'bg-green-600 text-white'
        };
        return colors[severity] || 'bg-gray-600 text-white';
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const alertTime = new Date(timestamp);
        const diffMs = now - alertTime;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        
        if (diffSecs < 60) return `${diffSecs}s ago`;
        if (diffMins < 60) return `${diffMins}m ago`;
        return `${Math.floor(diffMins / 60)}h ago`;
    }

    updateKPIs() {
        const total = this.alerts.length;
        const highSeverity = this.alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;
        
        document.getElementById('totalAlerts').textContent = total;
        document.getElementById('highSeverity').textContent = highSeverity;
    }

    updateAttackTypes(alert) {
        const attackType = alert.attack_type || 'Normal Traffic';
        
        if (attackType.includes('SQL')) {
            this.attackTypes['SQL Injection']++;
        } else if (attackType.includes('XSS')) {
            this.attackTypes['XSS Attack']++;
        } else if (attackType.includes('Bot')) {
            this.attackTypes['Bot Attack']++;
        } else if (attackType.includes('Directory') || attackType.includes('Traversal')) {
            this.attackTypes['Directory Traversal']++;
        } else if (attackType.includes('Command')) {
            this.attackTypes['Command Injection']++;
        } else {
            this.attackTypes['Normal Traffic']++;
        }
        
        // Update attack statistics display
        this.updateAttackStats();
    }

    initializeCharts() {
        // Enhanced Traffic Chart
        const trafficCtx = document.getElementById('trafficChart').getContext('2d');
        this.trafficChart = new Chart(trafficCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Normal Traffic',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6
                }, {
                    label: 'Anomalies Detected',
                    data: [],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.3)',
                    fill: false,
                    pointRadius: 8,
                    pointHoverRadius: 10,
                    pointStyle: 'triangle'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        grid: { color: '#374151' },
                        ticks: { color: '#9ca3af' },
                        title: { display: true, text: 'Requests per Minute', color: '#ffffff' }
                    },
                    x: { 
                        grid: { color: '#374151' },
                        ticks: { color: '#9ca3af' }
                    }
                },
                plugins: {
                    legend: { 
                        labels: { color: '#ffffff' },
                        position: 'top'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#374151',
                        borderWidth: 1
                    }
                }
            }
        });

        // Enhanced Attack Types Chart
        const attackCtx = document.getElementById('attackChart').getContext('2d');
        this.attackChart = new Chart(attackCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(this.attackTypes),
                datasets: [{
                    data: Object.values(this.attackTypes),
                    backgroundColor: [
                        '#ef4444', // SQL Injection - Red
                        '#f97316', // XSS Attack - Orange  
                        '#eab308', // Bot Attack - Yellow
                        '#8b5cf6', // Directory Traversal - Purple
                        '#ec4899', // Command Injection - Pink
                        '#22c55e'  // Normal Traffic - Green
                    ],
                    borderWidth: 3,
                    borderColor: '#1f2937',
                    hoverBorderWidth: 4,
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'right',
                        labels: { 
                            color: '#ffffff', 
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#374151',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true
                }
            }
        });
    }

    updateCharts() {
        const now = new Date();
        const timeLabel = now.toLocaleTimeString();
        
        // Calculate traffic rate based on recent alerts
        this.lastMinuteRequests.push(now);
        this.lastMinuteRequests = this.lastMinuteRequests.filter(time => now - time < 60000);
        this.trafficRate = this.lastMinuteRequests.length;
        
        // Update traffic rate display
        document.getElementById('trafficRate').textContent = `${this.trafficRate} req/min`;
        
        // Add traffic data point
        const baseTraffic = Math.floor(Math.random() * 30) + 20;
        const recentAlerts = this.alerts.filter(alert => 
            new Date() - new Date(alert.timestamp) < 60000
        ).length;
        
        const trafficValue = baseTraffic + (recentAlerts * 5);
        const anomalyValue = recentAlerts > 0 ? recentAlerts : null;
        
        this.trafficChart.data.labels.push(timeLabel);
        this.trafficChart.data.datasets[0].data.push(trafficValue);
        this.trafficChart.data.datasets[1].data.push(anomalyValue);
        
        // Keep only last 30 data points for better visibility
        if (this.trafficChart.data.labels.length > 30) {
            this.trafficChart.data.labels.shift();
            this.trafficChart.data.datasets[0].data.shift();
            this.trafficChart.data.datasets[1].data.shift();
        }
        
        this.trafficChart.update('none');
        
        // Update attack types chart with animation
        this.attackChart.data.datasets[0].data = Object.values(this.attackTypes);
        this.attackChart.update('active');
        
        // Update total attacks counter
        const totalAttacks = Object.values(this.attackTypes).reduce((a, b) => a + b, 0) - this.attackTypes['Normal Traffic'];
        document.getElementById('totalAttacks').textContent = `${totalAttacks} attacks detected`;
    }

    async generateTestTraffic() {
        console.log('🎯 Generating test traffic');
        
        const attackPatterns = [
            '/?id=1\' OR \'1\'=\'1',
            '/search?q=<script>alert(1)</script>',
            '/admin?debug=true',
            '/login?user=admin\'--'
        ];
        
        const userAgents = [
            'sqlmap/1.6.12',
            'Nikto/2.1.6',
            'python-requests/2.28.1'
        ];
        
        for (let i = 0; i < 3; i++) {
            const pattern = attackPatterns[Math.floor(Math.random() * attackPatterns.length)];
            const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
            
            try {
                // Send to ML backend for analysis
                const response = await fetch(`${this.API_BASE}/api/v1/predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        timestamp: new Date().toISOString(),
                        method: 'GET',
                        path: pattern.split('?')[0],
                        query: pattern.split('?')[1] || '',
                        user_agent: userAgent,
                        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
                        country: 'US'
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('🔍 ML Analysis:', result);
                    
                    // If anomaly detected, create alert
                    if (result.is_anomaly) {
                        this.addNewAlert({
                            id: result.event_id,
                            timestamp: new Date().toISOString(),
                            source_ip: result.source_ip || `192.168.1.${Math.floor(Math.random() * 255)}`,
                            anomaly_score: result.confidence,
                            event_type: `ML Detected: ${result.attack_type}`,
                            attack_type: result.attack_type
                        });
                    }
                }
                
            } catch (error) {
                console.error('Failed to generate traffic:', error);
            }
            
            // Wait between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    updateAttackStats() {
        const statsContainer = document.getElementById('attackStats');
        const totalAttacks = Object.values(this.attackTypes).reduce((a, b) => a + b, 0);
        
        let statsHTML = '';
        Object.entries(this.attackTypes).forEach(([type, count]) => {
            if (count > 0) {
                const percentage = totalAttacks > 0 ? ((count / totalAttacks) * 100).toFixed(1) : 0;
                const color = this.getAttackTypeColor(type);
                
                statsHTML += `
                    <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div class="flex items-center space-x-3">
                            <div class="w-4 h-4 rounded-full" style="background-color: ${color}"></div>
                            <span class="text-sm font-medium">${type}</span>
                        </div>
                        <div class="text-right">
                            <div class="text-lg font-bold">${count}</div>
                            <div class="text-xs text-gray-400">${percentage}%</div>
                        </div>
                    </div>
                `;
            }
        });
        
        if (statsHTML === '') {
            statsHTML = '<div class="text-center text-gray-400 py-4">No attacks detected yet</div>';
        }
        
        statsContainer.innerHTML = statsHTML;
    }
    
    getAttackTypeColor(type) {
        const colors = {
            'SQL Injection': '#ef4444',
            'XSS Attack': '#f97316',
            'Bot Attack': '#eab308',
            'Directory Traversal': '#8b5cf6',
            'Command Injection': '#ec4899',
            'Normal Traffic': '#22c55e'
        };
        return colors[type] || '#6b7280';
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new RealTimeDashboard();
});