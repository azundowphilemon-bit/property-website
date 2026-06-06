import database, models

def clear_data():
    db = database.SessionLocal()
    try:
        print("Clearing all property images...")
        db.query(models.PropertyImage).delete()
        print("Clearing all properties...")
        db.query(models.Property).delete()
        db.commit()
        print("Database cleared successfully! Only Cities and Users remain.")
    except Exception as e:
        db.rollback()
        print(f"Error clearing data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clear_data()
