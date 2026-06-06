import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "properties.db")

print(f"Connecting to database...")

with sqlite3.connect(db_path) as conn:
    cursor = conn.cursor()
    
    # Get all users
    cursor.execute("SELECT id, email, role FROM users")
    users = cursor.fetchall()
    
    admin_id = None
    test_user_id = None
    test_email = None
    
    # 1. Find the admin
    for u in users:
        if u[1] == "admin@falibari.com" or u[2] == "Admin":
            admin_id = u[0]
            print(f"Found Admin: {u[1]} (ID: {u[0]})")
            break
            
    # 2. Find ONE regular test user
    for u in users:
        if u[0] != admin_id:
            test_user_id = u[0]
            test_email = u[1]
            print(f"Selecting Test User: {u[1]} (ID: {u[0]})")
            break
            
    if not test_user_id:
        print("No test user found in the database other than the admin.")
    else:
        # 3. Delete everyone else
        ids_to_keep = []
        if admin_id: ids_to_keep.append(admin_id)
        if test_user_id: ids_to_keep.append(test_user_id)
        
        placeholders = ','.join('?' for _ in ids_to_keep)
        
        # Delete properties of deleted users
        cursor.execute(f"DELETE FROM properties WHERE user_id NOT IN ({placeholders})", ids_to_keep)
        
        # Delete inquiries of deleted users
        cursor.execute(f"DELETE FROM inquiries WHERE user_id NOT IN ({placeholders})", ids_to_keep)
        
        # Delete the users
        cursor.execute(f"DELETE FROM users WHERE id NOT IN ({placeholders})", ids_to_keep)
        
        conn.commit()
        print(f"\nSUCCESS! Cleaned up the database.")
        if admin_id:
            print(f"Saved Admin Account")
        print(f"Saved Test Account: {test_email}")
        print(f"(The password remains whatever you previously set for {test_email})")
