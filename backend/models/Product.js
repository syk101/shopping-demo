const { Product } = require('../../database/db');

class ProductModel {
    static async getAll() {
        return await Product.getAll();
    }

    static async getById(id, tableName) {
        return await Product.getById(id, tableName);
    }

    static async create(tableName, data) {
        return await Product.create(tableName, data);
    }

    static async update(id, tableName, data) {
        return await Product.update(id, tableName, data);
    }

    static async delete(id, tableName) {
        return await Product.delete(id, tableName);
    }
}

module.exports = ProductModel;
