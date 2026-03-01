const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database', 'shop.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking tables in:', dbPath);
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log('Tables:', rows.map(r => r.name).join(', '));

        // Check row counts for product tables
        const tables = ['man_PREMIUM', 'woman_PREMIUM', 'kid_PREMIUM', 'men_casual', 'women_casual', 'kid_casual'];
        tables.forEach(table => {
            db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
                if (err) {
                    console.log(`Table ${table} error: ${err.message}`);
                } else {
                    console.log(`Table ${table}: ${row.count} rows`);
                }
            });
        });
    }
    setTimeout(() => db.close(), 1000);
});
