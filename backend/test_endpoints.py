import requests
import json

print("Testing /api/contact")
res = requests.post("http://127.0.0.1:8007/api/contact", json={
    "name": "Test Name",
    "email": "test@test.com",
    "mobile": "12345",
    "message": "Test message"
})
print("Contact Response:", res.status_code, res.text)

# Also test login and /api/inquiries
print("\nTesting login for falibari@yahoo.com")
# Let's see if falibari@yahoo.com works. We don't know the password, but we can query the DB.
import sqlite3
import os
db_path = os.path.join(os.path.dirname(__file__), "properties.db")
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT id, email FROM users WHERE email='falibari@yahoo.com'")
user = cur.fetchone()
print("User found:", user)

# Generate a token manually using auth.py to test /api/inquiries
import sys
sys.path.append(os.path.dirname(__file__))
from auth import create_access_token

token = create_access_token({"sub": "falibari@yahoo.com"})

print("\nTesting /api/inquiries")
headers = {"Authorization": f"Bearer {token}"}
res = requests.post("http://127.0.0.1:8007/api/inquiries", json={
    "property_id": "2",
    "message": "Test inquiry message"
}, headers=headers)
print("Inquiries Response:", res.status_code, res.text)
