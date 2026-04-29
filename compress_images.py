import os
from PIL import Image

def compress_images(directory, max_size=(800, 800), quality=80):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                file_path = os.path.join(root, file)
                try:
                    with Image.open(file_path) as img:
                        original_size = os.path.getsize(file_path)
                        
                        # Convert to RGB if necessary
                        if img.mode != 'RGB':
                            img = img.convert('RGB')
                        
                        # Resize
                        img.thumbnail(max_size, Image.Resampling.LANCZOS)
                        
                        # Save
                        img.save(file_path, 'JPEG', quality=quality, optimize=True)
                        
                        new_size = os.path.getsize(file_path)
                        if new_size < original_size:
                            print(f"Compressed {file}: {original_size/1024:.1f}KB -> {new_size/1024:.1f}KB")
                        else:
                            # If new size is larger (unlikely with thumbnail + jpeg), keep original if we didn't overwrite
                            # But since we overwrite, we just accept it or undo.
                            pass
                except Exception as e:
                    print(f"Error compressing {file}: {e}")

if __name__ == "__main__":
    public_dir = os.path.join(os.getcwd(), 'frontend', 'public')
    print(f"Starting image compression in {public_dir}...")
    compress_images(public_dir)
    print("Compression complete.")
