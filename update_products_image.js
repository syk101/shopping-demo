const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'shop.db');
const db = new sqlite3.Database(dbPath);

const imagesDir = path.join(__dirname, 'frontend', 'public', 'premium wear');
const imageFiles = fs.readdirSync(imagesDir).filter(f => f.match(/\.(jpg|jpeg|png)$/i));

if (imageFiles.length === 0) {
    console.error("No images found in", imagesDir);
    process.exit(1);
}

db.all("SELECT id FROM products WHERE category = 'men_PREMIUM'", [], (err, rows) => {
    if (err) {
        console.error("Error reading products:", err.message);
        return;
    }

    console.log(`Found ${rows.length} men_PREMIUM products in products table.`);

    if (rows.length === 0) {
        console.log("No products to update.");
        db.close();
        return;
    }

    let completed = 0;

    rows.forEach(row => {
        const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
        // The frontend serves the public directory, so the path should be relative to that
        const imagePath = `premium wear/${randomImage}`;

        db.run("UPDATE products SET image = ? WHERE id = ?", [imagePath, row.id], function (err) {
            if (err) {
                console.error(`Error updating product ${row.id}:`, err.message);
            } else {
                console.log(`Updated product ${row.id} with image ${imagePath}`);
            }

            completed++;
            if (completed === rows.length) {
                console.log("Finished updating all products.");
                db.close();
            }
        });
    });
});
