class StockSubject {
    constructor() { this.observers = []; }
    subscribe(fn) { this.observers.push(fn); }
    notify(data) { this.observers.forEach(fn => fn(data)); }
}

const stockNotifier = (product) => {
    if (product.stock < 5) {
        console.log(`ALERT: Low stock for ${product.name} (${product.stock} left)`);
    }
};

module.exports = { StockSubject, stockNotifier };
