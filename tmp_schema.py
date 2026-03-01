import sqlite3
import pprint

def check():
    conn = sqlite3.connect('database/shop_admin.db')
    cursor = conn.cursor()
    cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='orders'")
    sql = cursor.fetchone()[0]
    with open('tmp_schema_out.txt', 'w') as f:
        f.write(sql)

check()
