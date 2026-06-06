from fastapi import FastAPI, Depends, Query, HTTPException, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import shutil
import uuid
import os
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import models, database, auth, automation_utils
import admin # Import the new admin router
from database import engine, get_db
import datetime
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from auth import SECRET_KEY, ALGORITHM, get_current_user_from_token # Import shared dependency
from fastapi.responses import FileResponse
import pdf_utils
import sqlite3
import os

# --- SCHEMA RESET FOR NEW WORKFLOW ---
reset_flag_path = os.path.join(os.path.dirname(__file__), "db_reset_done_v5.txt")
if not os.path.exists(reset_flag_path):
    try:
        db_path = os.path.join(os.path.dirname(__file__), "properties.db")
        with sqlite3.connect(db_path) as conn:
            conn.execute("DROP TABLE IF EXISTS inquiries")
            conn.execute("DROP TABLE IF EXISTS messages")
            conn.execute("DROP TABLE IF EXISTS disputes")
            conn.execute("DROP TABLE IF EXISTS dispute_evidence")
            conn.execute("DROP TABLE IF EXISTS report_download_logs")
            conn.commit()
        with open(reset_flag_path, "w") as f:
            f.write("done")
        print("Database schema reset for inquiries.")
    except Exception as e:
        print(f"Error resetting schema: {e}")

models.Base.metadata.create_all(bind=engine)

# --- DATABASE SCHEMA MIGRATION (OPTION A) ---
try:
    db_path = os.path.join(os.path.dirname(__file__), "properties.db")
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(inquiries)")
        columns = [row[1] for row in cursor.fetchall()]
        if columns and "previous_status" not in columns:
            conn.execute("ALTER TABLE inquiries ADD COLUMN previous_status TEXT")
            conn.commit()
            print("Database Migration: Added previous_status column to inquiries table.")
        
        cursor.execute("PRAGMA table_info(agents)")
        agent_columns = [row[1] for row in cursor.fetchall()]
        if agent_columns and "email" not in agent_columns:
            conn.execute("ALTER TABLE agents ADD COLUMN email TEXT")
            conn.commit()
            print("Database Migration: Added email column to agents table.")
        
        cursor.execute("PRAGMA table_info(properties)")
        prop_columns = [row[1] for row in cursor.fetchall()]
        if prop_columns and "is_demo" not in prop_columns:
            conn.execute("ALTER TABLE properties ADD COLUMN is_demo INTEGER DEFAULT 0")
            conn.execute("UPDATE properties SET is_demo = 1")
            conn.commit()
            print("Database Migration: Added is_demo column and marked existing properties as samples.")
except Exception as e:
    print(f"Error during schema migration: {e}")

# --- AUTO-SEED DATABASE IF EMPTY (CRITICAL FOR RENDER FREE TIER) ---
try:
    from database import SessionLocal
    db_session = SessionLocal()
    city_count = db_session.query(models.City).count()
    if city_count == 0:
        import seed
        print("Database is empty. Auto-seeding default records...")
        seed.seed_db()
except Exception as e:
    print(f"Error during auto-seeding: {e}")
finally:
    try:
        db_session.close()
    except Exception:
        pass


print("\n" + "="*50)
print("  FALIBARI REAL ESTATE BACKEND STARTING")
print(f"  EXECUTING FILE: {os.path.abspath(__file__)}")
print(f"  WORKING DIR:    {os.getcwd()}")
print("  Mounting Admin Routes...")
print("="*50 + "\n")

app = FastAPI(title="Falibari Real Estate Property API")

# Simple Test Endpoint to verify file is loading
@app.get("/")
def read_root():
    return {"message": "I AM THE CORRECT SCRIPT - IF YOU SEE THIS, THE ADMIN ROUTES SHOULD WORK"}

@app.get("/api/admin-check")
def admin_check():
    return {"status": "Backend is loading the correct file", "file": os.path.abspath(__file__)}

# Mount the admin router
app.include_router(admin.router)








# Parse dynamic origins from environment in addition to local development ports
origins = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173", 
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    "http://localhost:5174",
    "http://127.0.0.1:5174"
]
frontend_origin = os.getenv("FRONTEND_ORIGIN")
if frontend_origin:
    for o in frontend_origin.split(","):
        o_clean = o.strip()
        if o_clean and o_clean not in origins:
            origins.append(o_clean)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
