from fastapi import FastAPI, Depends, Query, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import shutil
import uuid
import os
from sqlalchemy.orm import Session, joinedload
from database import SessionLocal, engine, get_db
import models, auth, automation_utils
import datetime
import sqlite3
import admin
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from auth import SECRET_KEY, ALGORITHM, get_current_user_from_token
from fastapi.responses import FileResponse
import pdf_utils

# --- SCHEMA RESET FOR NEW WORKFLOW ---
# Run once on startup to clean up the old schema
reset_flag_path = os.path.join(os.path.dirname(__file__), "db_reset_done_v3.txt")
if not os.path.exists(reset_flag_path):
    try:
        db_path = os.path.join(os.path.dirname(__file__), "properties.db")
        with sqlite3.connect(db_path) as conn:
            conn.execute("DROP TABLE IF EXISTS inquiries")
            conn.execute("DROP TABLE IF EXISTS messages")
            conn.execute("DROP TABLE IF EXISTS agents")
            conn.execute("DROP TABLE IF EXISTS viewings")
            conn.execute("DROP TABLE IF EXISTS disputes")
            conn.execute("DROP TABLE IF EXISTS dispute_evidence")
            conn.execute("DROP TABLE IF EXISTS report_download_logs")
            conn.commit()
        with open(reset_flag_path, "w") as f:
            f.write("done")
        print("Database schema reset for escrow and disputes workflow.")
    except Exception as e:
        print(f"Error resetting schema: {e}")

models.Base.metadata.create_all(bind=engine)

# --- ENSURE ADMIN ACCOUNT HAS CORRECT ROLE ---
try:
    with SessionLocal() as db:
        admin_user = db.query(models.User).filter(models.User.email == "admin@falibari.com").first()
        if admin_user and admin_user.role != "Admin":
            admin_user.role = "Admin"
            db.commit()
            print("Auto-promoted admin@falibari.com to Admin role.")
except Exception as e:
    print(f"Error checking admin role: {e}")

print("\n" + "="*50)
print("  FALIBARIPRO BACKEND STARTING")
print(f"  EXECUTING FILE: {os.path.abspath(__file__)}")
print(f"  WORKING DIR:    {os.getcwd()}")
print("  Mounting Admin Routes...")
print("="*50 + "\n")

app = FastAPI(title="Falibaripro Property API")

# Simple Test Endpoint to verify file is loading
@app.get("/")
def read_root():
    return {"message": "I AM THE CORRECT SCRIPT - IF YOU SEE THIS, THE ADMIN ROUTES SHOULD WORK"}

@app.get("/api/admin-check")
def admin_check():
    return {"status": "Backend is loading the correct file", "file": os.path.abspath(__file__)}

# Mount the admin router
app.include_router(admin.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
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

app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")



# Use shared dependency from auth.py
get_current_user = get_current_user_from_token

@app.post("/api/auth/register")
def register(user_data: dict, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user_data["email"]).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = auth.get_password_hash(user_data["password"])
    new_user = models.User(
        email=user_data["email"],
        hashed_password=hashed_pw,
        full_name=user_data.get("full_name", ""),
        role=user_data.get("role", "Buyer/Owner/Tenant"),
        mobile=user_data.get("mobile", ""),
        is_active=1 # Simulating instant activation for now, but backend supports 0
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
    
    # Automation: Send Welcome Email
    automation_utils.send_email(
        new_user.email,
        "Welcome to Falibaripro!",
        f"Hi {new_user.full_name},\n\nThank you for registering on Falibaripro. You can now post your properties and search for your dream home in Ghana.\n\nRegards,\nPhilemon Azundow (CEO)"
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
    
    # Automation: Send Reset Email
    automation_utils.send_email(
        email,
        "Password Reset Request - Falibaripro",
        f"Hi,\n\nYou requested a password reset. Please click the link below to set a new password:\n\n{reset_link}\n\nIf you did not request this, please ignore this email."
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
    
    # Delete user's properties first (to avoid foreign key issues)
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
        user_id=current_user.id
    )
    db.add(new_prop)
    db.commit()
    db.refresh(new_prop)
    
    # Handle multiple images
    image_urls = property_data.get("image_urls", [])
    if not image_urls:
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
async def upload_files(files: List[UploadFile] = File(...), current_user: models.User = Depends(get_current_user)):
    file_urls = []
    for file in files:
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Use 127.0.0.1 for local testing consistency
        file_urls.append(f"http://127.0.0.1:8007/api/uploads/{unique_filename}")
        
    return {"urls": file_urls}

@app.post("/api/inquiries")
def create_inquiry(data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
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
        file_urls.append(f"http://127.0.0.1:8007/static/{filename}")
    
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
        file_urls.append(f"http://127.0.0.1:8007/static/{filename}")
    
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
        file_url = f"http://127.0.0.1:8007/static/{filename}"
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
    
    # Simple "AI" logic: search properties based on keywords
    if "price" in user_msg or "how much" in user_msg or "budget" in user_msg:
        props = db.query(models.Property).limit(3).all()
        response = "We have several properties available. For example, " + ", ".join([f"{p.title} for GHS {p.price}" for p in props])
    elif "where" in user_msg or "city" in user_msg or "location" in user_msg:
        cities = db.query(models.City).limit(5).all()
        response = "We have properties in various regions including " + ", ".join([c.name for c in cities]) + "."
    elif "rent" in user_msg:
        props = db.query(models.Property).filter(models.Property.type == "Rent").limit(2).all()
        response = "Yes, we have rentals. Check out " + " and ".join([p.title for p in props])
    elif "buy" in user_msg or "sale" in user_msg:
        props = db.query(models.Property).filter(models.Property.type == "Buy").limit(2).all()
        response = "Looking to buy? We have properties like " + " and ".join([p.title for p in props])
    else:
        response = "Hello! I can help you find properties in Ghana. You can ask about locations, prices, or whether you want to rent or buy."
    
    return {"response": response}

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
    
    # Automation: Send notification to Admin (CEO)
    automation_utils.send_email(
        "falibari@yahoo.com",
        "New Contact Inquiry - Falibaripro",
        f"New message from {data.get('name')} ({data.get('email')} / {data.get('mobile')}):\n\n{data.get('message')}"
    )

    return {"message": "Thank you for your message! Philemon will get back to you shortly."}
