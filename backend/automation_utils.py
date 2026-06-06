import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
import os
from dotenv import load_dotenv

# Load local environment variables
load_dotenv()

# Configuration (Gmail Configured)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465 # SSL Port
SMTP_USER = os.getenv("SMTP_USER", "azundowphilemon@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

# Google Sheets Webhook URL (Philemon: Paste your Apps Script URL here)
SHEETS_WEBHOOK_URL = os.getenv("SHEETS_WEBHOOK_URL") 

def send_email(to_email, subject, body, is_html=True):
    if not SMTP_PASSWORD or SMTP_PASSWORD == "your_app_password_here":
        print(f"DEBUG EMAIL (Not Sent): To: {to_email}, Sub: {subject}, Body: {body}")
        return False
        
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        
        content_type = 'html' if is_html else 'plain'
        msg.attach(MIMEText(body, content_type))

        # Use SMTP_SSL for Port 465 (More reliable for App Passwords)
        server = smtplib.SMTP_SSL(SMTP_SERVER, 465) 
        # server.starttls() # Not needed for SSL connection
        
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        error_msg = f"FAILED TO SEND EMAIL. Error: {e}"
        print(error_msg)
        
        # Log to file for better visibility
        try:
            with open("email_errors.log", "a") as f:
                import datetime
                timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                f.write(f"[{timestamp}] {error_msg}\n")
        except:
            pass
            
        import traceback
        traceback.print_exc()
        return False

def log_to_google_sheets(data):
    if not SHEETS_WEBHOOK_URL:
        print(f"DEBUG SHEETS (Not Sent): {data.get('type', 'Data')}: {data}")
        return False
        
    try:
        # data already contains email, full_name, mobile, type, etc.
        response = requests.post(SHEETS_WEBHOOK_URL, json=data, timeout=10)
        if response.status_code == 200:
            print(f"Successfully logged {data.get('type', 'record')} to Google Sheets")
            return True
        else:
            print(f"Google Sheets logging failed: {response.text}")
            return False
    except Exception as e:
        print(f"Error logging to Google Sheets: {e}")
        return False