# Ensure uploads directory exists - Use absolute path relative to this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")



# Use shared dependency from auth.py
get_current_user = get_current_user_from_token

@app.post("/api/auth/register")
def register(user_data: dict, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user_data["email"]).first()
    
    hashed_pw = auth.get_password_hash(user_data["password"])
    
    if existing_user:
        # TESTING MODE: Update existing user instead of throwing an error
        existing_user.hashed_password = hashed_pw
        existing_user.full_name = user_data.get("full_name", "")
        existing_user.role = "User"
        existing_user.mobile = user_data.get("mobile", "")
        existing_user.preferred_city_id = None
        new_user = existing_user
    else:
        new_user = models.User(
            email=user_data["email"],
            hashed_password=hashed_pw,
            full_name=user_data.get("full_name", ""),
            role="User",
            mobile=user_data.get("mobile", ""),
            is_active=1, # Simulating instant activation for now, but backend supports 0
            preferred_city_id=None
        )
        db.add(new_user)
        
    db.commit()
    db.refresh(new_user)
    
    # Automation: Log to Google Sheets (Aligned with User Columns A-G)
    intent = user_data.get("registration_intent", "Not Specified")
    source = user_data.get("registration_message", "Not Specified")
    
    automation_utils.log_to_google_sheets({
        "type": "Registration",
        "email": new_user.email,
        "name": new_user.full_name,
        "mobile": new_user.mobile,
        "role": new_user.role,
        "property_details": f"Intent: {intent}", # Column F
        "message": f"Source: {source}",          # Column G
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })
    
    # Premium Welcome Email HTML Template
    welcome_html = f"""
    <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #080B12; color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #1E2330;">
        <div style="background: linear-gradient(135deg, #D4AF37, #B68D25); padding: 30px; text-align: center;">
            <h1 style="color: #080B12; margin: 0; font-size: 28px; letter-spacing: 1px;">FALIBARI</h1>
            <p style="color: #080B12; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">REAL ESTATE MANAGEMENT</p>
        </div>
        <div style="padding: 40px 30px; background-color: #0A0E17;">
            <h2 style="color: #D4AF37; margin-top: 0;">Welcome, {new_user.full_name}!</h2>
            <p style="color: #A0AABF; line-height: 1.6; font-size: 16px;">Thank you for registering on Falibari Real Estate. Your premium account has been successfully created.</p>
            <p style="color: #A0AABF; line-height: 1.6; font-size: 16px;">You can now securely browse exclusive properties, or upload your own listings to our network across Ghana.</p>
            <div style="text-align: center; margin: 40px 0;">
                <a href="http://localhost:3000/login" style="background: linear-gradient(135deg, #D4AF37, #B68D25); color: #080B12; padding: 14px 32px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block;">Access Your Dashboard</a>
            </div>
        </div>
        <div style="background-color: #080B12; padding: 24px; text-align: center; border-top: 1px solid #1E2330;">
            <p style="color: #6B7280; font-size: 13px; margin: 0;">© 2026 Falibari Real Estate. All rights reserved.</p>
            <p style="color: #6B7280; font-size: 13px; margin: 8px 0 0 0;">Philemon Azundow (CEO)</p>
        </div>
    </div>
    """
    
    # Automation: Send Welcome Email
    automation_utils.send_email(
        new_user.email,
        "Welcome to Falibari Real Estate!",
        welcome_html
    )
    
    return {"message": "User created successfully. Welcome email sent and data logged."}

@app.post("/api/auth/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Support both Email and Mobile login
    user = db.query(models.User).filter(
        (models.User.email == form_data.username) | (models.User.mobile == form_data.username)
    ).first()
    
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    if user.is_active == 0:
        raise HTTPException(status_code=403, detail="Your account has been suspended by the administrator or is pending verification.")
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name,
        "preferred_city_id": user.preferred_city_id
    }

@app.delete("/api/properties/{property_id}")
def delete_property(
    property_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Fetch property with images
    prop = db.query(models.Property).options(joinedload(models.Property.images)).filter(models.Property.id == property_id).first()
    
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
        
    # Check permissions: Owner OR Admin
    if prop.user_id != current_user.id and current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="You do not have permission to delete this property")
        
    # Cleanup images from disk
    for img in prop.images:
        try:
            if img.image_url:
                filename = img.image_url.split("/")[-1]
                file_path = os.path.join(UPLOAD_DIR, filename)
                if os.path.exists(file_path):
                    os.remove(file_path)
                    print(f"DEBUG: Deleted property image: {file_path}")
        except Exception as e:
            print(f"Error deleting image file: {e}")
            
    # Delete from DB
    db.delete(prop)
    db.commit()
    
    return {"message": "Property deleted successfully"}



