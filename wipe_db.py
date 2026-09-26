import os

db_path = r'c:\Users\aakif\.gemini\antigravity\scratch\disaster-responder\backend\disaster.db'

if os.path.exists(db_path):
    try:
        os.remove(db_path)
        print(f"SUCCESS: Old database deleted. Run START.bat to create the new one.")
    except Exception as e:
        print(f"ERROR: Could not delete database: {e}")
else:
    print("Database file not found. It might already be deleted.")
