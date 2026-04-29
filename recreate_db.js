const { Product } = require('./database/db');

console.log("Database recreation triggered via db.js initialization.");
setTimeout(() => {
    process.exit(0);
}, 5000);
