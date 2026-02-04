const { Product } = require('../../database/db');

class ProductModel {
    static table = 'products';

    static async getAll() {
        return await Product.getAll();
    }

    static async getById(id) {
        return await Product.getById(id);
    }

    static async create(data) {
        return await Product.create(data);
    }

    static async update(id, data) {
        return await Product.update(id, data);
    }

    static async delete(id) {
        return await Product.delete(id);
    }
}

module.exports = ProductModel;
