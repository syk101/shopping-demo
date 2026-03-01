const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database', 'shop.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking orders table structure...');
db.all("PRAGMA table_info(orders)", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
});
