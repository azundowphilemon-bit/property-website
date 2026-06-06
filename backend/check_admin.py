import sqlite3

db_path = "properties.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute('SELECT id, email, full_name, role FROM users WHERE role="Admin"')
admins = cur.fetchall()

print("Admin Accounts:")
for a in admins:
    print(a)
