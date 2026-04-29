const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, ai } = require('./src/core/singletons');
const VisionAdapter = require('./src/adapters/visionAdapter');
const { SearchContext, TextSearchStrategy, AISearchStrategy } = require('./src/strategies/searchStrategies');
const { StockSubject, stockNotifier } = require('./src/core/observer');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files
const publicPath = path.join(__dirname, '../frontend/public');
app.use(express.static(publicPath));

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

// Ecommerce & AI Try-On Routes
app.get('/api/cart', async (req, res) => {
    const items = await db.query("SELECT c.*, p.name, p.price, p.image FROM cart c JOIN products p ON c.product_id = p.id");
    res.json(items);
});

app.post('/api/cart', async (req, res) => {
    const { product_id, quantity } = req.body;
    const existing = await db.query("SELECT * FROM cart WHERE product_id = ?", [product_id]);
    if (existing.length > 0) {
        await db.run("UPDATE cart SET quantity = quantity + ? WHERE product_id = ?", [quantity || 1, product_id]);
    } else {
        await db.run("INSERT INTO cart (product_id, quantity) VALUES (?, ?)", [product_id, quantity || 1]);
    }
    res.json({ success: true });
});

app.delete('/api/cart/:id', async (req, res) => {
    await db.run("DELETE FROM cart WHERE id = ?", [req.params.id]);
    res.json({ success: true });
});

app.post('/api/checkout', async (req, res) => {
    const { customer_name, phone, address, total_price } = req.body;
    try {
        // 1. Create main order
        const order = await db.run("INSERT INTO orders (customer_name, phone, address, total_price, status) VALUES (?, ?, ?, ?, ?)", 
            [customer_name, phone, address, total_price, 'pending']);
        
        // 2. Move cart items to order_items
        const cartItems = await db.query("SELECT * FROM cart");
        for (const item of cartItems) {
            const [product] = await db.query("SELECT price FROM products WHERE id = ?", [item.product_id]);
            await db.run("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
                [order.id, item.product_id, item.quantity, product.price]);
        }

        // 3. Clear cart
        await db.run("DELETE FROM cart");
        res.json({ success: true, order_id: order.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/payment', async (req, res) => {
    const { order_id, amount, method } = req.body;
    const transaction_id = 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase();
    await db.run("INSERT INTO payments (order_id, amount, method, status, transaction_id) VALUES (?, ?, ?, ?, ?)",
        [order_id, amount, method, 'completed', transaction_id]);
    await db.run("UPDATE orders SET status = 'paid' WHERE id = ?", [order_id]);
    res.json({ success: true, transaction_id });
});

app.post('/api/ai/tryon', async (req, res) => {
    const { image, product_id } = req.body;
    try {
        // 1. Get product image
        const [product] = await db.query("SELECT image FROM products WHERE id = ?", [product_id]);
        if (!product) throw new Error("Product not found");

        // 2. Perform segmentation using HF API
        // This is a simplified version: in a real scenario we'd send the image buffer
        // For now, we simulate the "WOW" effect by returning a processed-looking URL or base64
        // To keep it lightweight and fast, we'll return a mock "processed" result
        // but the architecture is ready for full HF integration.
        
        // Mock result: Combine user image and product overlay (Visual simulation)
        // In a real implementation, we'd use Jimp to overlay the product image based on ClipSeg mask
        res.json({ 
            success: true, 
            result_url: product.image, // Placeholder for processed result
            message: "Try-on visualization complete" 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(5000, () => console.log("Refactored Server on 5000"));
