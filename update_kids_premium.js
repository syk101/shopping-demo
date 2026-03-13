const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database', 'shop.db');
const imageDir = path.resolve(__dirname, 'frontend', 'public', 'kid_premium');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
  updateImages();
});

function updateImages() {
  // Get images from directory
  const images = fs.readdirSync(imageDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'));
  console.log(`Found ${images.length} images in ${imageDir}`);

  if (images.length === 0) {
    console.error('No images found to update.');
    db.close();
    return;
  }

  // Get products to update
  db.all("SELECT id, name FROM products WHERE category = 'kids_PREMIUM' ORDER BY id", (err, products) => {
    if (err) {
      console.error('Error fetching products:', err.message);
      db.close();
      return;
    }

    console.log(`Found ${products.length} products to update.`);

    if (products.length === 0) {
        console.log('No products found with category kids_PREMIUM.');
        db.close();
        return;
    }

    const stmt = db.prepare("UPDATE products SET image = ? WHERE id = ?");

    products.forEach((product, index) => {
      // Use modulo to cycle through images if there are fewer images than products
      const imageIndex = index % images.length;
      const imagePath = `kid_premium/${images[imageIndex]}`;
      
      stmt.run(imagePath, product.id, (err) => {
        if (err) {
          console.error(`Error updating product ${product.id}:`, err.message);
        } else {
          console.log(`Updated product ${product.id} (${product.name}) with image: ${imagePath}`);
        }
      });
    });

    stmt.finalize(() => {
      console.log('Update finished.');
      db.close();
    });
  });
}
