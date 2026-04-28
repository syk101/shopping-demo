import random
random.seed(42)

categories = [
    ('men_PREMIUM', 'Men Premium', 100, 200),
    ('women_PREMIUM', 'Women Premium', 100, 200),
    ('kids_PREMIUM', 'Kids Premium', 100, 200),
    ('men_CASUAL', 'Men Casual', 20, 99),
    ('women_CASUAL', 'Women Casual', 20, 99),
    ('kids_CASUAL', 'Kids Casual', 20, 99)
]

items = {
    'men_PREMIUM': ['Tailored Suit', 'Silk Blazer', 'Classic Tuxedo', 'Luxury Watch', 'Handmade Oxfords', 'Leather Briefcase', 'Silk Tie Set', 'Cashmere Knitwear', 'Premium Wool Coat', 'Designer Dress Shirt'],
    'women_PREMIUM': ['Evening Gala Gown', 'Designer Cocktail Dress', 'Luxury Leather Handbag', 'Signature Stilettos', 'Fine Pearl Necklace', 'Italian Silk Blouse', 'Cashmere Wrap Coat', 'Diamond Stud Earrings', 'Lace Overlay Dress', 'Velvet Evening Blazer'],
    'kids_PREMIUM': ['Mini Formal Vest', 'Luxe Party Dress', 'Junior Smart Blazer', 'Patent Leather Loafers', 'Holiday Occasion Suit', 'Heirloom Embroidered Gown', 'Premium Quilted Jacket', 'Velvet Bowtie Set', 'Satin Ribbon Dress', 'Designer Baby Booties'],
    'men_CASUAL': ['Essential Cotton T-Shirt', 'Slim-Fit Indigo Jeans', 'Urban Everyday Sneakers', 'Over-sized Fleece Hoodie', 'Classic Piqué Polo', 'Rugged Cargo Pants', 'Vintage Denim Jacket', 'Premium Baseball Cap', 'Chino Walk Shorts', 'Brushed Flannel Shirt'],
    'women_CASUAL': ['Floral Garden Sundress', 'High-Rise Yoga Leggings', 'Soft Knit Cardigan', 'Comfort Leather Loafers', 'Vegan Leather Crossbody', 'A-Line Denim Skirt', 'Oversized Cable Sweater', 'Lightweight Canvas Shoes', 'Breathable Linen Pants', 'Micro-Ribbed Basic Tee'],
    'kids_CASUAL': ['Playful Graphic Tee', 'Comfy Cotton Sweatpants', 'Active Running Sneakers', 'Soft Pajama Set', 'Water-Resistant Windbreaker', 'Classic Denim Overalls', 'Bright Rubber Rain Boots', 'Cozy Knit Beanie', 'Elastic Waist Shorts', 'Full-Zip Fleece Jacket']
}

descriptions = {
    'PREMIUM': 'Exquisite craftsmanship meets timeless elegance for the discerning individual.',
    'CASUAL': 'Versatile, high-quality piece designed for ultimate comfort and daily style.'
}

sql = []
sql.append('CREATE TABLE products (')
sql.append('    id INTEGER PRIMARY KEY AUTOINCREMENT,')
sql.append('    name TEXT NOT NULL,')
sql.append('    description TEXT,')
sql.append('    image TEXT,')
sql.append('    category TEXT NOT NULL,')
sql.append('    price REAL NOT NULL,')
sql.append('    stock INTEGER NOT NULL,')
sql.append('    created DATE DEFAULT CURRENT_DATE')
sql.append(');')
sql.append('')

for cat_id, cat_name, min_p, max_p in categories:
    prefix = cat_id.split('_')[0].lower()
    type_suffix = cat_id.split('_')[1].lower()
    desc = descriptions[cat_id.split('_')[1]]
    
    for i in range(1, 21):
        item_base = items[cat_id][(i-1) % 10]
        name = f'{cat_name} {item_base} {i}'
        price = round(random.uniform(min_p, max_p), 2)
        stock = random.randint(0, 150)
        img = f'{prefix}_{type_suffix}{i}.jpg'
        
        name_esc = name.replace("'", "''")
        desc_esc = desc.replace("'", "''")
        
        sql.append(f"INSERT INTO products (name, description, image, category, price, stock) VALUES ('{name_esc}', '{desc_esc}', '{img}', '{cat_id}', {price}, {stock});")

print('\n'.join(sql))
