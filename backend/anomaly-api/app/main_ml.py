from fastapi import FastAPI, Request, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import sys
import os
import torch
import joblib
import numpy as np
from datetime import datetime
import logging
import asyncio
from typing import List

# Add parent directory to path to import our ML modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.append('/opt/render/project/src')

try:
    from advanced_feature_engineering import AdvancedFeatureExtractor
    from advanced_inference_engine import AdvancedInferenceEngine
    ML_IMPORTS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import ML modules: {e}")
    print("Falling back to basic detection")
    ML_IMPORTS_AVAILABLE = False

app = FastAPI(
    title="Cognitive Cyber Defense - ML Powered",
    description="Advanced ML anomaly detection for nitedu.in",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        if not self.active_connections:
            return
        message_str = json.dumps(message, default=str)
        for connection in self.active_connections[:]:
            try:
                await connection.send_text(message_str)
            except:
                self.disconnect(connection)

manager = ConnectionManager()

# Global ML components and alert storage
class MLState:
    def __init__(self):
        self.engine = None
        self.feature_extractor = None
        self.available = False
        self.alerts = []  # In-memory alert storage
        self.max_alerts = 1000  # Keep last 1000 alerts

ml_state = MLState()

def add_alert(alert_data):
    """Add alert to in-memory storage"""
    ml_state.alerts.insert(0, alert_data)  # Add to beginning
    if len(ml_state.alerts) > ml_state.max_alerts:
        ml_state.alerts = ml_state.alerts[:ml_state.max_alerts]  # Keep only recent alerts

def load_ml_models():
    """Load trained ML models"""
    ml_state.available = False
    
    if not ML_IMPORTS_AVAILABLE:
        print("[WARN] ML modules not available, using fallback")
        return False
    
    try:
        # Try multiple possible paths for Render deployment
        possible_paths = [
            os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'models'),
            '/opt/render/project/src/data/models',
            'data/models',
            './data/models'
        ]
        
        model_dir = None
        for path in possible_paths:
            if os.path.exists(path):
                model_dir = path
                break
        
        if not model_dir:
            print("[WARN] Model directory not found, using fallback")
            return False
        
        print(f"[INFO] Using model directory: {model_dir}")
        
        
        # Load feature extractor
        feature_extractor_path = os.path.join(model_dir, 'advanced_feature_extractor.joblib')
        if os.path.exists(feature_extractor_path):
            ml_state.feature_extractor = joblib.load(feature_extractor_path)
            print("[OK] Feature extractor loaded")
        
        # Load ML inference engine
        model_path = os.path.join(model_dir, 'advanced_ensemble_model.pth')
        metadata_path = os.path.join(model_dir, 'advanced_model_metadata.joblib')
        
        if os.path.exists(model_path) and os.path.exists(metadata_path):
            ml_state.engine = AdvancedInferenceEngine(model_dir)
            if ml_state.engine.load_models():
                ml_state.available = True
                print("[OK] Advanced ML models loaded successfully")
                return True
            else:
                print("[WARN] Failed to load ML models")
                return False
        else:
            print("[WARN] ML model files not found, using fallback detection")
            return False
            
    except Exception as e:
        print(f"[ERROR] Error loading ML models: {e}")
        ml_state.available = False
        return False

def fallback_detection(event_data):
    """Fallback rule-based detection when ML models unavailable"""
    score = 0.0
    path = str(event_data.get('path', '')).lower()
    query = str(event_data.get('query', '')).lower()
    user_agent = str(event_data.get('user_agent', '')).lower()
    full_url = f"{path}?{query}" if query else path
    
    # SQL injection patterns
    sql_patterns = ['union', 'select', 'drop', "' or '", '--', 'insert', 'delete', 'update']
    if any(x in full_url for x in sql_patterns):
        score += 0.9
        attack_type = "SQL Injection"
    # XSS patterns
    elif any(x in full_url for x in ['<script', 'javascript:', 'alert(', 'onerror=', 'onload=']):
        score += 0.8
        attack_type = "XSS Attack"
    # Directory traversal
    elif any(x in full_url for x in ['../', '..\\', '/etc/passwd', '/windows/system32']):
        score += 0.7
        attack_type = "Directory Traversal"
    # Command injection
    elif any(x in full_url for x in [';cat', '|ls', '&&', '`whoami`']):
        score += 0.8
        attack_type = "Command Injection"
    # Bot detection
    elif any(x in user_agent for x in ['sqlmap', 'nikto', 'nmap', 'curl', 'python-requests']):
        score += 0.6
        attack_type = "Bot Attack"
    # Admin panel access
    elif any(x in path for x in ['/admin', '/wp-admin', '/phpmyadmin', '/manager']):
        score += 0.5
        attack_type = "Admin Access Attempt"
    else:
        attack_type = "Normal Traffic"
    
    return {
        "is_anomaly": score > 0.4,
        "confidence": min(score, 1.0),
        "attack_type": attack_type,
        "method": "rule_based"
    }

@app.on_event("startup")
async def startup_event():
    """Load ML models on startup"""
    print("[INFO] Starting ML model loading...")
    success = load_ml_models()
    print(f"[INFO] ML loading result: {success}")
    print(f"[INFO] ML available: {ml_state.available}")

@app.get("/")
async def root():
    return {
        "message": "Cognitive Cyber Defense - ML Powered",
        "status": "operational",
        "version": "2.0.0",
        "ml_enabled": ml_state.available,
        "features": "Advanced ML Detection" if ml_state.available else "Rule-based Detection"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "nitedu-protection-ml",
        "ml_status": "enabled" if ml_state.available else "fallback"
    }

