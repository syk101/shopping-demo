const express = require('express');
const router = express.Router();
const { Employee } = require('../../database/db');

// Get all employees
router.get('/', async (req, res) => {
    try {
        const employees = await Employee.getAll();
        res.json(employees);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single employee
router.get('/:id', async (req, res) => {
    try {
        const employee = await Employee.getById(req.params.id);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        res.json(employee);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create employee
router.post('/', async (req, res) => {
    try {
        const newEmployee = await Employee.create(req.body);
        res.status(201).json(newEmployee);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update employee
router.put('/:id', async (req, res) => {
    try {
        const updatedEmployee = await Employee.update(req.params.id, req.body);
        res.json(updatedEmployee);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete employee
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Employee.delete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Employee not found' });
        res.json({ message: 'Employee deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
