const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database', 'shop.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking man_PREMIUM data...');
db.all("SELECT id, name, price, stock_quantity, image_data IS NOT NULL as has_image_data FROM man_PREMIUM", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log('Data:', JSON.stringify(rows, null, 2));
    }
    db.close();
});
