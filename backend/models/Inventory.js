const { Inventory } = require('../../database/db');

class InventoryModel {
    static table = 'inventory';

    static async getAll() {
        return await Inventory.getAll();
    }

    static async getById(id) {
        return await Inventory.getById(id);
    }

    static async createOrUpdate(data) {
        return await Inventory.createOrUpdate(data);
    }

    static async update(id, data) {
        return await Inventory.update(id, data);
    }

    static async delete(id) {
        return await Inventory.delete(id);
    }
}

module.exports = InventoryModel;
