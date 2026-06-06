import models
import database
import auth
from sqlalchemy.orm import Session

def reset_both_passwords():
    db = database.SessionLocal()
    try:
        new_password = "admin123"
        admins = db.query(models.User).filter(models.User.role == "Admin").all()
        
        if not admins:
            print("Error: Could not find any Admin users in the database!")
            return
            
        print("="*50)
        print("RESETTING ADMIN PASSWORDS")
        print("="*50)
        
        for admin in admins:
            admin.hashed_password = auth.get_password_hash(new_password)
            print(f"Updated password for: {admin.email} (Role: Admin)")
            
        db.commit()
        print("="*50)
        print("SUCCESS! Both admin accounts have been reset.")
        print(f"New Password: {new_password}")
        print("="*50)
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_both_passwords()
