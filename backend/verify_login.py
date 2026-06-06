
import smtplib
import socket
import ssl
import getpass

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT_SSL = 465
# SMTP_USER will be asked for input or hardcoded if you provide it

print("="*50)
print(f"Gmail Login Verifier")
print("="*50)
print("NOTE: You NEED a Gmail App Password (2-Step Verification must be ON).")
print("Generate here: https://myaccount.google.com/apppasswords")
print("-" * 50)

try:
    email_user = input("Enter your Gmail Address: ").strip()
    password = input("Enter your Gmail App Password: ").strip()

    
    print(f"\nConnecting to {SMTP_SERVER} on port {SMTP_PORT_SSL}...")
    server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT_SSL)
    
    print(f"Attempting to login as {email_user}...")
    server.login(email_user, password)
    
    print("\n" + "*"*50)
    print("SUCCESS! This password is valid.")
    print("*"*50)
    server.quit()
    
except smtplib.SMTPAuthenticationError as e:
    print("\n" + "!"*50)
    print("LOGIN FAILED: Authentication Error")
    print(f"Server Response: {e}")
    print("!"*50)
    print("Tip: If you just generated this password, wait 1 minute and try again.")
    print("Tip: If you tested too many times, wait 1 hour.")
    
except Exception as e:
    print(f"\nERROR: {e}")
