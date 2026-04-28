import urllib.request
import json

data = json.dumps({"name": "Test Shirt", "price": 100, "stock_quantity": 50}).encode('utf-8')
req = urllib.request.Request('http://localhost:5001/api/products/men_casual', data=data, headers={'Content-Type': 'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
