from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
import base64
import traceback

app = Flask(__name__, static_folder='frontend/public')
CORS(app)

# Use absolute path for database
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, 'database', 'shop.db')

def get_db_connection():
    conn = sqlite3.connect(DATABASE, timeout=20)
    conn.row_factory = sqlite3.Row
    return conn

def row_to_dict(row):
    d = dict(row)
    if 'image_data' in d and d['image_data']:
        try:
            d['image_data'] = base64.b64encode(d['image_data']).decode('utf-8')
        except Exception:
            d['image_data'] = None
    return d

# --- API Routes ---

@app.route('/api/products', methods=['GET'])
def get_all_products():
    valid_tables = ['woman_PREMIUM', 'women_casual', 'man_PREMIUM', 'men_casual', 'kid_PREMIUM', 'kid_casual']
    all_products = []
    conn = None
    try:
        conn = get_db_connection()
        for table in valid_tables:
            products = conn.execute(f'SELECT * FROM {table}').fetchall()
            for p in products:
                d = row_to_dict(p)
                if 'woman' in table or 'women' in table:
                    d['category'] = 'women'
                elif 'man' in table or 'men' in table:
                    d['category'] = 'men'
                elif 'kid' in table:
                    d['category'] = 'kid'
                else:
                    d['category'] = 'other'
                d['table_name'] = table
                all_products.append(d)
        return jsonify(all_products)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/products/<table_name>', methods=['GET'])
