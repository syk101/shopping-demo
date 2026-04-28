import sqlite3
import torch
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import requests
from io import BytesIO
import numpy as np
import os
import sys

# Configuration
DATABASE = 'database/shop.db'
MODEL_NAME = "openai/clip-vit-base-patch32"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

print(f"Using device: {DEVICE}")

def load_model():
    print(f"Loading {MODEL_NAME}...")
    model = CLIPModel.from_pretrained(MODEL_NAME).to(DEVICE)
    processor = CLIPProcessor.from_pretrained(MODEL_NAME)
    return model, processor

def get_image(image_source):
    try:
        if image_source.startswith(('http://', 'https://')):
            response = requests.get(image_source, timeout=10)
            return Image.open(BytesIO(response.content)).convert("RGB")
        else:
            # Assume local path relative to frontend/public
            local_path = os.path.join('frontend', 'public', image_source)
            if os.path.exists(local_path):
                return Image.open(local_path).convert("RGB")
            else:
                print(f"Local file not found: {local_path}")
                return None
    except Exception as e:
        print(f"Error loading image {image_source}: {e}")
        return None

def generate_embeddings():
    model, processor = load_model()
    
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    products = cursor.execute("SELECT id, name, image FROM products WHERE embedding IS NULL").fetchall()
    print(f"Found {len(products)} products without embeddings.")
    
    for i, product in enumerate(products):
        print(f"[{i+1}/{len(products)}] Processing {product['name']}...")
        image = get_image(product['image'])
        
        if image:
            try:
                inputs = processor(images=image, return_tensors="pt").to(DEVICE)
                with torch.no_grad():
                    outputs = model.get_image_features(**inputs)
                
                # If outputs is not a tensor (sometimes happens with different transformer versions)
                if isinstance(outputs, torch.Tensor):
                    image_features = outputs
                elif hasattr(outputs, 'image_embeds'):
                    image_features = outputs.image_embeds
                elif hasattr(outputs, 'pooler_output'):
                    image_features = outputs.pooler_output
                elif hasattr(outputs, 'last_hidden_state'):
                    # Use the first token ([CLS]) if it's a sequence output
                    image_features = outputs.last_hidden_state[:, 0, :]
                else:
                    # Generic fallback
                    image_features = outputs[0] if isinstance(outputs, (list, tuple)) else outputs
                
                # Normalize embedding
                image_features = image_features / image_features.norm(p=2, dim=-1, keepdim=True)
                embedding = image_features.cpu().numpy().flatten().astype(np.float32).tobytes()
                
                cursor.execute("UPDATE products SET embedding = ? WHERE id = ?", (embedding, product['id']))
                if (i + 1) % 10 == 0:
                    conn.commit()
            except Exception as e:
                print(f"Failed to generate embedding for {product['name']}: {e}")
        else:
            print(f"Skipping {product['name']} due to missing image.")
            
    conn.commit()
    conn.close()
    print("Embedding generation complete!")

if __name__ == "__main__":
    generate_embeddings()
