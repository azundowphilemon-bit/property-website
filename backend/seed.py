import random
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import database, models, auth

# Ensure tables are created
models.Base.metadata.create_all(bind=database.engine)

def seed_db():
    db = database.SessionLocal()
    
    # Create some mock users
    mock_users = [
        {"email": "azundowphilemon@gmail.com", "name": "Philemon Admin", "role": "Admin", "mobile": "0240000000"},
        {"email": "agent@falibari.com", "name": "Kwame Agent", "role": "Agent", "mobile": "0240000001"},
        {"email": "builder@falibari.com", "name": "Kofi Builder", "role": "Builder", "mobile": "0240000002"},
        {"email": "owner@falibari.com", "name": "Ama Owner", "role": "Buyer/Owner/Tenant", "mobile": "0240000003"}
    ]
    
    user_objs = []
    for u_data in mock_users:
        user = db.query(models.User).filter(models.User.email == u_data["email"]).first()
        if not user:
            user = models.User(
                email=u_data["email"],
                hashed_password=auth.get_password_hash("password123"),
                full_name=u_data["name"],
                role=u_data["role"],
                mobile=u_data["mobile"],
                is_active=1
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        user_objs.append(user)

    # Capital cities of the 16 regions in Ghana
    ghana_cities = [
        {"name": "Accra", "region": "Greater Accra"},
        {"name": "Kumasi", "region": "Ashanti"},
        {"name": "Tamale", "region": "Northern"},
        {"name": "Sekondi-Takoradi", "region": "Western"},
        {"name": "Sunyani", "region": "Bono"},
        {"name": "Cape Coast", "region": "Central"},
        {"name": "Koforidua", "region": "Eastern"},
        {"name": "Ho", "region": "Volta"},
        {"name": "Bolgatanga", "region": "Upper East"},
        {"name": "Wa", "region": "Upper West"},
        {"name": "Techiman", "region": "Bono East"},
        {"name": "Goaso", "region": "Ahafo"},
        {"name": "Sefwi Wiawso", "region": "Western North"},
        {"name": "Damongo", "region": "Savannah"},
        {"name": "Nalerigu", "region": "North East"},
        {"name": "Dambai", "region": "Oti"}
    ]

    property_types = ["Rent", "Buy"]
    property_titles = [
        "Modern {type} Apartment in {city}",
        "Luxury {type} Villa",
        "Cozy {type} Studio",
        "Spacious {type} Family Home",
        "Elegant {type} Penthouse",
        "Contemporary {type} Townhouse",
        "Classic {type} Mansion",
        "Charming {type} Cottage",
        "Stylish {type} Loft",
        "Premium {type} Estate"
    ]

    for city_data in ghana_cities:
        city = db.query(models.City).filter(models.City.name == city_data["name"]).first()
        if not city:
            city = models.City(name=city_data["name"], region=city_data["region"])
            db.add(city)
            db.commit()
            db.refresh(city)

        # No properties seeded automatically - user will upload them manually
        pass
    db.close()
    print("Database seeded successfully with users and multi-image properties!")

if __name__ == "__main__":
    seed_db()
