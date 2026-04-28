import requests
import json

try:
    print("Testing /test route...")
    r = requests.get('http://127.0.0.1:5000/test', timeout=5)
    print(f"Status: {r.status_code}, Response: {r.text}")

    print("\nTesting /api/products route...")
    r = requests.get('http://127.0.0.1:5000/api/products', timeout=10)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"Found {len(data)} products.")
        print(f"First product: {data[0]['name']}")
    else:
        print(f"Error response: {r.text}")
except Exception as e:
    print(f"Error: {e}")
