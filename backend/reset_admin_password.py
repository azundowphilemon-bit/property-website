import models
import database
import auth
from sqlalchemy.orm import Session

def reset_password():
    db = database.SessionLocal()
    try:
        email = "admin@falibari.com"
        new_password = "admin"
        
        # Find ANY admin user
        user = db.query(models.User).filter(models.User.role == "Admin").first()
        
        if not user:
            print("Error: Could not find ANY Admin user in the database!")
            print("Please run `python create_admin.py` first to create one.")
            return
            
        user.hashed_password = auth.get_password_hash(new_password)
        db.commit()
        print("="*50)
        print("SUCCESS! Password has been reset.")
        print(f"Admin Email Found: {user.email}")
        print(f"New Password: {new_password}")
        print("="*50)
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_password()
