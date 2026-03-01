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
    const validTables = ['woman_PREMIUM', 'women_casual', 'man_PREMIUM', 'men_casual', 'kid_PREMIUM', 'kid_casual'];
    let allProducts = [];
    for (const table of validTables) {
      try {
        const products = await all(`SELECT *, '${table}' as table_name FROM ${table}`);
        // Add category based on table name (similar to app.py)
        const productsWithCategory = products.map(p => {
          let category = 'other';
          if (table.toLowerCase().includes('woman') || table.toLowerCase().includes('women')) category = 'women';
          else if (table.toLowerCase().includes('man') || table.toLowerCase().includes('men')) category = 'men';
          else if (table.toLowerCase().includes('kid')) category = 'kid';
          return { ...p, category };
        });
        allProducts = allProducts.concat(productsWithCategory);
      } catch (err) {
        console.error(`Error fetching from table ${table}:`, err.message);
      }
    }
    return allProducts;
  },
  getById: (id, tableName) => get(`SELECT * FROM ${tableName} WHERE id = ?`, [id]),
  create: async (tableName, data) => {
    const { name, description, price, stock_quantity, image_data } = data;
    const result = await run(
      `INSERT INTO ${tableName} (name, description, price, stock_quantity, image_data) VALUES (?, ?, ?, ?, ?)`,
      [name, description, price, stock_quantity, image_data || null]
    );
    return await Product.getById(result.id, tableName);
  },
  update: async (id, tableName, data) => {
    const { name, description, price, stock_quantity, image_data } = data;
    await run(
      `UPDATE ${tableName} SET 
             name = COALESCE(?, name), 
             description = COALESCE(?, description), 
             price = COALESCE(?, price), 
             stock_quantity = COALESCE(?, stock_quantity),
             image_data = COALESCE(?, image_data)
             WHERE id = ?`,
      [name, description, price, stock_quantity, image_data, id]
    );
    return await Product.getById(id, tableName);
  },
  delete: async (id, tableName) => {
    const result = await run(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
    return result.changes > 0;
  }
};

// Order functions
const Order = {
  getAll: async () => {
    const validTables = ['woman_PREMIUM', 'women_casual', 'man_PREMIUM', 'men_casual', 'kid_PREMIUM', 'kid_casual'];
    const orders = await all('SELECT * FROM orders ORDER BY id DESC');

    // Enrich orders with product names (similar to app.py)
    const enrichedOrders = await Promise.all(orders.map(async (order) => {
      if (validTables.includes(order.product_category)) {
        try {
          const product = await get(`SELECT name FROM ${order.product_category} WHERE id = ?`, [order.product_id]);
          return { ...order, product_name: product ? product.name : 'Unknown Product' };
        } catch (err) {
          return { ...order, product_name: 'Error: Table Missing' };
        }
      }
      return { ...order, product_name: `Invalid Category (${order.product_category})` };
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
    const validTables = ['woman_PREMIUM', 'women_casual', 'man_PREMIUM', 'men_casual', 'kid_PREMIUM', 'kid_casual'];
    let allInventory = [];
    for (const table of validTables) {
      try {
        const items = await all(`SELECT id, name, stock_quantity, '${table}' as table_name FROM ${table}`);
        const formattedItems = items.map(item => ({
          ...item,
          product_id: item.id,
          table: table,
          min_stock_level: 5 // Default
        }));
        allInventory = allInventory.concat(formattedItems);
      } catch (err) {
        console.error(`Error fetching inventory from ${table}:`, err.message);
      }
    }
    return allInventory;
  },
  getById: (id, tableName) => get(`SELECT id, name, stock_quantity FROM ${tableName} WHERE id = ?`, [id]),
  update: async (id, tableName, data) => {
    const { stock_quantity } = data;
    await run(
      `UPDATE ${tableName} SET stock_quantity = ? WHERE id = ?`,
      [stock_quantity, id]
    );
    return await Inventory.getById(id, tableName);
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

    // For stock trend, pull stock levels across all category tables
    const tables = ['man_PREMIUM', 'woman_PREMIUM', 'kid_PREMIUM', 'men_casual', 'women_casual', 'kid_casual'];
    const stockTrendQuery = tables.map(t => `SELECT stock_quantity as value FROM ${t}`).join(' UNION ALL ');
    const stockTrend = await all(`${stockTrendQuery} LIMIT 30`);

    return {
      revenue: revenueTrend.map(r => r.value),
      orders: ordersTrend.map(o => o.value),
      stock: stockTrend.map(s => s.value).reverse()
    };
  }
};

module.exports = { Product, Order, Inventory, Employee, Stats };
