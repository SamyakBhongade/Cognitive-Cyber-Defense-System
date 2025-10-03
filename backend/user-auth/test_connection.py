from database import UserDatabase

def test_database_connection():
    print("Testing MySQL Database Connection...")
    print("=" * 50)
    
    try:
        # Initialize database
        db = UserDatabase()
        print("[SUCCESS] Database initialized successfully")
        
        # Test connection
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Test database exists
        cursor.execute("SHOW DATABASES LIKE 'cyber_defense_db'")
        result = cursor.fetchone()
        if result:
            print("[SUCCESS] Database 'cyber_defense_db' exists")
        else:
            print("[ERROR] Database 'cyber_defense_db' not found")
        
        # Test table exists
        cursor.execute("USE cyber_defense_db")
        cursor.execute("SHOW TABLES LIKE 'users'")
        result = cursor.fetchone()
        if result:
            print("[SUCCESS] Table 'users' exists")
        else:
            print("[ERROR] Table 'users' not found")
        
        # Test table structure
        cursor.execute("DESCRIBE users")
        columns = cursor.fetchall()
        print("[SUCCESS] Table structure:")
        for col in columns:
            print(f"   - {col[0]}: {col[1]}")
        
        conn.close()
        print("\nDatabase connection test completed successfully!")
        return True
        
    except Exception as e:
        print(f"[ERROR] Database connection failed: {e}")
        return False

if __name__ == "__main__":
    test_database_connection()