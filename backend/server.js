const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const sharp = require('sharp');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper: Image Optimization
async function optimizeImage(base64Data) {
    try {
        const buffer = Buffer.from(base64Data.split(',')[1] || base64Data, 'base64');
        const optimized = await sharp(buffer)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
        return optimized;
    } catch (err) {
        console.error("Image optimization error:", err);
        return Buffer.from(base64Data.split(',')[1] || base64Data, 'base64');
    }
}

// Helper: HF API Embedding
async function getHFEmbedding(buffer) {
    const MODEL_ID = "sentence-transformers/clip-ViT-B-32";
    const API_URL = `https://api-inference.huggingface.co/models/${MODEL_ID}`;
    
    if (!process.env.HF_API_KEY) {
        console.warn("HF_API_KEY missing");
        return null;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.HF_API_KEY}` },
            body: buffer
        });
        
        if (!response.ok) throw new Error(`HF API error: ${response.statusText}`);
        
        const embedding = await response.json();
        return Array.isArray(embedding[0]) ? embedding[0] : embedding;
    } catch (err) {
        console.error("HF Embedding error:", err);
        return null;
    }
}

// Routes
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const inventoryRoutes = require('./routes/inventory');
const employeeRoutes = require('./routes/employees');

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/employees', employeeRoutes);

// AI Search
app.post('/api/search-by-image', async (req, res) => {
    try {
        const { image, vector } = req.body;
        const { Product } = require('../database/db');

        let queryVector = vector;

        // 1. If no vector provided, generate via HF API
        if (!queryVector && image) {
            console.log("Generating vector via HF API...");
            const optimized = await optimizeImage(image);
            queryVector = await getHFEmbedding(optimized);
        }

        if (queryVector && Array.isArray(queryVector)) {
            const allProducts = await Product.getAll();
            
            const dotProduct = (a, b) => a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
            const magnitude = (a) => Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
            
            const qMag = magnitude(queryVector);
            
            const results = allProducts.map(p => {
                if (!p.embedding) return { ...p, ai_score: 0 };
                
                const buffer = Buffer.isBuffer(p.embedding) ? p.embedding : Buffer.from(p.embedding);
                const targetVector = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
                
                if (targetVector.length !== queryVector.length) return { ...p, ai_score: 0 };

                const tMag = magnitude(targetVector);
                const score = dotProduct(queryVector, targetVector) / (qMag * tMag);
                return { ...p, ai_score: score };
            })
            .filter(p => p.ai_score > 0.6)
            .sort((a, b) => b.ai_score - a.ai_score)
            .slice(0, 8);

            return res.json(results.map(({ embedding, ...rest }) => rest));
        }

        // Fallback
        const all = await Product.getAll();
        res.json(all.filter(p => p.is_featured).slice(0, 8));
    } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ message: "Search failed" });
    }
});

// Stats
const { Stats } = require('../database/db');
app.get('/api/stats/trends', async (req, res) => {
    try {
        const trends = await Stats.getTrends();
        res.json(trends);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Static Files
app.use(express.static(path.join(__dirname, '../frontend/public')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Production server running on port ${PORT}`);
});
