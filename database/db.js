const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'shop.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

function initDb() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  db.exec(schema, (err) => {
    if (err) {
      console.error('Error initializing database schema', err.message);
    } else {
      console.log('Database schema initialized.');
    }
  });
}

// Helper to wrap sqlite functions in promises
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        console.log('Error running sql ' + sql);
        console.log(err);
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, result) => {
      if (err) {
        console.log('Error running sql: ' + sql);
        console.log(err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.log('Error running sql: ' + sql);
        console.log(err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Product functions
// Product functions
const Product = {
  getAll: () => all('SELECT * FROM products ORDER BY created_at DESC'),
  getById: (id) => get('SELECT * FROM products WHERE id = ?', [id]),
  create: async (data) => {
    const { name, description, category, price, image, stock_quantity } = data;
    const result = await run(
      'INSERT INTO products (name, description, category, price, image, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, category, price, image || '', stock_quantity]
    );
    const newProduct = await Product.getById(result.id);

    // Also add to inventory
    await run(
      'INSERT INTO inventory (product_id, stock_quantity, min_stock_level) VALUES (?, ?, ?)',
      [result.id, stock_quantity, 10]
    );

    return newProduct;
  },
  update: async (id, data) => {
    const { name, description, category, price, image, stock_quantity } = data;

    // Update product
    await run(
      `UPDATE products SET 
             name = COALESCE(?, name), 
             description = COALESCE(?, description), 
             category = COALESCE(?, category), 
             price = COALESCE(?, price), 
             image = COALESCE(?, image),
             stock_quantity = COALESCE(?, stock_quantity),
             updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
      [name, description, category, price, image, stock_quantity, id]
    );

    // Sync inventory if stock_quantity is updated
    if (stock_quantity !== undefined) {
      await run(
        'UPDATE inventory SET stock_quantity = ? WHERE product_id = ?',
        [stock_quantity, id]
      );
    }

    return await Product.getById(id);
  },
  delete: async (id) => {
    // Inventory likely cascades due to foreign key, but let's be safe or rely on schema
    const result = await run('DELETE FROM products WHERE id = ?', [id]);
    return result.changes > 0;
  }
};

// Order functions
const Order = {
  getAll: () => all('SELECT * FROM orders ORDER BY created_at DESC'),
  getById: (id) => get('SELECT * FROM orders WHERE id = ?', [id]),
  create: async (data) => {
    const { customer_name, customer_email, product_id, quantity, total_amount, status } = data;
    const result = await run(
      'INSERT INTO orders (customer_name, customer_email, product_id, quantity, total_amount, status) VALUES (?, ?, ?, ?, ?, ?)',
      [customer_name, customer_email, product_id, quantity, total_amount, status || 'pending']
    );

    // Update inventory
    await run('UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE product_id = ?', [quantity, product_id]);
    // Also update product stock
    await run('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [quantity, product_id]);

    return await Order.getById(result.id);
  },
  update: async (id, data) => {
    const { status } = data;
    await run('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
    return await Order.getById(id);
  },
  delete: async (id) => {
    const result = await run('DELETE FROM orders WHERE id = ?', [id]);
    return result.changes > 0;
  }
};

// Inventory functions
const Inventory = {
  getAll: () => all(`
        SELECT i.*, p.name as product_name 
        FROM inventory i 
        JOIN products p ON i.product_id = p.id
    `),
  getById: (id) => get('SELECT * FROM inventory WHERE id = ?', [id]),
  createOrUpdate: async (data) => {
    const { product_id, stock_quantity, min_stock_level } = data;
    const existing = await get('SELECT id FROM inventory WHERE product_id = ?', [product_id]);

    if (existing) {
      await run(
        'UPDATE inventory SET stock_quantity = ?, min_stock_level = COALESCE(?, min_stock_level), last_updated = CURRENT_TIMESTAMP WHERE id = ?',
        [stock_quantity, min_stock_level, existing.id]
      );
      return await Inventory.getById(existing.id);
    } else {
      const result = await run(
        'INSERT INTO inventory (product_id, stock_quantity, min_stock_level) VALUES (?, ?, ?)',
        [product_id, stock_quantity, min_stock_level || 10]
      );
      return await Inventory.getById(result.id);
    }
  },
  update: async (id, data) => {
    const { stock_quantity, min_stock_level } = data;

    // Get product_id for this inventory item
    const inventoryItem = await get('SELECT product_id FROM inventory WHERE id = ?', [id]);

    if (inventoryItem) {
      await run(
        'UPDATE inventory SET stock_quantity = COALESCE(?, stock_quantity), min_stock_level = COALESCE(?, min_stock_level), last_updated = CURRENT_TIMESTAMP WHERE id = ?',
        [stock_quantity, min_stock_level, id]
      );

      // Sync products table
      if (stock_quantity !== undefined) {
        await run(
          'UPDATE products SET stock_quantity = ? WHERE id = ?',
          [stock_quantity, inventoryItem.product_id]
        );
      }
    }

    return await Inventory.getById(id);
  }
};

module.exports = { Product, Order, Inventory };
