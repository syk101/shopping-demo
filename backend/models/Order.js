const { Order } = require('../../database/db');

class OrderModel {
    static table = 'orders';

    static async getAll() {
        return await Order.getAll();
    }

    static async getById(id) {
        return await Order.getById(id);
    }

    static async create(data) {
        return await Order.create(data);
    }

    static async update(id, data) {
        return await Order.update(id, data);
    }

    static async delete(id) {
        return await Order.delete(id);
    }
}

module.exports = OrderModel;
