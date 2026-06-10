from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    region = Column(String)

    properties = relationship("Property", back_populates="city")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String, default="Buyer/Owner/Tenant")  # Agent, Builder
    mobile = Column(String, index=True)
    is_active = Column(Integer, default=0) # 0 for pending email verification
    preferred_city_id = Column(Integer, ForeignKey("cities.id"), nullable=True)

    properties = relationship("Property", back_populates="owner")

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    price = Column(Float)
    type = Column(String)  # 'Rent' or 'Buy'
    category = Column(String, nullable=True)  # e.g. 'Apartment', 'Land', 'Commercial Shop', 'House', 'Office Space'
    bedrooms = Column(Integer)
    bathrooms = Column(Integer)
    area_sqft = Column(Integer)
    city_id = Column(Integer, ForeignKey("cities.id"))
    area = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_demo = Column(Integer, default=0) # 0 = Real listing, 1 = Sample/Demo listing

    city = relationship("City", back_populates="properties")
    owner = relationship("User", back_populates="properties")
    images = relationship("PropertyImage", back_populates="property")

class PropertyImage(Base):
    __tablename__ = "property_images"
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"))
    image_url = Column(String)
    property = relationship("Property", back_populates="images")

class Inquiry(Base):
    __tablename__ = "inquiries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    property_id = Column(Integer, ForeignKey("properties.id"))
    message = Column(Text)

    status = Column(String, default="pending")
    previous_status = Column(String, nullable=True)
    # strict states: pending | verified | approved | viewing_scheduled | documents_held | payment_submitted | payment_confirmed | completed | rejected | dispute

    admin_notes = Column(Text, nullable=True)
    
    # Escrow Fields
    seller_document_url = Column(String, nullable=True)
    payment_proof_url = Column(String, nullable=True)
    seller_confirmed_payment = Column(Integer, default=0) # 0=False, 1=True

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User")
    property = relationship("Property")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    inquiry_id = Column(Integer, ForeignKey("inquiries.id"))
    sender_role = Column(String)  # 'buyer' | 'seller' | 'admin'
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Agent(Base):
    __tablename__ = "agents"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    region = Column(String)
    phone = Column(String)
    email = Column(String, nullable=True)

class Viewing(Base):
    __tablename__ = "viewings"
    id = Column(Integer, primary_key=True, index=True)
    inquiry_id = Column(Integer, ForeignKey("inquiries.id"))
    agent_id = Column(Integer, ForeignKey("agents.id"))
    scheduled_time = Column(DateTime)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Dispute(Base):
    __tablename__ = "disputes"
    id = Column(Integer, primary_key=True, index=True)
    inquiry_id = Column(Integer, ForeignKey("inquiries.id"))
    raised_by = Column(String)  # 'buyer' | 'seller'
    reason = Column(Text)
    status = Column(String, default="open") # open | investigating | resolved | rejected
    resolution = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    inquiry = relationship("Inquiry")

class DisputeEvidence(Base):
    __tablename__ = "dispute_evidence"
    id = Column(Integer, primary_key=True, index=True)
    dispute_id = Column(Integer, ForeignKey("disputes.id"))
    file_url = Column(String)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ReportDownloadLog(Base):
    __tablename__ = "report_download_logs"
    id = Column(Integer, primary_key=True, index=True)
    inquiry_id = Column(Integer, ForeignKey("inquiries.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
