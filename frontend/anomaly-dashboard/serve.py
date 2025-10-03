#!/usr/bin/env python3
"""
Simple HTTP server to serve the dashboard
Fixes CORS issues when accessing the backend
"""

import http.server
import socketserver
import webbrowser
import os

PORT = 8080

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == "__main__":
    # Change to dashboard directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
        print(f"🚀 Serving dashboard at http://localhost:{PORT}")
        print(f"📊 Dashboard URL: http://localhost:{PORT}/index.html")
        print("🔗 Backend: https://nitedu-anomaly-detection-ml.onrender.com")
        print("⚠️  Keep this terminal open while using the dashboard")
        print("🛑 Press Ctrl+C to stop the server")
        
        # Auto-open browser
        webbrowser.open(f'http://localhost:{PORT}/index.html')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")