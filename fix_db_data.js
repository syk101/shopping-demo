const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'database', 'shop.db');
const db = new sqlite3.Database(dbPath);

console.log('Updating database timestamps...');

db.serialize(() => {
    // Update orders to be spread over the last 30 days
    db.all("SELECT id FROM orders", (err, rows) => {
        if (err) return console.error(err);

        rows.forEach((row, index) => {
            // Spread orders over the last 15 days
            const daysAgo = Math.floor(index * 2) % 15;
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            const dateStr = date.toISOString().replace('T', ' ').split('.')[0];

            db.run("UPDATE orders SET created_at = ?, updated_at = ? WHERE id = ?", [dateStr, dateStr, row.id]);
        });
        console.log(`Updated ${rows.length} orders with recent timestamps.`);
    });

    // Update product categories to have current timestamps
    const tables = ['man_PREMIUM', 'woman_PREMIUM', 'kid_PREMIUM', 'men_casual', 'women_casual', 'kid_casual'];
    tables.forEach(table => {
        db.run(`UPDATE ${table} SET created_at = CURRENT_TIMESTAMP`, (err) => {
            if (err) console.error(`Error updating ${table}:`, err.message);
        });
    });

    console.log('Product category timestamps updated to current.');
});

setTimeout(() => {
    db.close();
    console.log('Database update complete.');
}, 2000);
