const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database', 'shop.db');
const db = new sqlite3.Database(dbPath);

console.log('Connecting to database...');

db.all("SELECT id, name, category FROM products", [], (err, rows) => {
    if (err) {
        console.error(err.message);
        return;
    }

    console.log(`Updating ${rows.length} products with relevant images...`);

    const stmt = db.prepare("UPDATE products SET image = ? WHERE id = ?");

    rows.forEach((row, index) => {
        let keywords = '';
        const name = row.name.toLowerCase();
        const cat = row.category ? row.category.toLowerCase() : '';

        if (cat.includes('men_premium')) {
            if (name.includes('suit')) keywords = 'mens,tailored,suit';
            else if (name.includes('blazer')) keywords = 'mens,blazer,luxury';
            else if (name.includes('watch')) keywords = 'luxury,watch,mens';
            else if (name.includes('shoe')) keywords = 'oxford,shoes,mens';
            else if (name.includes('coat')) keywords = 'mens,wool,coat';
            else keywords = 'mens,premium,fashion';
        } else if (cat.includes('men_casual')) {
            if (name.includes('t-shirt')) keywords = 'mens,tshirt,style';
            else if (name.includes('jeans')) keywords = 'mens,denim,jeans';
            else if (name.includes('sneakers')) keywords = 'mens,sneakers,urban';
            else if (name.includes('hoodie')) keywords = 'mens,hoodie,streetwear';
            else if (name.includes('polo')) keywords = 'mens,polo,shirt';
            else keywords = 'mens,casual,apparel';
        } else if (cat.includes('women_premium')) {
            if (name.includes('gown') || name.includes('evening')) keywords = 'womens,evening,gown';
            else if (name.includes('dress')) keywords = 'womens,luxury,dress';
            else if (name.includes('handbag')) keywords = 'luxury,handbag,womens';
            else if (name.includes('stilettos')) keywords = 'stilettos,high,heels';
            else if (name.includes('neck')) keywords = 'jewelry,necklace,pearl';
            else if (name.includes('ear')) keywords = 'jewelry,diamond,earrings';
            else keywords = 'womens,couture,fashion';
        } else if (cat.includes('women_casual')) {
            if (name.includes('dress') || name.includes('floral')) keywords = 'womens,floral,dress';
            else if (name.includes('yoga') || name.includes('leggings')) keywords = 'womens,yoga,outfit';
            else if (name.includes('cardigan') || name.includes('knit')) keywords = 'womens,cardigan,style';
            else if (name.includes('top') || name.includes('shirt')) keywords = 'womens,casual,top';
            else keywords = 'womens,casual,wear';
        } else if (cat.includes('kids_premium')) {
            if (name.includes('dress') || name.includes('gown')) keywords = 'kids,party,dress';
            else if (name.includes('suit') || name.includes('blazer')) keywords = 'kids,formal,suit';
            else if (name.includes('loafers')) keywords = 'kids,formal,shoes';
            else keywords = 'kids,elegant,clothing';
        } else if (cat.includes('kids_casual')) {
            if (name.includes('play')) keywords = 'kids,playtime,clothes';
            else if (name.includes('school')) keywords = 'kids,school,uniform';
            else keywords = 'kids,clothing,casual';
        } else {
            keywords = 'fashion,apparel';
        }

        // Use lock for variety and fixed mapping
        // Adding the index to keywords for even more variety
        const imageUrl = `https://loremflickr.com/400/600/${keywords}?lock=${row.id + 100}`;

        stmt.run(imageUrl, row.id, (updateErr) => {
            if (updateErr) {
                console.error(`Error updating product ${row.id}:`, updateErr.message);
            }
        });
    });

    stmt.finalize(() => {
        console.log('Finished updating product images.');
        db.close();
    });
});
