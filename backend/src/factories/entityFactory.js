class EntityFactory {
    static create(type, data) {
        switch(type.toLowerCase()) {
            case 'product': return new Product(data);
            case 'employee': return new Employee(data);
            default: throw new Error("Unknown type");
        }
    }
}

class Product {
    constructor(d) {
        this.id = d.id;
        this.name = d.name;
        this.price = parseFloat(d.price);
        this.category = d.category;
        this.stock = d.stock || 0;
    }
}

class Employee {
    constructor(d) {
        this.id = d.id;
        this.name = d.name;
        this.salary = d.salary;
        this.shift = d.shift;
    }
}

module.exports = EntityFactory;
