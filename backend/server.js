// Import required modules
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const inventoryRoutes = require('./routes/inventory');
const employeeRoutes = require('./routes/employees');

// Use routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/employees', employeeRoutes);

// AI Search Proxy/Fallback
app.post('/api/search-by-image', async (req, res) => {
    try {
        // Try to reach the Flask server on localhost:5001
        const aiResponse = await fetch('http://localhost:5001/api/search-by-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        }).catch(() => null);

        if (aiResponse && aiResponse.ok) {
            const results = await aiResponse.json();
            return res.json(results);
        }

        // Fallback: If AI server is down (like on Render), return some "featured" products as a demo
        console.log("AI Server unreachable, returning fallback results");
        const Product = require('./models/Product');
        const all = await Product.getAll();
        const fallback = all.filter(p => p.is_featured === 1).slice(0, 4);
        res.json(fallback.map(({ embedding, ...rest }) => ({ ...rest, ai_score: 0.95 })));
    } catch (err) {
        res.status(500).json({ message: "Search fallback failed" });
    }
});

// Stats route
const { Stats } = require('../database/db');
app.get('/api/stats/trends', async (req, res) => {
    try {
        const trends = await Stats.getTrends();
        res.json(trends);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Serve static files from the frontend
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public', 'index.html'));
});

// Shop route
app.get('/shop', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public', 'shop.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not Found' });
});

app.listen(PORT, function () {
    console.log('Server is running on port ' + PORT);
});

module.exports = app;