def get_products(table_name):
    valid_tables = ['woman_PREMIUM', 'women_casual', 'man_PREMIUM', 'men_casual', 'kid_PREMIUM', 'kid_casual']
    if table_name not in valid_tables:
        return jsonify({"error": "Invalid table"}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        products = conn.execute(f'SELECT * FROM {table_name}').fetchall()
        return jsonify([row_to_dict(p) for p in products])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/products/<table_name>', methods=['POST'])
def add_product(table_name):
    valid_tables = ['woman_PREMIUM', 'women_casual', 'man_PREMIUM', 'men_casual', 'kid_PREMIUM', 'kid_casual']
    if table_name not in valid_tables:
        return jsonify({"error": "Invalid table"}), 400
    
    conn = None
    try:
        data = request.json
        name = data.get('name')
        if not name:
            return jsonify({"error": "Name is required"}), 400
            
        description = data.get('description', '')
        price = data.get('price', 0)
        stock_quantity = data.get('stock_quantity', 0)
        image_b64 = data.get('image_data')
        
        image_blob = None
        if image_b64:
            if ',' in image_b64:
                image_b64 = image_b64.split(',')[1]
            image_blob = base64.b64decode(image_b64)

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(f'''
            INSERT INTO {table_name} (name, description, price, stock_quantity, image_data)
            VALUES (?, ?, ?, ?, ?)
        ''', (name, description, price, stock_quantity, image_blob))
        conn.commit()
        new_id = cursor.lastrowid
        return jsonify({"id": new_id, "message": "Product added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/products/<table_name>/<int:product_id>', methods=['PUT'])
def update_product(table_name, product_id):
    valid_tables = ['woman_PREMIUM', 'women_casual', 'man_PREMIUM', 'men_casual', 'kid_PREMIUM', 'kid_casual']
    if table_name not in valid_tables:
        return jsonify({"error": "Invalid table"}), 400
    
    conn = None
    try:
        data = request.json
        name = data.get('name')
        description = data.get('description', '')
        price = data.get('price', 0)
        stock_quantity = data.get('stock_quantity', 0)
        image_b64 = data.get('image_data')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if image_b64:
            if ',' in image_b64:
                image_b64 = image_b64.split(',')[1]
            image_blob = base64.b64decode(image_b64)
            cursor.execute(f'''
                UPDATE {table_name} SET name=?, description=?, price=?, stock_quantity=?, image_data=?
                WHERE id=?
            ''', (name, description, price, stock_quantity, image_blob, product_id))
        else:
            cursor.execute(f'''
                UPDATE {table_name} SET name=?, description=?, price=?, stock_quantity=?
                WHERE id=?
            ''', (name, description, price, stock_quantity, product_id))
            
        conn.commit()
        return jsonify({"message": "Product updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/products/<table_name>/<int:product_id>', methods=['DELETE'])
def delete_product(table_name, product_id):
    valid_tables = ['woman_PREMIUM', 'women_casual', 'man_PREMIUM', 'men_casual', 'kid_PREMIUM', 'kid_casual']
    if table_name not in valid_tables:
        return jsonify({"error": "Invalid table"}), 400
    
    conn = None
    try:
        conn = get_db_connection()
        conn.execute(f'DELETE FROM {table_name} WHERE id=?', (product_id,))
        conn.commit()
        return jsonify({"message": "Product deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/orders/<int:order_id>', methods=['DELETE'])
def delete_order(order_id):
    conn = None
    try:
        conn = get_db_connection()
        conn.execute('DELETE FROM orders WHERE id=?', (order_id,))
        conn.commit()
        return jsonify({"message": "Order deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/orders', methods=['GET'])
def get_orders():
    valid_tables = ['woman_PREMIUM', 'women_casual', 'man_PREMIUM', 'men_casual', 'kid_PREMIUM', 'kid_casual']
    conn = None
    try:
        conn = get_db_connection()
        orders = conn.execute('SELECT * FROM orders ORDER BY id DESC').fetchall()
        
        # Cache product names to avoid repeated queries
        product_cache = {} # {(table, id): name}
        result = []
        
        for o in orders:
            order_dict = dict(o)
            cat = order_dict['product_category']
            pid = order_dict['product_id']
            
            # Basic validation: ensure category is one of the product tables
            if cat not in valid_tables:
                order_dict['product_name'] = f"Invalid Category ({cat})"
                result.append(order_dict)
                continue

            cache_key = (cat, pid)
            if cache_key not in product_cache:
                try:
                    prod = conn.execute(f"SELECT name FROM {cat} WHERE id=?", (pid,)).fetchone()
                    product_cache[cache_key] = prod['name'] if prod else "Unknown Product"
                except sqlite3.OperationalError:
                    product_cache[cache_key] = "Error: Table Missing"
            
            order_dict['product_name'] = product_cache[cache_key]
            result.append(order_dict)
            
        return jsonify(result)
    except Exception as e:
        app.logger.error(f"Error in get_orders: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/orders', methods=['POST'])
def add_order():
    valid_tables = ['woman_PREMIUM', 'women_casual', 'man_PREMIUM', 'men_casual', 'kid_PREMIUM', 'kid_casual']
    conn = None
    try:
        data = request.json
        customer_name = data.get('customer_name')
        phone = data.get('phone')
        address = data.get('address')
        product_category = data.get('product_category')
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        total_price = data.get('total_price', 0)

        if not all([customer_name, phone, address, product_category, product_id]):
            return jsonify({"error": "Missing required fields"}), 400
            
        if product_category not in valid_tables:
            return jsonify({"error": f"Invalid product category: {product_category}"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO orders (customer_name, phone, address, product_category, product_id, quantity, total_price)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (customer_name, phone, address, product_category, product_id, quantity, total_price))
        conn.commit()
        new_id = cursor.lastrowid
        return jsonify({"id": new_id, "message": "Order created successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    valid_tables = ['woman_PREMIUM', 'women_casual', 'man_PREMIUM', 'men_casual', 'kid_PREMIUM', 'kid_casual']
    inventory = []
    conn = None
    try:
        conn = get_db_connection()
        for table in valid_tables:
            products = conn.execute(f'SELECT id, name, stock_quantity FROM {table}').fetchall()
            for p in products:
                item = dict(p)
                item['product_id'] = item['id']
                item['table'] = table
                item['min_stock_level'] = 5
                inventory.append(item)
        return jsonify(inventory)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/stats/trends', methods=['GET'])
def get_stats_trends():
    conn = None
    try:
        conn = get_db_connection()
        # Revenue and Orders Trends (Last 30 days)
        # Using RECURSIVE CTE for SQLite to handle missing dates
        days_query = """
        WITH RECURSIVE dates(date) AS (
            SELECT date('now', '-29 days')
            UNION ALL
            SELECT date(date, '+1 day') FROM dates WHERE date < date('now')
        )
        SELECT 
            d.date,
            COALESCE(SUM(o.total_price), 0) as revenue,
            COALESCE(COUNT(o.id), 0) as orders
        FROM dates d
        LEFT JOIN orders o ON date(o.created_at) = d.date
        GROUP BY d.date
        ORDER BY d.date ASC
        """
        trends = conn.execute(days_query).fetchall()
        
        revenue_data = [row['revenue'] for row in trends]
        orders_data = [row['orders'] for row in trends]
        
        # Stock Trend across all category tables
        valid_tables = ['man_PREMIUM', 'woman_PREMIUM', 'kid_PREMIUM', 'men_casual', 'women_casual', 'kid_casual']
        stock_values = []
        for table in valid_tables:
            try:
                table_stock = conn.execute(f"SELECT stock_quantity FROM {table}").fetchall()
                stock_values.extend([s['stock_quantity'] for s in table_stock])
            except:
                pass
        
        # Limit to last 30 for consistency, and reverse to show distribution
        stock_data = stock_values[:30]
        stock_data.reverse()
        
        return jsonify({
            "revenue": revenue_data,
            "orders": orders_data,
            "stock": stock_data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

# --- Employee Routes ---

@app.route('/api/employees', methods=['GET'])
def get_employees():
    conn = None
    try:
        conn = get_db_connection()
        employees = conn.execute('SELECT * FROM employees ORDER BY id DESC').fetchall()
        return jsonify([dict(e) for e in employees])
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/employees', methods=['POST'])
def add_employee():
    conn = None
    try:
        data = request.json
        name = data.get('name')
        salary = data.get('salary', 0)
        working_hours = data.get('working_hours', 0)
        shift = data.get('shift', 'Morning')
        image_data = data.get('image_data')

        if not name:
            return jsonify({"error": "Name is required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO employees (name, salary, working_hours, shift, image_data)
            VALUES (?, ?, ?, ?, ?)
        ''', (name, salary, working_hours, shift, image_data))
        conn.commit()
        return jsonify({"id": cursor.lastrowid, "message": "Employee added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/employees/<int:employee_id>', methods=['PUT'])
def update_employee(employee_id):
    conn = None
    try:
        data = request.json
        name = data.get('name')
        salary = data.get('salary')
        working_hours = data.get('working_hours')
        shift = data.get('shift')
        image_data = data.get('image_data')

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE employees SET name=?, salary=?, working_hours=?, shift=?, image_data=?
            WHERE id=?
        ''', (name, salary, working_hours, shift, image_data, employee_id))
        conn.commit()
        return jsonify({"message": "Employee updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/employees/<int:employee_id>', methods=['DELETE'])
def delete_employee(employee_id):
    conn = None
    try:
        conn = get_db_connection()
        conn.execute('DELETE FROM employees WHERE id=?', (employee_id,))
        conn.commit()
        return jsonify({"message": "Employee deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

# --- Frontend Serving ---

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001, debug=False, threaded=True)
