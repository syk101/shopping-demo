const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'shop.db');
const db = new sqlite3.Database(dbPath);

const imagesDir = path.join(__dirname, 'frontend', 'public', 'premium wear');
const imageFiles = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg'));

if (imageFiles.length === 0) {
    console.error("No images found in", imagesDir);
    process.exit(1);
}

db.all("SELECT id FROM man_PREMIUM", [], (err, rows) => {
    if (err) {
        console.error("Error reading man_PREMIUM:", err.message);
        return;
    }

    console.log(`Found ${rows.length} products in man_PREMIUM.`);

    if (rows.length === 0) {
        console.log("No products to update.");
        db.close();
        return;
    }

    let completed = 0;

    rows.forEach(row => {
        const randomImage = imageFiles[Math.floor(Math.random() * imageFiles.length)];
        const imagePath = path.join(imagesDir, randomImage);
        const imageBuffer = fs.readFileSync(imagePath);

        db.run("UPDATE man_PREMIUM SET image_data = ? WHERE id = ?", [imageBuffer, row.id], function (err) {
            if (err) {
                console.error(`Error updating product ${row.id}:`, err.message);
            } else {
                console.log(`Updated product ${row.id} with image ${randomImage}`);
            }

            completed++;
            if (completed === rows.length) {
                console.log("Finished updating all products in man_PREMIUM.");
                db.close();
            }
        });
    });
});
