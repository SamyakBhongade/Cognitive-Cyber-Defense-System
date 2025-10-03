import mysql.connector
import hashlib
from datetime import datetime

class UserDatabase:
    def __init__(self):
        self.config = {
            'host': 'localhost',
            'user': 'root',
            'password': '',
            'database': 'cyber_defense_db'
        }
        self.init_database()
    
    def get_connection(self):
        return mysql.connector.connect(**self.config)
    
    def init_database(self):
        """Initialize database and users table"""
        try:
            conn = mysql.connector.connect(
                host=self.config['host'],
                user=self.config['user'],
                password=self.config['password']
            )
            cursor = conn.cursor()
            
            cursor.execute("CREATE DATABASE IF NOT EXISTS cyber_defense_db")
            cursor.execute("USE cyber_defense_db")
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(64) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP NULL,
                    is_active BOOLEAN DEFAULT TRUE
                )
            ''')
            
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Database init error: {e}")
    
    def hash_password(self, password):
        return hashlib.sha256(password.encode()).hexdigest()
    
    def register_user(self, name, email, password):
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            password_hash = self.hash_password(password)
            
            cursor.execute('''
                INSERT INTO users (name, email, password_hash)
                VALUES (%s, %s, %s)
            ''', (name, email, password_hash))
            
            conn.commit()
            conn.close()
            return {"success": True, "message": "User registered successfully"}
            
        except mysql.connector.IntegrityError:
            return {"success": False, "message": "Email already exists"}
        except Exception as e:
            return {"success": False, "message": str(e)}
    
    def login_user(self, email, password):
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            password_hash = self.hash_password(password)
            
            cursor.execute('''
                SELECT id, name, email FROM users 
                WHERE email = %s AND password_hash = %s AND is_active = TRUE
            ''', (email, password_hash))
            
            user = cursor.fetchone()
            
            if user:
                cursor.execute('''
                    UPDATE users SET last_login = NOW() WHERE id = %s
                ''', (user[0],))
                conn.commit()
                
                conn.close()
                return {
                    "success": True, 
                    "user": {"id": user[0], "name": user[1], "email": user[2]}
                }
            else:
                conn.close()
                return {"success": False, "message": "Invalid credentials"}
                
        except Exception as e:
            return {"success": False, "message": str(e)}