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
const Product = {
  getAll: async () => {
    try {
      const products = await all("SELECT *, 'products' as table_name FROM products");
      const productsWithCategory = products.map(p => {
        let category_group = 'other';
        const cat = p.category ? p.category.toLowerCase() : '';
        if (cat.includes('woman') || cat.includes('women')) category_group = 'women';
        else if (cat.includes('man') || cat.includes('men')) category_group = 'men';
        else if (cat.includes('kid')) category_group = 'kid';
        return { ...p, category_group };
      });
      return productsWithCategory;
    } catch (err) {
      console.error(`Error fetching products:`, err.message);
      return [];
    }
  },
  getById: (id) => get(`SELECT * FROM products WHERE id = ?`, [id]),
  create: async (data) => {
    const { name, description, price, stock_quantity, category, image, rating, discount, is_featured, sales_count, ai_score } = data;
    const result = await run(
      `INSERT INTO products (name, description, price, stock, category, image, rating, discount, is_featured, sales_count, ai_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, price, stock_quantity || data.stock, category, image, rating || 4.5, discount || 0, is_featured || 0, sales_count || 0, ai_score || 0.5]
    );
    return await Product.getById(result.id);
  },
  update: async (id, data) => {
    const { name, description, price, stock, image, rating, discount, is_featured } = data;
    await run(
      `UPDATE products SET 
             name = COALESCE(?, name), 
             description = COALESCE(?, description), 
             price = COALESCE(?, price), 
             stock = COALESCE(?, stock),
             image = COALESCE(?, image),
             rating = COALESCE(?, rating),
             discount = COALESCE(?, discount),
             is_featured = COALESCE(?, is_featured)
             WHERE id = ?`,
      [name, description, price, stock, image, rating, discount, is_featured, id]
    );
    return await Product.getById(id);
  },
  delete: async (id, tableName) => {
    const result = await run(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
    return result.changes > 0;
  }
};

// Order functions
const Order = {
  getAll: async () => {
    const orders = await all('SELECT * FROM orders ORDER BY id DESC');
    const enrichedOrders = await Promise.all(orders.map(async (order) => {
      try {
        const product = await get(`SELECT name FROM products WHERE id = ?`, [order.product_id]);
        return { ...order, product_name: product ? product.name : 'Unknown Product' };
      } catch (err) {
        return { ...order, product_name: 'Error: Product Missing' };
      }
    }));
    return enrichedOrders;
  },
  getById: (id) => get('SELECT * FROM orders WHERE id = ?', [id]),
  create: async (data) => {
    const { customer_name, phone, address, product_category, product_id, quantity, total_price, status } = data;
    const result = await run(
      'INSERT INTO orders (customer_name, phone, address, product_category, product_id, quantity, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [customer_name, phone, address, product_category, product_id, quantity, total_price, status || 'pending']
    );
    return await Order.getById(result.id);
  },
  update: async (id, data) => {
    const { status } = data;
    await run('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    return await Order.getById(id);
  },
  delete: async (id) => {
    const result = await run('DELETE FROM orders WHERE id = ?', [id]);
    return result.changes > 0;
  }
};

// Inventory functions
const Inventory = {
  getAll: async () => {
    try {
      const items = await all(`SELECT id, name, stock as stock_quantity, category as table_name FROM products`);
      return items.map(item => ({
        ...item,
        product_id: item.id,
        table: item.table_name,
        min_stock_level: 5
      }));
    } catch (err) {
      console.error(`Error fetching inventory:`, err.message);
      return [];
    }
  },
  getById: (id) => get(`SELECT id, name, stock as stock_quantity FROM products WHERE id = ?`, [id]),
  update: async (id, data) => {
    const { stock_quantity } = data;
    await run(`UPDATE products SET stock = ? WHERE id = ?`, [stock_quantity, id]);
    return await Inventory.getById(id);
  }
};


// Employee functions
const Employee = {
  getAll: () => all('SELECT * FROM employees ORDER BY id DESC'),
  getById: (id) => get('SELECT * FROM employees WHERE id = ?', [id]),
  create: async (data) => {
    const { name, salary, working_hours, shift, image_data } = data;
    const result = await run(
      'INSERT INTO employees (name, salary, working_hours, shift, image_data) VALUES (?, ?, ?, ?, ?)',
      [name, salary, working_hours, shift, image_data || null]
    );
    return await Employee.getById(result.id);
  },
  update: async (id, data) => {
    const { name, salary, working_hours, shift, image_data } = data;
    await run(
      `UPDATE employees SET 
             name = COALESCE(?, name), 
             salary = COALESCE(?, salary), 
             working_hours = COALESCE(?, working_hours), 
             shift = COALESCE(?, shift),
             image_data = COALESCE(?, image_data),
             updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
      [name, salary, working_hours, shift, image_data, id]
    );
    return await Employee.getById(id);
  },
  delete: async (id) => {
    const result = await run('DELETE FROM employees WHERE id = ?', [id]);
    return result.changes > 0;
  }
};

// Stats functions
const Stats = {
  getTrends: async () => {
    const days = 30;
    const revenueTrend = await all(`
      WITH RECURSIVE dates(date) AS (
        SELECT date('now', '-29 days')
        UNION ALL
        SELECT date(date, '+1 day') FROM dates WHERE date < date('now')
      )
      SELECT 
        d.date,
        COALESCE(SUM(o.total_price), 0) as value
      FROM dates d
      LEFT JOIN orders o ON date(o.created_at) = d.date
      GROUP BY d.date
      ORDER BY d.date ASC
    `);

    const ordersTrend = await all(`
      WITH RECURSIVE dates(date) AS (
        SELECT date('now', '-29 days')
        UNION ALL
        SELECT date(date, '+1 day') FROM dates WHERE date < date('now')
      )
      SELECT 
        d.date,
        COALESCE(COUNT(o.id), 0) as value
      FROM dates d
      LEFT JOIN orders o ON date(o.created_at) = d.date
      GROUP BY d.date
      ORDER BY d.date ASC
    `);

    const stockTrend = await all(`SELECT stock as value FROM products LIMIT 30`);

    return {
      revenue: revenueTrend.map(r => r.value),
      orders: ordersTrend.map(o => o.value),
      stock: stockTrend.map(s => s.value).reverse()
    };
  }
};

module.exports = { Product, Order, Inventory, Employee, Stats };
