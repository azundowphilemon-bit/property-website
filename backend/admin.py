from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database, auth, automation_utils
from database import get_db
import datetime

# Create Router
router = APIRouter(
    prefix="/api/admin",
    tags=["admin"]
)

# Dependency for Admin Check
async def get_current_admin(current_user: models.User = Depends(auth.get_current_user_from_token)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# 1. Get All Users
@router.get("/users")
def get_all_users(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin)):
    print(f"DEBUG: Accessing Admin Users Endpoint via Router. Admin: {current_user.email}")
    users = db.query(models.User).all()
    # Manual serialization
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "mobile": u.mobile,
            "is_active": u.is_active
        }
        for u in users
    ]

# 2. Suspend/Activate User
@router.post("/users/{user_id}/suspend")
def toggle_user_status(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Toggle status
    user.is_active = 0 if user.is_active == 1 else 1
    new_status = "Suspended" if user.is_active == 0 else "Activated"
    
    db.commit()
    
    # Log to Google Sheets
    automation_utils.log_to_google_sheets({
        "type": "Admin Action",
        "email": user.email,
        "name": user.full_name,
        "mobile": user.mobile,
        "role": "Admin (" + current_user.email + ")",
        "message": f"Action: {new_status} User",
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })
    
    return {"message": f"User {user.email} has been {new_status}"}

# 3. Delete User
@router.delete("/users/{user_id}")
def admin_delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Log to Google Sheets first
    automation_utils.log_to_google_sheets({
        "type": "Admin Action",
        "email": user.email,
        "name": user.full_name,
        "mobile": user.mobile,
        "role": "Admin (" + current_user.email + ")",
        "message": "Action: Admin Deleted User Account",
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })
    
    # Delete user's properties and images first
    import os
    # Re-calculate UPLOAD_DIR here since it's a separate module, or import from main if possible. 
    # Safest is to use relative path logic again to be sure.
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
    
    properties = db.query(models.Property).filter(models.Property.user_id == user.id).all()
    for prop in properties:
        for img in prop.images:
            try:
                if img.image_url:
                    filename = img.image_url.split("/")[-1]
                    file_path = os.path.join(UPLOAD_DIR, filename)
                    if os.path.exists(file_path):
                        os.remove(file_path)
            except Exception as e:
                print(f"Error deleting file for user {user.id}: {e}")

    # Delete properties from DB
    db.query(models.Property).filter(models.Property.user_id == user.id).delete()
    
    db.delete(user)
    db.commit()
    
    return {"message": "User account permanently deleted by admin."}

# 4. Create New Admin (Restricted to Admins only)
@router.post("/create-admin")
def create_new_admin(admin_data: dict, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin)):
    email = admin_data.get("email")
    full_name = admin_data.get("full_name")
    mobile = admin_data.get("mobile", "")
    
    if not email or not full_name:
        raise HTTPException(status_code=400, detail="Name and Email are required")
        
    existing_user = db.query(models.User).filter(models.User.email == email).first()
    
    if existing_user:
        # User exists -> Promote to Admin
        if existing_user.role == "Admin":
             return {"message": f"User {full_name} is already an Admin."}
             
        existing_user.role = "Admin"
        db.commit()
        
        # Log Promotion
        automation_utils.log_to_google_sheets({
            "type": "Admin Action",
            "email": existing_user.email,
            "name": existing_user.full_name,
            "mobile": existing_user.mobile,
            "role": "Admin Promoted by (" + current_user.email + ")",
            "message": f"Action: Promoted existing user to Admin",
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        
        # Send Promotion Email
        automation_utils.send_email(
            existing_user.email,
            "Role Updated - Falibaripro",
            f"Hi {existing_user.full_name},\n\nCongratulations! Your account role has been upgraded to **Administrator** by {current_user.full_name}.\n\nYou now have access to the Admin Dashboard."
        )
        
        return {"message": f"Existing user {existing_user.full_name} has been promoted to Admin."}

    # Else: Create New User (Existing Logic)
    # Generate random temporary password (User will never know this)
    import secrets
    temp_password = secrets.token_urlsafe(16)
    hashed_pw = auth.get_password_hash(temp_password)
    
    new_admin = models.User(
        email=email,
        hashed_password=hashed_pw,
        full_name=full_name,
        role="Admin", # Explicitly set as Admin
        mobile=mobile,
        is_active=1
    )
    
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    
    # Generate Invite/Reset Token
    invite_token = auth.create_access_token(
        data={"sub": new_admin.email, "type": "reset"}, 
        expires_delta=auth.timedelta(hours=48) # 48 hour invite validity
    )
    
    invite_link = f"http://localhost:5173/?mode=reset&token={invite_token}"
    
    # Send Invite Email
    email_success = automation_utils.send_email(
        new_admin.email,
        "Admin Invitation - Falibaripro",
        f"Hi {full_name},\n\nYou have been invited to be an Administrator on Falibaripro by {current_user.full_name}.\n\nPlease click the link below to accept the invitation and set your password:\n\n{invite_link}\n\nThis link is valid for 48 hours."
    )
    
    # Log to Google Sheets
    automation_utils.log_to_google_sheets({
        "type": "Admin Action",
        "email": new_admin.email,
        "name": new_admin.full_name,
        "mobile": new_admin.mobile,
        "role": "Admin Created by (" + current_user.email + ")",
        "message": f"Action: Sent Admin Invite (Success: {email_success})",
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })
    
    print(f"DEBUG: Admin Invite Link for {email}: {invite_link}")
    
    if email_success:
        return {"message": f"Invitation sent to {email}. They can now set their password."}
    else:
        # Fallback: Give link to current admin
        return {"message": f"Admin created, BUT email failed to send (Check Console). COPY THIS LINK: {invite_link}"}


# 5. Platform Stats
@router.get("/stats")
def get_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin)):
    total_users = db.query(models.User).count()
    active_users = db.query(models.User).filter(models.User.is_active == 1).count()
    suspended_users = total_users - active_users
    total_properties = db.query(models.Property).count()
    for_sale = db.query(models.Property).filter(models.Property.type == "Buy").count()
    for_rent = db.query(models.Property).filter(models.Property.type == "Rent").count()
    return {
        "total_users": total_users,
        "active_users": active_users,
        "suspended_users": suspended_users,
        "total_properties": total_properties,
        "for_sale": for_sale,
        "for_rent": for_rent,
    }