@app.post("/api/auth/forgot-password")
def forgot_password(data: dict, db: Session = Depends(get_db)):
    email = data.get("email")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        # Don't reveal if email exists or not for security, but for this demo we'll be helpful
        raise HTTPException(status_code=404, detail="User with this email not found")
    
    # Generate a temporary reset token (expires in 10 minutes)
    reset_token = auth.create_access_token(
        data={"sub": user.email, "type": "reset"}, 
        expires_delta=auth.timedelta(minutes=10)
    )
    
    # In a real app, you'd send this via email.
    reset_link = f"http://127.0.0.1:5174/reset-password?token={reset_token}"
    
    # Premium Password Reset HTML Template
    reset_html = f"""
    <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #080B12; color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #1E2330;">
        <div style="background: linear-gradient(135deg, #D4AF37, #B68D25); padding: 30px; text-align: center;">
            <h1 style="color: #080B12; margin: 0; font-size: 24px;">FALIBARI REAL ESTATE</h1>
        </div>
        <div style="padding: 40px 30px; background-color: #0A0E17;">
            <h2 style="color: #D4AF37; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #A0AABF; line-height: 1.6; font-size: 16px;">We received a request to reset the password for your Falibari account. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 40px 0;">
                <a href="{reset_link}" style="background: linear-gradient(135deg, #D4AF37, #B68D25); color: #080B12; padding: 14px 32px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #6B7280; line-height: 1.5; font-size: 14px;">If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
    </div>
    """

    # Automation: Send Reset Email
    automation_utils.send_email(
        email,
        "Password Reset Request - Falibari Real Estate",
        reset_html
    )
    
    print(f"DEBUG: Password reset link for {email}: {reset_link}")
    
    return {
        "message": "Password reset instructions sent to your email.",
        "debug_token": reset_token
    }

@app.post("/api/auth/reset-password")
def reset_password(data: dict, db: Session = Depends(get_db)):
    token = data.get("token")
    new_password = data.get("new_password")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if email is None or token_type != "reset":
            raise HTTPException(status_code=400, detail="Invalid or expired reset token")
            
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = auth.get_password_hash(new_password)
    db.commit()
    
    return {"message": "Password updated successfully. You can now login with your new password."}

