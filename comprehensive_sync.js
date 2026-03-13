const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database', 'shop.db');
const eveningDir = path.resolve(__dirname, 'frontend', 'public', 'evening_wear');
const casualDir = path.resolve(__dirname, 'frontend', 'public', 'Casual_wear');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
  runComprehensiveUpdate();
});

async function runComprehensiveUpdate() {
  try {
    // 1. Update Women Premium (Evening Wear)
    await updateCategory('women_PREMIUM', 'woman_PREMIUM', eveningDir, 'evening_wear');
    
    // 2. Update Women Casual
    await updateCategory('women_CASUAL', 'women_casual', casualDir, 'Casual_wear');

    console.log('Finalizing...');
    db.close();
  } catch (err) {
    console.error('Update failed:', err);
    db.close();
  }
}

function updateCategory(unifiedCategory, specificTable, imageDirPath, relativePrefix) {
  return new Promise((resolve, reject) => {
    // Get images from directory
    const images = fs.readdirSync(imageDirPath).filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i));
    console.log(`Found ${images.length} images for ${unifiedCategory} in ${imageDirPath}`);

    // Get products from unified table
    db.all("SELECT * FROM products WHERE category = ? ORDER BY id", [unifiedCategory], (err, products) => {
      if (err) return reject(err);
      console.log(`Found ${products.length} products for ${unifiedCategory}`);

      db.serialize(() => {
        // Clear specific table to ensure clean sync
        db.run(`DELETE FROM ${specificTable}`);
        
        const updateProductsStmt = db.prepare("UPDATE products SET image = ? WHERE id = ?");
        const insertSpecificStmt = db.prepare(`INSERT INTO ${specificTable} (id, name, description, price, stock_quantity, image_data) VALUES (?, ?, ?, ?, ?, ?)`);

        products.forEach((product, index) => {
          const imgIndex = index % images.length;
          const imageName = images[imgIndex];
          const relativePath = `${relativePrefix}/${imageName}`;
          const fullImagePath = path.join(imageDirPath, imageName);
          const imageBlob = fs.readFileSync(fullImagePath);

          // Update unified table path
          updateProductsStmt.run(relativePath, product.id);

          // Insert into specific table with BLOB
          insertSpecificStmt.run(
            product.id,
            product.name,
            product.description,
            product.price,
            product.stock,
            imageBlob
          );
          
          console.log(`Syncing Product ${product.id} (${product.name}) with ${imageName}`);
        });

        updateProductsStmt.finalize();
        insertSpecificStmt.finalize(() => {
            console.log(`Completed sync for ${unifiedCategory}`);
            resolve();
        });
      });
    });
  });
}
