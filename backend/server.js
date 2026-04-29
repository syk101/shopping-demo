const express = require('express');
const cors = require('cors');
const { db, ai } = require('./src/core/singletons');
const VisionAdapter = require('./src/adapters/visionAdapter');
const { SearchContext, TextSearchStrategy, AISearchStrategy } = require('./src/strategies/searchStrategies');
const { StockSubject, stockNotifier } = require('./src/core/observer');

const app = express();
app.use(cors());
app.use(express.json());

// Init Adapters & Strategies
const vision = new VisionAdapter(ai);
const searcher = new SearchContext();
const stockManager = new StockSubject();
stockManager.subscribe(stockNotifier);

// Optimized Routes
app.get('/api/products', async (req, res) => {
    const products = await db.query("SELECT * FROM products");
    res.json(products);
});

app.post('/api/search', async (req, res) => {
    const { type, query } = req.body;
    const all = await db.query("SELECT * FROM products");
    
    if (type === 'text') searcher.setStrategy(new TextSearchStrategy());
    else searcher.setStrategy(new AISearchStrategy());
    
    const results = await searcher.search(query, all);
    res.json(results);
});

app.patch('/api/stock/:id', async (req, res) => {
    const { id } = req.params;
    const { stock } = req.body;
    await db.run("UPDATE products SET stock = ? WHERE id = ?", [stock, id]);
    const [updated] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
    stockManager.notify(updated);
    res.json(updated);
});

app.listen(5000, () => console.log("Refactored Server on 5000"));
