const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database', 'shop.db');
const imageDir = path.resolve(__dirname, 'frontend', 'public', 'evening_wear');

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

  // Get products to update
  db.all("SELECT id, name FROM products WHERE category = 'women_PREMIUM' ORDER BY id", (err, products) => {
    if (err) {
      console.error('Error fetching products:', err.message);
      db.close();
      return;
    }

    console.log(`Found ${products.length} products to update.`);

    const stmt = db.prepare("UPDATE products SET image = ? WHERE id = ?");

    products.forEach((product, index) => {
      if (index < images.length) {
        const imagePath = `evening_wear/${images[index]}`;
        stmt.run(imagePath, product.id, (err) => {
          if (err) {
            console.error(`Error updating product ${product.id}:`, err.message);
          } else {
            console.log(`Updated product ${product.id} (${product.name}) with image: ${imagePath}`);
          }
        });
      }
    });

    stmt.finalize(() => {
      console.log('Update finished.');
      db.close();
    });
  });
}
