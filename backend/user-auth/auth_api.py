from flask import Flask, request, jsonify
from flask_cors import CORS
from database import UserDatabase

app = Flask(__name__)
CORS(app)

db = UserDatabase()

@app.route('/')
def home():
    return jsonify({
        "message": "Cognitive Cyber Defense - Authentication API",
        "status": "running",
        "endpoints": {
            "register": "/api/register",
            "login": "/api/login"
        }
    })

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if not all([name, email, password]):
        return jsonify({"success": False, "message": "All fields required"}), 400
    
    result = db.register_user(name, email, password)
    return jsonify(result)

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not all([email, password]):
        return jsonify({"success": False, "message": "Email and password required"}), 400
    
    result = db.login_user(email, password)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)