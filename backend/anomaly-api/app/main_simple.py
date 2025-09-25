from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI(
    title="Cognitive Cyber Defense",
    description="Real-time anomaly detection for nitedu.in",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "Cognitive Cyber Defense - nitedu.in Protection",
        "status": "operational",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "nitedu-protection"}

@app.post("/api/v1/ingest")
async def ingest_event(request: Request):
    try:
        # Get raw JSON data
        body = await request.body()
        event = json.loads(body) if body else {}
    except:
        event = {}
    
    # Simple rule-based detection
    score = 0.0
    path = str(event.get('path', '')).lower()
    user_agent = str(event.get('user_agent', '')).lower()
    ip = event.get('ip', event.get('src_ip', 'unknown'))
    
    # SQL injection detection
    if any(x in path for x in ['union', 'select', 'drop', "' or '", '--', 'insert', 'delete']):
        score += 0.8
    
    # XSS detection  
    if any(x in path for x in ['<script', 'javascript:', 'alert(', 'onerror=', '<iframe']):
        score += 0.7
        
    # Bot detection
    if any(x in user_agent for x in ['bot', 'curl', 'python', 'sqlmap', 'crawler', 'spider']):
        score += 0.6
    
    # Suspicious countries
    country = event.get('country', '')
    if country in ['CN', 'RU', 'KP', 'IR']:
        score += 0.3
    
    is_anomaly = score > 0.5
    
    return {
        "event_id": f"evt_{event.get('timestamp', 0)}",
        "is_anomaly": is_anomaly,
        "anomaly_score": min(score, 1.0),
        "confidence": min(score, 1.0),
        "reason": "Attack detected" if is_anomaly else "Normal traffic",
        "source_ip": ip,
        "attack_type": "SQL Injection" if any(x in path for x in ['union', 'select', 'drop']) else "XSS" if any(x in path for x in ['<script', 'alert']) else "Bot" if any(x in user_agent for x in ['bot', 'curl', 'sqlmap']) else "Normal"
    }

@app.get("/api/v1/alerts")
async def get_alerts():
    return [
        {
            "id": "alert_001",
            "timestamp": "2025-01-20T13:00:00Z",
            "anomaly_score": 0.95,
            "event_type": "SQL Injection Attempt",
            "source_ip": "10.0.0.50"
        }
    ]