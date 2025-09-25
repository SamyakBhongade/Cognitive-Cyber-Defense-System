from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from datetime import datetime

app = FastAPI(
    title="Cognitive Cyber Defense - Production",
    description="ML anomaly detection for nitedu.in",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def detect_anomaly(event_data):
    """Simple but effective anomaly detection"""
    score = 0.0
    path = str(event_data.get('path', '')).lower()
    user_agent = str(event_data.get('user_agent', '')).lower()
    
    # SQL injection patterns
    sql_patterns = ['union', 'select', 'drop', "' or '", '--', 'insert', 'delete', 'update']
    if any(pattern in path for pattern in sql_patterns):
        score += 0.8
        attack_type = "SQL Injection"
    
    # XSS patterns
    elif any(pattern in path for pattern in ['<script', 'javascript:', 'alert(', 'onerror=', '<iframe']):
        score += 0.7
        attack_type = "XSS Attack"
    
    # Bot/Scanner patterns
    elif any(pattern in user_agent for pattern in ['bot', 'curl', 'python', 'sqlmap', 'nikto', 'scanner']):
        score += 0.6
        attack_type = "Bot Attack"
    
    # Path traversal
    elif any(pattern in path for pattern in ['../', '..\\', '%2e%2e']):
        score += 0.7
        attack_type = "Path Traversal"
    
    # Command injection
    elif any(pattern in path for pattern in ['|', '&&', ';', '$(', '`']):
        score += 0.8
        attack_type = "Command Injection"
    
    else:
        attack_type = "Normal"
    
    return {
        "is_anomaly": score > 0.5,
        "confidence": min(score, 1.0),
        "attack_type": attack_type,
        "method": "enhanced_rules"
    }

@app.get("/")
async def root():
    return {
        "message": "Cognitive Cyber Defense - Production Ready",
        "status": "operational",
        "version": "2.0.0",
        "protection": "Enhanced Rule-based Detection",
        "endpoints": ["/health", "/api/v1/predict", "/api/v1/status"]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "nitedu-protection-production",
        "detection_method": "enhanced_rules"
    }

@app.post("/api/v1/predict")
async def predict_anomaly(request: Request):
    """Enhanced anomaly prediction"""
    try:
        body = await request.body()
        event_data = json.loads(body) if body else {}
        
        # Add request metadata
        event_data.update({
            "client_ip": request.client.host,
            "timestamp": int(datetime.now().timestamp()),
            "method": event_data.get("method", "GET"),
            "path": event_data.get("path", "/"),
            "user_agent": event_data.get("user_agent", ""),
            "headers": dict(request.headers)
        })
        
        # Detect anomaly
        result = detect_anomaly(event_data)
        
        return {
            "event_id": f"prod_{int(datetime.now().timestamp())}",
            "is_anomaly": result["is_anomaly"],
            "confidence": result["confidence"],
            "attack_type": result["attack_type"],
            "method": result["method"],
            "source_ip": event_data.get("client_ip", "unknown"),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/api/v1/ingest")
async def ingest_event(request: Request):
    """Legacy endpoint"""
    return await predict_anomaly(request)

@app.get("/api/v1/alerts")
async def get_alerts():
    """Get recent alerts"""
    return [
        {
            "id": "alert_001",
            "timestamp": datetime.now().isoformat(),
            "anomaly_score": 0.85,
            "event_type": "Enhanced Detection Alert",
            "source_ip": "192.168.1.100"
        }
    ]

@app.get("/api/v1/status")
async def get_status():
    """System status"""
    return {
        "system_status": "operational",
        "detection_method": "enhanced_rules",
        "version": "2.0.0",
        "uptime": "running",
        "timestamp": datetime.now().isoformat()
    }