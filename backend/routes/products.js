const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.getAll();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET products by table
router.get('/:tableName', async (req, res) => {
    try {
        const products = await Product.getAll();
        const filtered = products.filter(p => p.table_name === req.params.tableName);
        res.json(filtered);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create a new product
router.post('/:tableName', async (req, res) => {
    try {
        const product = await Product.create(req.params.tableName, req.body);
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT update a product
router.put('/:tableName/:id', async (req, res) => {
    try {
        const product = await Product.update(req.params.id, req.params.tableName, req.body);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE a product
router.delete('/:tableName/:id', async (req, res) => {
    try {
        const success = await Product.delete(req.params.id, req.params.tableName);
        if (!success) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