# 6. Get All Properties (Admin)
@router.get("/properties")
def get_all_properties(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin)):
    from sqlalchemy.orm import joinedload
    props = db.query(models.Property).options(
        joinedload(models.Property.city),
        joinedload(models.Property.owner)
    ).order_by(models.Property.id.desc()).all()
    return [
        {
            "id": p.id,
            "title": p.title,
            "price": p.price,
            "type": p.type,
            "category": p.category,
            "city": p.city.name if p.city else "N/A",
            "region": p.city.region if p.city else "N/A",
            "owner_name": p.owner.full_name if p.owner else "N/A",
            "owner_email": p.owner.email if p.owner else "N/A",
            "bedrooms": p.bedrooms,
            "bathrooms": p.bathrooms,
            "area_sqft": p.area_sqft,
        }
        for p in props
    ]

# 7. Delete Property (Admin)
@router.delete("/properties/{property_id}")
def admin_delete_property(property_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin)):
    import os
    from sqlalchemy.orm import joinedload
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

    prop = db.query(models.Property).options(joinedload(models.Property.images)).filter(models.Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    for img in prop.images:
        try:
            if img.image_url:
                filename = img.image_url.split("/")[-1]
                file_path = os.path.join(UPLOAD_DIR, filename)
                if os.path.exists(file_path):
                    os.remove(file_path)
        except Exception as e:
            print(f"Error deleting image: {e}")

    automation_utils.log_to_google_sheets({
        "type": "Admin Action",
        "email": current_user.email,
        "name": current_user.full_name,
        "mobile": current_user.mobile,
        "role": "Admin",
        "message": f"Action: Deleted Property ID {property_id} — {prop.title}",
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

    db.delete(prop)
    db.commit()
    return {"message": "Property deleted successfully."}

# 8. Manage Inquiries (Admin)
@router.get("/inquiries")
def get_all_inquiries(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_admin)):
    from sqlalchemy.orm import joinedload
    inquiries = db.query(models.Inquiry).options(
        joinedload(models.Inquiry.user),
        joinedload(models.Inquiry.property)
    ).order_by(models.Inquiry.id.desc()).all()
    
    return [
        {
            "id": inq.id,
            "user_email": inq.user.email if inq.user else "N/A",
            "user_name": inq.user.full_name if inq.user else "N/A",
            "property_title": inq.property.title if inq.property else "Deleted",
            "property_price": inq.property.price if inq.property else 0,
            "seller_email": inq.property.owner.email if inq.property and inq.property.owner else "N/A",
            "message": inq.message,
            "status": inq.status,
            "admin_notes": inq.admin_notes,
            "seller_document_url": inq.seller_document_url,
            "payment_proof_url": inq.payment_proof_url,
            "seller_confirmed_payment": bool(inq.seller_confirmed_payment),
            "created_at": inq.created_at,
            "updated_at": inq.updated_at
        }
        for inq in inquiries
    ]

@router.post("/inquiries/{id}/verify")
def verify_inquiry(id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    inquiry = db.query(models.Inquiry).get(id)
    if not inquiry: raise HTTPException(404, "Inquiry not found")
    inquiry.status = "verified"
    db.commit()
    return {"message": "Inquiry Verified"}

@router.post("/inquiries/{id}/approve")
def approve_inquiry(id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    inquiry = db.query(models.Inquiry).get(id)
    if not inquiry: raise HTTPException(404, "Inquiry not found")
    inquiry.status = "approved"
    db.commit()
    return {"message": "Inquiry Approved"}

@router.post("/inquiries/{id}/reject")
def reject_inquiry(id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    inquiry = db.query(models.Inquiry).get(id)
    if not inquiry: raise HTTPException(404, "Inquiry not found")
    inquiry.status = "rejected"
    db.commit()
    return {"message": "Inquiry Rejected"}

@router.post("/inquiries/{id}/confirm-payment")
def confirm_payment_inquiry(id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    inquiry = db.query(models.Inquiry).get(id)
    if not inquiry: raise HTTPException(404, "Inquiry not found")
    inquiry.status = "payment_confirmed"
    db.commit()
    return {"message": "Payment confirmed"}

@router.post("/inquiries/{id}/complete")
def complete_inquiry(id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    inquiry = db.query(models.Inquiry).get(id)
    if not inquiry: raise HTTPException(404, "Inquiry not found")
    inquiry.status = "completed"
    db.commit()
    return {"message": "Transaction Completed"}

@router.post("/inquiries/{id}/schedule-viewing")
def schedule_viewing(id: int, data: dict, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    inquiry = db.query(models.Inquiry).get(id)
    if not inquiry: raise HTTPException(404, "Inquiry not found")
    
    agent_id = data.get("agent_id")
    scheduled_time_str = data.get("scheduled_time")
    
    if not agent_id or not scheduled_time_str:
        raise HTTPException(400, "agent_id and scheduled_time required")
        
    import dateutil.parser
    scheduled_time = dateutil.parser.isoparse(scheduled_time_str)
    
    viewing = models.Viewing(inquiry_id=id, agent_id=agent_id, scheduled_time=scheduled_time)
    db.add(viewing)
    inquiry.status = "viewing_scheduled"
    db.commit()
    return {"message": "Viewing scheduled successfully"}

@router.get("/agents")
def get_agents(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    agents = db.query(models.Agent).all()
    return [{"id": a.id, "name": a.name, "region": a.region, "phone": a.phone, "email": a.email} for a in agents]

@router.post("/agents")
def create_agent(data: dict, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    name = data.get("name")
    region = data.get("region")
    phone = data.get("phone")
    email = data.get("email")
    if not name:
        raise HTTPException(status_code=400, detail="Agent name is required")
    new_agent = models.Agent(name=name, region=region, phone=phone, email=email)
    db.add(new_agent)
    db.commit()
    db.refresh(new_agent)
    return {"message": "Agent created successfully", "agent": {"id": new_agent.id, "name": new_agent.name, "region": new_agent.region, "phone": new_agent.phone, "email": new_agent.email}}

@router.delete("/agents/{id}")
def delete_agent(id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    agent = db.query(models.Agent).get(id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    db.delete(agent)
    db.commit()
    return {"message": "Agent deleted successfully"}

@router.post("/inquiries/{id}/messages")
def admin_send_message(id: int, data: dict, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    inquiry = db.query(models.Inquiry).get(id)
    if not inquiry: raise HTTPException(404, "Inquiry not found")
    
    # admin can just broadcast message to the inquiry
    msg = models.Message(inquiry_id=id, sender_role="admin", message=data["message"])
    db.add(msg)
    db.commit()
    return {"message": "Message sent"}

@router.get("/disputes")
def get_all_disputes(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    disputes = db.query(models.Dispute).order_by(models.Dispute.created_at.desc()).all()
    result = []
    for d in disputes:
        evidence = db.query(models.DisputeEvidence).filter(models.DisputeEvidence.dispute_id == d.id).all()
        result.append({
            "id": d.id,
            "inquiry_id": d.inquiry_id,
            "property_title": d.inquiry.property.title if d.inquiry and d.inquiry.property else "N/A",
            "raised_by": d.raised_by,
            "reason": d.reason,
            "status": d.status,
            "resolution": d.resolution,
            "created_at": d.created_at,
            "evidence": [{"id": e.id, "file_url": e.file_url} for e in evidence]
        })
    return result

@router.post("/disputes/{id}/resolve")
def resolve_dispute(id: int, data: dict, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    dispute = db.query(models.Dispute).get(id)
    if not dispute: raise HTTPException(404, "Dispute not found")
    
    dispute.status = "resolved"
    dispute.resolution = data.get("resolution", "")
    
    inquiry = dispute.inquiry
    if data.get("terminate_deal"):
        inquiry.status = "rejected"
    else:
        inquiry.status = inquiry.previous_status if inquiry.previous_status else "payment_submitted"
        
    db.commit()
    return {"message": "Dispute resolved"}

@router.post("/disputes/{id}/reject")
def reject_dispute(id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    dispute = db.query(models.Dispute).get(id)
    if not dispute: raise HTTPException(404, "Dispute not found")
    
    dispute.status = "rejected"
    dispute.resolution = "Dispute rejected by admin."
    
    inquiry = dispute.inquiry
    inquiry.status = inquiry.previous_status if inquiry.previous_status else "payment_submitted"
    
    db.commit()
    return {"message": "Dispute rejected"}
