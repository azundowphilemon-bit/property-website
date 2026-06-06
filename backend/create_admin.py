import models
import database
import auth
import sys
import argparse
from sqlalchemy.orm import Session

# Setup database connection
models.Base.metadata.create_all(bind=database.engine)

def create_admin(email, password, name, mobile):
    db: Session = database.SessionLocal()
    try:
        # Check if user exists
        existing_user = db.query(models.User).filter(models.User.email == email).first()
        if existing_user:
            print(f"User {email} already exists.")
            if existing_user.role != "Admin":
                print("Promoting to Admin...")
                existing_user.role = "Admin"
                existing_user.is_active = 1
                db.commit()
                print("Success: User promoted to Admin.")
            else:
                print("User is already an Admin.")
            return

        # Create new Admin
        print(f"Creating new Admin user: {email}")
        hashed_pw = auth.get_password_hash(password)
        new_admin = models.User(
            email=email,
            hashed_password=hashed_pw,
            full_name=name,
            role="Admin",
            mobile=mobile,
            is_active=1
        )
        db.add(new_admin)
        db.commit()
        print("Success: Admin account created.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Create a new Admin user.')
    parser.add_argument('--email', help='Admin email')
    parser.add_argument('--password', help='Admin password')
    parser.add_argument('--name', help='Admin full name')
    parser.add_argument('--mobile', help='Admin mobile number')

    args = parser.parse_args()

    # Interactive mode if arguments are missing
    email = args.email or input("Enter Admin Email: ")
    password = args.password or input("Enter Admin Password: ")
    name = args.name or input("Enter Admin Full Name: ")
    mobile = args.mobile or input("Enter Admin Mobile: ")

    create_admin(email, password, name, mobile)
