const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, ai } = require('./src/core/singletons');
const VisionAdapter = require('./src/adapters/visionAdapter');
const { SearchContext, TextSearchStrategy, AISearchStrategy } = require('./src/strategies/searchStrategies');
const { StockSubject, stockNotifier } = require('./src/core/observer');
const chatService = require('./src/services/ChatService');

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

// Health Check
app.get('/test', (req, res) => res.send('OK'));

// Optimized Routes
app.get('/api/products', async (req, res) => {
    const products = await db.query("SELECT *, stock as stock_quantity FROM products");
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

app.post('/api/ai/avatar', async (req, res) => {
    const { image } = req.body;
    try {
        const result = await db.run("INSERT INTO user_avatar (user_image_url) VALUES (?)", [image]);
        res.json({ success: true, avatar_id: result.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// AI Chat Endpoint
app.post('/api/chat', async (req, res) => {
    const { message, history } = req.body;
    try {
        // 1. Get current inventory for context
        const products = await db.query("SELECT id, name, category, price, stock, description FROM products");
        
        // 2. Get AI Response
        const reply = await chatService.getSalesmanResponse(message, products, history || []);
        
        res.json({ success: true, reply });
    } catch (err) {
        console.error("Chat error:", err);
        res.status(500).json({ error: "Salesman is currently busy. Try again soon!" });
    }
});

app.post('/api/ai/tryon', async (req, res) => {
    const { image, avatar_id, product_id } = req.body;
    try {
        let userImage = image;
        if (avatar_id && !userImage) {
            const [avatar] = await db.query("SELECT user_image_url FROM user_avatar WHERE id = ?", [avatar_id]);
            if (avatar) userImage = avatar.user_image_url;
        }

        const [product] = await db.query("SELECT image FROM products WHERE id = ?", [product_id]);
        if (!userImage || !product) throw new Error("User image or product not found");

        const { anchors } = req.body;
        const result = await ai.tryOn(userImage, product.image, anchors);
        
        res.json({ 
            success: true, 
            result_url: result.image,
            message: "AI Avatar stylized successfully"
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/search-by-image', async (req, res) => {
    const { image, vector } = req.body;
    const all = await db.query("SELECT * FROM products");
    
    try {
        let results;
        if (vector) {
            // Browser-side AI already generated vector
            searcher.setStrategy(new AISearchStrategy());
            results = await searcher.search(vector, all);
        } else {
            // Server-side AI processing
            results = await vision.search(image, all);
        }
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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

// Dashboard CRUD Endpoints
app.get('/api/orders', async (req, res) => {
    const orders = await db.query(`
        SELECT o.*, GROUP_CONCAT(p.name || ' (x' || oi.quantity || ')') as products_summary
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        GROUP BY o.id
    `);
    res.json(orders);
});

app.get('/api/inventory', async (req, res) => {
    const inv = await db.query("SELECT id as product_id, name, stock as stock_quantity, 10 as min_stock_level FROM products");
    res.json(inv);
});

app.get('/api/employees', async (req, res) => {
    const emps = await db.query("SELECT * FROM employees");
    res.json(emps);
});

app.get('/api/stats/trends', async (req, res) => {
    // Return mock trend data for the charts
    res.json({
        revenue: [1200, 1500, 1100, 1800, 2200, 1900, 2500],
        orders: [5, 8, 4, 12, 15, 10, 18],
        stock: [100, 95, 110, 105, 120, 115, 120]
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Refactored Server on ${PORT}`));
