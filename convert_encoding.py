import os

files = [
    r"d:\shayokh\cse327 2 -1.01\cse327\shopping-management-system\frontend\public\index.html",
    r"d:\shayokh\cse327 2 -1.01\cse327\shopping-management-system\frontend\public\styles\main.css",
    r"d:\shayokh\cse327 2 -1.01\cse327\shopping-management-system\frontend\public\js\main.js"
]

for file_path in files:
    if os.path.exists(file_path):
        try:
            # Try to read as UTF-16LE
            with open(file_path, 'r', encoding='utf-16le') as f:
                content = f.read()
            # Write back as UTF-8
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Converted {file_path} to UTF-8")
        except Exception as e:
            print(f"Failed to convert {file_path}: {e}")
    else:
        print(f"File not found: {file_path}")
