import requests

res = requests.post("http://127.0.0.1:8007/api/contact", json={
    "name": "Matthew Felix Zandi",
    "email": "falibari@yahoo.com",
    "mobile": "+491607561878",
    "message": "I am interested in the property..."
})

print("Status:", res.status_code)
print("Response:", res.text)
