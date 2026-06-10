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

        # No random properties seeded
        pass

    # Seed 4 official permanent sample properties (using user-provided custom images)
    sample_props = [
        {
            "title": "Premium Luxury Villa",
            "city_name": "Accra",
            "area": "Airport Residential",
            "description": "A magnificent luxury villa in Airport Residential Area, Accra. Featuring high-end finishes, open terrace, and spacious layout.",
            "price": 8500000.0,
            "type": "Buy",
            "bedrooms": 4,
            "bathrooms": 4,
            "area_sqft": 3500,
            "category": "House",
            "image": "/static/accra_villa.jpg"
        },
        {
            "title": "Modern Executive Duplex",
            "city_name": "Kumasi",
            "area": "Ahodwo",
            "description": "Stunning top-view layout in Ahodwo, Kumasi. Featuring open floor plans, premium rooftop access, and beautiful landscaping.",
            "price": 2500000.0,
            "type": "Buy",
            "bedrooms": 3,
            "bathrooms": 3,
            "area_sqft": 2400,
            "category": "House",
            "image": "/static/kumasi_villa.jpg"
        },
        {
            "title": "Contemporary Smart Mansion",
            "city_name": "Tamale",
            "area": "Fuo",
            "description": "Beautiful contemporary mansion in Tamale. High-ceiling windows, modern facade, and integrated smart home security system.",
            "price": 4500000.0,
            "type": "Buy",
            "bedrooms": 5,
            "bathrooms": 5,
            "area_sqft": 4200,
            "category": "House",
            "image": "/static/tamale_mansion.jpg"
        },
        {
            "title": "Elegant Modern Townhouse",
            "city_name": "Wa",
            "area": "Wa Central",
            "description": "Elegant modern townhouse in Wa. Includes security fence, built-in wardrobes, and garage for two vehicles.",
            "price": 3500.0,
            "type": "Rent",
            "bedrooms": 3,
            "bathrooms": 2,
            "area_sqft": 1800,
            "category": "House",
            "image": "/static/wa_townhouse.jpg"
        }
    ]

    for p_data in sample_props:
        city = db.query(models.City).filter(models.City.name == p_data["city_name"]).first()
        if city:
            # Assign to the first user (Admin/Agent)
            owner_id = user_objs[0].id if user_objs else None
            prop = models.Property(
                title=p_data["title"],
                description=p_data["description"],
                price=p_data["price"],
                type=p_data["type"],
                bedrooms=p_data["bedrooms"],
                bathrooms=p_data["bathrooms"],
                area_sqft=p_data["area_sqft"],
                city_id=city.id,
                area=p_data.get("area", ""),
                user_id=owner_id,
                category=p_data["category"],
                is_demo=1
            )
            db.add(prop)
            db.commit()
            db.refresh(prop)

            img = models.PropertyImage(
                property_id=prop.id,
                image_url=p_data["image"]
            )
            db.add(img)
            db.commit()

    db.close()
    print("Database seeded successfully with users and 4 custom permanent sample properties!")

if __name__ == "__main__":
    seed_db()
