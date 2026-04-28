const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');

// GET all inventory items
router.get('/', async (req, res) => {
    try {
        const inventoryItems = await Inventory.getAll();
        res.json(inventoryItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET a single inventory item
router.get('/:id', async (req, res) => {
    try {
        const inventoryItem = await Inventory.getById(req.params.id);
        if (!inventoryItem) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }
        res.json(inventoryItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST create/update an inventory item
router.post('/', async (req, res) => {
    try {
        const inventoryItem = await Inventory.createOrUpdate(req.body);
        res.status(201).json(inventoryItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PUT update an inventory item
router.put('/:id', async (req, res) => {
    try {
        const inventoryItem = await Inventory.update(req.params.id, req.body);
        if (!inventoryItem) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }
        res.json(inventoryItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE an inventory item
router.delete('/:id', async (req, res) => {
    try {
        const success = await Inventory.delete(req.params.id);
        if (!success) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }
        res.json({ message: 'Inventory item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
