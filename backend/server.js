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

// AI Search Proxy/Fallback/Vector Match
app.post('/api/search-by-image', async (req, res) => {
    try {
        const { image, vector } = req.body;
        const Product = require('./models/Product');

        // 1. If a vector is provided (from Browser AI), do the comparison directly
        if (vector && Array.isArray(vector) && vector.length > 0) {
            const allProducts = await Product.getAll();
            console.log(`Matching vector (${vector.length}) against ${allProducts.length} products`);

            const dotProduct = (a, b) => {
                let dot = 0;
                for (let i = 0; i < a.length; i++) dot += a[i] * (b[i] || 0);
                return dot;
            };
            const magnitude = (a) => Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
            const vecMag = magnitude(vector);
            
            const results = allProducts.map(p => {
                if (!p.embedding) return { ...p, ai_score: 0 };
                
                try {
                    const buffer = Buffer.isBuffer(p.embedding) ? p.embedding : Buffer.from(p.embedding);
                    const targetVector = new Float32Array(
                        buffer.buffer, 
                        buffer.byteOffset, 
                        buffer.byteLength / 4
                    );
                    
                    if (targetVector.length !== vector.length) {
                        // console.log(`Dimension mismatch: DB ${targetVector.length} vs Request ${vector.length}`);
                        return { ...p, ai_score: 0 };
                    }

                    const tarMag = magnitude(targetVector);
                    if (tarMag === 0 || vecMag === 0) return { ...p, ai_score: 0 };
                    
                    const score = dotProduct(vector, targetVector) / (vecMag * tarMag);
                    return { ...p, ai_score: score };
                } catch (e) {
                    return { ...p, ai_score: 0 };
                }
            })
            .filter(p => p.ai_score > 0.01) // Lower threshold to show more matches
            .sort((a, b) => b.ai_score - a.ai_score)
            .slice(0, 10);

            console.log(`Found ${results.length} matches via vector search`);
            if (results.length > 0) {
                const finalResults = results.map(({ embedding, ...rest }) => rest);
                return res.json(finalResults);
            }
        }

        // 2. If it's a local dev environment with Python running
        console.log("Vector search failed or not provided, trying local Python AI...");
        const aiResponse = await fetch('http://localhost:5001/api/search-by-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image })
        }).catch(() => null);

        if (aiResponse && aiResponse.ok) {
            const results = await aiResponse.json();
            console.log(`Found ${results.length} matches via Python AI`);
            return res.json(results);
        }

        // 3. Fallback for production: Return featured products
        console.log("AI Search unavailable, returning featured products as fallback.");
        const all = await Product.getAll();
        const fallback = all.filter(p => p.is_featured === 1 || p.is_featured === true || p.is_featured === "1").slice(0, 8);
        
        // If still no featured products, just return first 8
        const finalFallback = fallback.length > 0 ? fallback : all.slice(0, 8);
        res.json(finalFallback.map(({ embedding, ...rest }) => ({ ...rest, ai_score: 0.5 })));
    } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ message: "Search failed", error: err.message });
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