@app.delete("/api/auth/delete-account")
def delete_account(data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    reason = data.get("reason", "No reason provided")
    
    # Automation: Log Deletion to Google Sheets
    automation_utils.log_to_google_sheets({
        "type": "Account Deletion",
        "email": current_user.email,
        "name": current_user.full_name,
        "mobile": current_user.mobile,
        "role": current_user.role,
        "message": reason,
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })
    
    # Delete user's properties and associated images first
    # Use joinedload to ensure images are loaded before we delete the parent
    properties = db.query(models.Property).options(joinedload(models.Property.images)).filter(models.Property.user_id == current_user.id).all()
    
    print(f"DEBUG: Deleting {len(properties)} properties for user {current_user.email}")
    
    for prop in properties:
        # Delete images from disk
        for img in prop.images:
            try:
                # Extract filename from URL (assumes last part of path)
                if img.image_url:
                    filename = img.image_url.split("/")[-1]
                    file_path = os.path.join(UPLOAD_DIR, filename)
                    print(f"DEBUG: Attempting to delete image at {file_path}")
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        print(f"DEBUG: Successfully deleted file: {file_path}")
                    else:
                        print(f"DEBUG: File not found at {file_path}")
            except Exception as e:
                print(f"Error deleting image file: {e}")
    
    # Now delete properties from DB
    db.query(models.Property).filter(models.Property.user_id == current_user.id).delete()
    
    # Delete the user
    db.delete(current_user)
    db.commit()
    
    return {"message": "Your account has been deleted successfully. You can register again at any time."}


@app.get("/api/cities")
def get_cities(db: Session = Depends(get_db)):
    return db.query(models.City).all()

@app.get("/api/properties")
def get_properties(
    city_id: Optional[int] = None,
    property_type: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Property).join(models.User).filter(models.User.is_active == 1).options(joinedload(models.Property.images))
    
    if city_id:
        query = query.filter(models.Property.city_id == city_id)
    if property_type:
        query = query.filter(models.Property.type == property_type)
    if category:
        query = query.filter(models.Property.category == category)
    if min_price is not None:
        query = query.filter(models.Property.price >= min_price)
    if max_price is not None:
        query = query.filter(models.Property.price <= max_price)
        
    return query.order_by(models.Property.id.desc()).all()

@app.get("/api/properties/{property_id}")
def get_property(property_id: int, db: Session = Depends(get_db)):
    return db.query(models.Property).options(joinedload(models.Property.images)).filter(models.Property.id == property_id).first()

@app.post("/api/properties")
def create_property(
    property_data: dict, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_prop = models.Property(
        title=property_data["title"],
        description=property_data.get("description", ""),
        price=property_data["price"],
        type=property_data["type"],
        category=property_data.get("category", ""),
        bedrooms=property_data["bedrooms"],
        bathrooms=property_data["bathrooms"],
        area_sqft=property_data["area_sqft"],
        city_id=property_data["city_id"],
        user_id=current_user.id,
        is_demo=property_data.get("is_demo", 0)
    )
    db.add(new_prop)
    db.commit()
    db.refresh(new_prop)
    
    db.refresh(new_prop)
    
    # Handle multiple images
    raw_urls = property_data.get("image_urls", [])
    print(f"DEBUG: Received {len(raw_urls)} image URLs for property {new_prop.id}")
    
    # Deduplicate URLs to prevent the '10 pictures' bug
    image_urls = list(set(raw_urls))
    if len(image_urls) < len(raw_urls):
        print(f"DEBUG: Deduplicated to {len(image_urls)} unique URLs")

    if not image_urls:
        # Only use placeholder if REALLY no images provided
        image_urls = ["https://picsum.photos/seed/new/400/300"]
        
    for url in image_urls:
        db_image = models.PropertyImage(property_id=new_prop.id, image_url=url)
        db.add(db_image)
    
    db.commit()
    db.refresh(new_prop)

    # Automation: Log Property to Google Sheets
    automation_utils.log_to_google_sheets({
        "type": "Property Posting",
        "email": current_user.email,
        "full_name": current_user.full_name,
        "mobile": current_user.mobile,
        "role": current_user.role, 
        "property_details": f"{new_prop.type} @ GHS {new_prop.price}", # Column F
        "message": f"Title: {new_prop.title}",                         # Column G
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

    return new_prop

@app.post("/api/upload")
async def upload_files(request: Request, files: List[UploadFile] = File(...), current_user: models.User = Depends(get_current_user)):
    try:
        file_urls = []
        base_url = str(request.base_url).rstrip("/")
        
        for file in files:
            file_extension = os.path.splitext(file.filename)[1] if file.filename else ""
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join(UPLOAD_DIR, unique_filename)
            
            # Read and write the file natively and asynchronously
            content = await file.read()
            with open(file_path, "wb") as buffer:
                buffer.write(content)
            
            # Store relative paths in the database for easier handling and portability
            file_urls.append(f"/uploads/{unique_filename}")
            
        return {"urls": file_urls}
    except Exception as e:
        print(f"Upload Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@app.post("/api/inquiries")
def create_inquiry(data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        inquiry = models.Inquiry(
            user_id=current_user.id,
            property_id=data["property_id"],
            message=data["message"]
        )
        db.add(inquiry)
        db.commit()
        db.refresh(inquiry)
        
        # Automation: Log Inquiry to Google Sheets
        automation_utils.log_to_google_sheets({
            "type": "Property Inquiry",
            "email": current_user.email,
            "name": current_user.full_name,
            "mobile": current_user.mobile,
            "role": current_user.role, 
            "property_details": f"Property ID: {data['property_id']}", 
            "message": data["message"], 
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        
        return {"message": "Inquiry sent successfully", "id": inquiry.id}
    except Exception as e:
        import traceback
        error_msg = str(e)
        print("CREATE INQUIRY ERROR:", error_msg)
        trace_str = traceback.format_exc()
        try:
            with open("error_log.txt", "w") as f:
                f.write(error_msg + "\n\n" + trace_str)
        except:
            pass
        # Return a 400 error so CORS doesn't block it
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=400, content={"detail": f"Backend Error: {error_msg}"})


@app.get("/api/inquiries/me")
def get_my_inquiries(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    inquiries = db.query(models.Inquiry).options(joinedload(models.Inquiry.property)).filter(models.Inquiry.user_id == current_user.id).order_by(models.Inquiry.id.desc()).all()
    
    result = []
    for inq in inquiries:
        result.append({
            "id": inq.id,
            "property_id": inq.property_id,
            "property_title": inq.property.title if inq.property else "Deleted Property",
            "message": inq.message,
            "status": inq.status,
            "admin_notes": inq.admin_notes,
            "created_at": inq.created_at
        })
    return result

@app.get("/api/inquiries/received")
def get_received_inquiries(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    inquiries = db.query(models.Inquiry).options(joinedload(models.Inquiry.property)).join(models.Property).filter(models.Property.user_id == current_user.id).order_by(models.Inquiry.id.desc()).all()
    
    result = []
    for inq in inquiries:
        result.append({
            "id": inq.id,
            "property_id": inq.property_id,
            "property_title": inq.property.title if inq.property else "Deleted Property",
            "message": inq.message,
            "status": inq.status,
            "admin_notes": inq.admin_notes,
            "seller_document_url": inq.seller_document_url,
            "payment_proof_url": inq.payment_proof_url,
            "seller_confirmed_payment": bool(inq.seller_confirmed_payment),
            "created_at": inq.created_at,
            "updated_at": inq.updated_at
        })
    return result

@app.post("/api/inquiries/{inquiry_id}/seller-document")
def upload_seller_document(inquiry_id: int, files: List[UploadFile] = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    inquiry = db.query(models.Inquiry).get(inquiry_id)
    if not inquiry: raise HTTPException(404, "Inquiry not found")
    
    file_urls = []
    for file in files:
        filename = f"seller_doc_{inquiry_id}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_urls.append(f"/uploads/{filename}")
    
    if file_urls:
        inquiry.seller_document_url = file_urls[0]
        inquiry.status = "documents_held"
        db.commit()
    return {"message": "Document uploaded successfully", "url": file_urls[0] if file_urls else None}

@app.post("/api/inquiries/{inquiry_id}/payment-proof")
def upload_payment_proof(inquiry_id: int, files: List[UploadFile] = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    inquiry = db.query(models.Inquiry).get(inquiry_id)
    if not inquiry: raise HTTPException(404, "Inquiry not found")
    
    file_urls = []
    for file in files:
        filename = f"payment_proof_{inquiry_id}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_urls.append(f"/uploads/{filename}")
    
    if file_urls:
        inquiry.payment_proof_url = file_urls[0]
        inquiry.status = "payment_submitted"
        db.commit()
    return {"message": "Payment proof uploaded successfully"}

@app.post("/api/inquiries/{inquiry_id}/seller-confirm")
def seller_confirm_payment(inquiry_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    inquiry = db.query(models.Inquiry).get(inquiry_id)
    if not inquiry: raise HTTPException(404, "Inquiry not found")
    inquiry.seller_confirmed_payment = 1
    db.commit()
    return {"message": "Payment confirmed by seller"}

@app.post("/api/inquiries/{inquiry_id}/request-viewing")
def request_viewing(inquiry_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    inquiry = db.query(models.Inquiry).get(inquiry_id)
    if not inquiry: raise HTTPException(404, "Inquiry not found")
    # This just notifies the admin via Google Sheets that a viewing was requested
    automation_utils.log_to_google_sheets({
        "type": "Viewing Request",
        "email": current_user.email,
        "name": current_user.full_name,
        "message": f"User requested viewing for Inquiry {inquiry_id}",
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })
    return {"message": "Viewing requested. Admin will schedule an agent shortly."}

@app.get("/api/inquiries/{inquiry_id}/messages")
def get_messages(inquiry_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Buyer or seller can fetch messages. They only see messages they sent, or admin sent to them.
    # To simplify, we'll return all messages for this inquiry since contact info is hidden anyway, 
    # but the sender_role will indicate who sent it.
    messages = db.query(models.Message).filter(models.Message.inquiry_id == inquiry_id).order_by(models.Message.created_at.asc()).all()
    return [{"id": m.id, "sender_role": m.sender_role, "message": m.message, "created_at": m.created_at} for m in messages]

@app.post("/api/inquiries/{inquiry_id}/messages")
def send_message(inquiry_id: int, data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    inquiry = db.query(models.Inquiry).get(inquiry_id)
    if not inquiry: raise HTTPException(404, "Inquiry not found")
    
    sender_role = "buyer" if inquiry.user_id == current_user.id else "seller"
    msg = models.Message(inquiry_id=inquiry_id, sender_role=sender_role, message=data["message"])
    db.add(msg)
    db.commit()
    return {"message": "Message sent to Admin"}

@app.post("/api/inquiries/{inquiry_id}/disputes")
def raise_dispute(inquiry_id: int, data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    inquiry = db.query(models.Inquiry).get(inquiry_id)
    if not inquiry: raise HTTPException(404, "Inquiry not found")
    
    raised_by = "buyer" if inquiry.user_id == current_user.id else "seller"
    dispute = models.Dispute(
        inquiry_id=inquiry_id,
        raised_by=raised_by,
        reason=data.get("reason", "")
    )
    db.add(dispute)
    
    inquiry.previous_status = inquiry.status
    inquiry.status = "dispute"
    db.commit()
    return {"message": "Dispute raised. Transaction frozen."}

@app.get("/api/inquiries/{inquiry_id}/disputes")
def get_disputes(inquiry_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    disputes = db.query(models.Dispute).filter(models.Dispute.inquiry_id == inquiry_id).all()
    result = []
    for d in disputes:
        evidence = db.query(models.DisputeEvidence).filter(models.DisputeEvidence.dispute_id == d.id).all()
        result.append({
            "id": d.id,
            "raised_by": d.raised_by,
            "reason": d.reason,
            "status": d.status,
            "resolution": d.resolution,
            "created_at": d.created_at,
            "evidence": [{"id": e.id, "file_url": e.file_url} for e in evidence]
        })
    return result

@app.post("/api/disputes/{dispute_id}/evidence")
def upload_evidence(dispute_id: int, files: List[UploadFile] = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    dispute = db.query(models.Dispute).get(dispute_id)
    if not dispute: raise HTTPException(404, "Dispute not found")
    
    for file in files:
        filename = f"evidence_{dispute_id}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_url = f"/uploads/{filename}"
        evidence = models.DisputeEvidence(dispute_id=dispute_id, file_url=file_url)
        db.add(evidence)
    db.commit()
    return {"message": "Evidence uploaded successfully"}

@app.get("/api/inquiries/{inquiry_id}/report")
def download_report(inquiry_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    inquiry = db.query(models.Inquiry).get(inquiry_id)
    if not inquiry: raise HTTPException(404, "Inquiry not found")
    
    if inquiry.status != "completed":
        raise HTTPException(400, "Report only available for completed transactions")
        
    # Check authorization
    if inquiry.user_id != current_user.id and inquiry.property.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not authorized to download this report")
        
    # Log download
    log = models.ReportDownloadLog(inquiry_id=inquiry_id, user_id=current_user.id)
    db.add(log)
    db.commit()
    
    try:
        file_path = pdf_utils.generate_transaction_pdf(inquiry)
        return FileResponse(file_path, filename=f"transaction_FAL_{inquiry.id}.pdf")
    except Exception as e:
        raise HTTPException(500, f"Error generating PDF: {str(e)}")


@app.post("/api/chatbot")
def chatbot(data: dict, db: Session = Depends(get_db)):
    user_msg = data.get("message", "").lower()
    
    cities = db.query(models.City).all()
    found_city = None
    
    # Sort cities by length (descending) to match "Cape Coast" before "Coast"
    cities.sort(key=lambda x: len(x.name), reverse=True)
    
    import re
    for city in cities:
        # Use regex to match whole words only (e.g. "Ho" matches "Ho" but not "House")
        pattern = r'\b' + re.escape(city.name.lower()) + r'\b'
        if re.search(pattern, user_msg):
            found_city = city
            break
            
    matched_props = []
    
    if found_city:
        # User asked about a specific location
        props = db.query(models.Property).join(models.User).filter(
            models.Property.city_id == found_city.id,
            models.User.is_active == 1
        ).options(joinedload(models.Property.images)).limit(5).all()
        
        matched_props = props
        if not props:
            response = f"I'm sorry, we currently don't have any properties listed in {found_city.name}."
        else:
            response = f"Yes! We have {len(props)} properties in {found_city.name}."
                
    elif "price" in user_msg or "budget" in user_msg or "cost" in user_msg:
        # Generic price check - show cheapest
        cheapest_props = db.query(models.Property).join(models.User).filter(
            models.User.is_active == 1
        ).options(joinedload(models.Property.images)).order_by(models.Property.price.asc()).limit(5).all()
        
        matched_props = cheapest_props
        if cheapest_props:
            response = f"Here are our most budget-friendly properties, starting from GHS {cheapest_props[0].price:,.2f} in {cheapest_props[0].city.name}."
        else:
            response = "We have various properties to suit different budgets. Please check our listings page for details."

    elif "rent" in user_msg:
        props = db.query(models.Property).join(models.User).filter(
            models.Property.type == "Rent", 
            models.User.is_active == 1
        ).options(joinedload(models.Property.images)).limit(5).all()
        
        matched_props = props
        if props:
             response = "Here are some of our top rental listings currently available:"
        else:
             response = "We currently don't have rental properties available."

    elif "buy" in user_msg or "sale" in user_msg:
        props = db.query(models.Property).join(models.User).filter(
            models.Property.type == "Buy", 
            models.User.is_active == 1
        ).options(joinedload(models.Property.images)).limit(5).all()
        
        matched_props = props
        if props:
             response = "Here are some premium properties currently for sale:"
        else:
             response = "We currently don't have properties for sale."
             
    else:
        # Default Welcome / Help - list latest 3 properties as suggestions
        props = db.query(models.Property).join(models.User).filter(
            models.User.is_active == 1
        ).options(joinedload(models.Property.images)).order_by(models.Property.id.desc()).limit(3).all()
        matched_props = props
        
        all_cities = ", ".join([c.name for c in cities[:5]])
        response = f"I can help you find properties in {all_cities} and more. Try asking: 'Do you have houses in Accra?' or 'What is the cheapest property?'"
        
    def serialize_property(p):
        img_url = "https://picsum.photos/400/300"
        if p.images and len(p.images) > 0:
            img_url = p.images[0].image_url
        return {
            "id": p.id,
            "title": p.title,
            "price": p.price,
            "type": p.type,
            "category": p.category,
            "bedrooms": p.bedrooms,
            "bathrooms": p.bathrooms,
            "area_sqft": p.area_sqft,
            "city_id": p.city_id,
            "image_url": img_url,
            "is_demo": getattr(p, "is_demo", 0)
        }
        
    return {
        "response": response,
        "properties": [serialize_property(p) for p in matched_props]
    }

@app.post("/api/contact")
def submit_contact(data: dict, db: Session = Depends(get_db)):
    # Automation: Log Contact to Google Sheets
    automation_utils.log_to_google_sheets({
        "type": "Contact Form",
        "email": data.get("email"),
        "full_name": data.get("name"),
        "mobile": data.get("mobile"),
        "role": "Inquirer", 
        "property_details": "Contact Form Inquiry", # Column F
        "message": data.get("message"),             # Column G
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })
    
    # HTML Inquiry Template
    inquiry_html = f"""
    <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; color: #111827; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background-color: #111827; padding: 20px; text-align: center; border-bottom: 4px solid #D4AF37;">
            <h2 style="color: #ffffff; margin: 0;">New Client Inquiry</h2>
        </div>
        <div style="padding: 30px;">
            <p style="margin: 0 0 10px 0;"><strong>Name:</strong> {data.get('name')}</p>
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> <a href="mailto:{data.get('email')}">{data.get('email')}</a></p>
            <p style="margin: 0 0 20px 0;"><strong>Mobile:</strong> {data.get('mobile')}</p>
            <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; border: 1px solid #e5e7eb;">
                <h4 style="margin-top: 0; color: #D4AF37;">Message:</h4>
                <p style="white-space: pre-wrap; line-height: 1.5; margin-bottom: 0;">{data.get('message')}</p>
            </div>
        </div>
    </div>
    """

    # Automation: Send notification to Admin (CEO)
    automation_utils.send_email(
        "falibari@yahoo.com",
        "New Contact Inquiry - Falibari Real Estate",
        inquiry_html
    )

    return {"message": "Thank you for your message! Philemon will get back to you shortly."}
