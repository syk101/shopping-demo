import os

def fix_file(path):
    if not os.path.exists(path): return
    with open(path, 'rb') as f:
        data = f.read()
    
    # Try common encodings
    for enc in ['utf-8', 'utf-16le', 'utf-16be', 'latin-1']:
        try:
            content = data.decode(enc)
            # If it's valid, write it as clean UTF-8
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Successfully converted {path} using {enc}")
            return
        except:
            continue
    print(f"Failed to convert {path}")

files = [
    r"d:\shayokh\cse327 2 -1.01\cse327\shopping-management-system\frontend\public\index.html",
    r"d:\shayokh\cse327 2 -1.01\cse327\shopping-management-system\frontend\public\styles\main.css",
    r"d:\shayokh\cse327 2 -1.01\cse327\shopping-management-system\frontend\public\js\main.js"
]

for f in files: fix_file(f)