@app.post("/api/v1/predict")
async def predict_anomaly(request: Request):
    """ML-powered anomaly prediction endpoint"""
    try:
        body = await request.body()
        event_data = json.loads(body) if body else {}
        
        # Add request metadata
        event_data.update({
            "client_ip": event_data.get("ip", request.client.host),
            "timestamp": int(datetime.now().timestamp()),
            "method": event_data.get("method", "GET"),
            "path": event_data.get("path", "/"),
            "user_agent": event_data.get("user_agent", ""),
            "headers": dict(request.headers)
        })
        
        if ml_state.engine and ml_state.available:
            # Use advanced ML prediction
            try:
                result = ml_state.engine.predict_anomaly(event_data)
                prediction = {
                    "event_id": f"ml_{int(datetime.now().timestamp())}",
                    "is_anomaly": bool(result.get("is_anomaly", False)),
                    "confidence": float(result.get("confidence", 0.0)),
                    "attack_type": str(result.get("attack_type", "Unknown")),
                    "risk_score": float(result.get("risk_score", 0.0)),
                    "method": "advanced_ml",
                    "model_version": "2.0.0",
                    "inference_time_ms": int(result.get("inference_time_ms", 0)),
                    "model_scores": {k: float(v) for k, v in result.get("model_scores", {}).items()},
                    "source_ip": str(event_data.get("client_ip", "unknown"))
                }
                
                # Store alert if anomaly detected
                if prediction["is_anomaly"]:
                    alert = {
                        "id": prediction["event_id"],
                        "timestamp": datetime.now().isoformat(),
                        "anomaly_score": prediction["confidence"],
                        "event_type": f"ML Detected: {prediction['attack_type']}",
                        "source_ip": prediction["source_ip"],
                        "attack_type": prediction["attack_type"],
                        "method": "advanced_ml",
                        "path": event_data.get("path", "/"),
                        "query": event_data.get("query", ""),
                        "user_agent": event_data.get("user_agent", "")
                    }
                    add_alert(alert)
                    print(f"[ALERT] Anomaly detected: {alert['event_type']} from {alert['source_ip']}")
                
                return prediction
                
            except Exception as e:
                print(f"ML prediction error: {e}")
                # Fall back to rule-based
                result = fallback_detection(event_data)
        else:
            # Use fallback detection
            result = fallback_detection(event_data)
        
        prediction = {
            "event_id": f"rule_{int(datetime.now().timestamp())}",
            "is_anomaly": bool(result["is_anomaly"]),
            "confidence": float(result["confidence"]),
            "attack_type": str(result["attack_type"]),
            "method": str(result["method"]),
            "source_ip": str(event_data.get("client_ip", "unknown"))
        }
        
        # Store alert if anomaly detected
        if prediction["is_anomaly"]:
            alert = {
                "id": prediction["event_id"],
                "timestamp": datetime.now().isoformat(),
                "anomaly_score": prediction["confidence"],
                "event_type": f"Rule Detected: {prediction['attack_type']}",
                "source_ip": prediction["source_ip"],
                "attack_type": prediction["attack_type"],
                "method": "rule_based",
                "path": event_data.get("path", "/"),
                "query": event_data.get("query", ""),
                "user_agent": event_data.get("user_agent", "")
            }
            add_alert(alert)
            print(f"[ALERT] Rule-based detection: {alert['event_type']} from {alert['source_ip']}")
        
        return prediction
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/api/v1/ingest")
async def ingest_event(request: Request):
    """Legacy endpoint - redirects to ML prediction"""
    result = await predict_anomaly(request)
    
    # Store alert if anomaly detected
    if result.get("is_anomaly"):
        alert = {
            "id": result.get("event_id"),
            "timestamp": datetime.now().isoformat(),
            "anomaly_score": result.get("confidence", 0),
            "event_type": f"Attack Detected: {result.get('attack_type')}",
            "source_ip": result.get("source_ip", "unknown"),
            "attack_type": result.get("attack_type"),
            "method": result.get("method", "advanced_ml")
        }
        add_alert(alert)
        await manager.broadcast(alert)
    
    return result

@app.get("/api/v1/alerts")
async def get_alerts():
    """Get recent security alerts"""
    # Return stored alerts or generate sample if none exist
    if ml_state.alerts:
        return ml_state.alerts[:100]  # Return last 100 alerts
    else:
        # Return sample alert if no real alerts exist
        return [
            {
                "id": "sample_alert_001",
                "timestamp": datetime.now().isoformat(),
                "anomaly_score": 0.75,
                "event_type": "System Ready - Monitoring Active",
                "source_ip": "system",
                "method": "advanced_ml" if ml_state.available else "rule_based"
            }
        ]

@app.get("/api/v1/status")
async def get_status():
    """Get system status and ML model info"""
    return {
        "system_status": "operational",
        "ml_models_loaded": ml_state.available,
        "feature_extractor_loaded": ml_state.feature_extractor is not None,
        "inference_engine_loaded": ml_state.engine is not None,
        "detection_method": "advanced_ml" if ml_state.available else "rule_based",
        "model_version": "2.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    """WebSocket endpoint for real-time alerts"""
    await manager.connect(websocket)
    try:
        # Send connection confirmation
        await websocket.send_text(json.dumps({
            "type": "connection",
            "message": "Connected to anomaly detection alerts",
            "timestamp": datetime.now().isoformat()
        }))
        
        # Send sample alerts every 10 seconds
        while True:
            await asyncio.sleep(10)
            sample_alert = {
                "id": f"alert_{int(datetime.now().timestamp())}",
                "timestamp": datetime.now().isoformat(),
                "anomaly_score": 0.85,
                "event_type": "ML Anomaly Detection",
                "source_ip": "192.168.1.100",
                "attack_type": "Suspicious Activity"
            }
            await websocket.send_text(json.dumps(sample_alert))
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)