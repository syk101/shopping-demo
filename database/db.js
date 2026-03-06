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

function getImageUrl(name, category, id) {
  const n = name.toLowerCase();
  const c = category ? category.toLowerCase() : '';
  let keywords = 'fashion,apparel';
  if (c.includes('men_premium')) {
    if (n.includes('suit')) keywords = 'mens,tailored,suit';
    else if (n.includes('blazer')) keywords = 'mens,blazer,luxury';
    else if (n.includes('watch')) keywords = 'luxury,watch,mens';
    else if (n.includes('shoe') || n.includes('oxfords')) keywords = 'oxford,shoes,mens';
    else if (n.includes('coat')) keywords = 'mens,wool,coat';
    else if (n.includes('tie')) keywords = 'mens,silk,tie';
    else if (n.includes('tuxedo')) keywords = 'mens,tuxedo,formal';
    else if (n.includes('shirt')) keywords = 'mens,dress,shirt';
    else if (n.includes('cashmere') || n.includes('knitwear')) keywords = 'mens,cashmere,sweater';
    else if (n.includes('briefcase')) keywords = 'leather,briefcase,mens';
    else keywords = 'mens,premium,fashion';
  } else if (c.includes('men_casual')) {
    if (n.includes('t-shirt')) keywords = 'mens,tshirt,style';
    else if (n.includes('jeans')) keywords = 'mens,denim,jeans';
    else if (n.includes('sneakers')) keywords = 'mens,sneakers,urban';
    else if (n.includes('hoodie')) keywords = 'mens,hoodie,streetwear';
    else if (n.includes('polo')) keywords = 'mens,polo,shirt';
    else if (n.includes('cargo')) keywords = 'mens,cargo,pants';
    else if (n.includes('denim') || n.includes('jacket')) keywords = 'mens,denim,jacket';
    else if (n.includes('cap')) keywords = 'mens,baseball,cap';
    else if (n.includes('shorts')) keywords = 'mens,chino,shorts';
    else if (n.includes('flannel')) keywords = 'mens,flannel,shirt';
    else keywords = 'mens,casual,apparel';
  } else if (c.includes('women_premium')) {
    if (n.includes('gown') || n.includes('evening')) keywords = 'womens,evening,gown';
    else if (n.includes('cocktail') || n.includes('dress')) keywords = 'womens,luxury,dress';
    else if (n.includes('handbag')) keywords = 'luxury,handbag,womens';
    else if (n.includes('stilettos')) keywords = 'stilettos,high,heels';
    else if (n.includes('pearl') || n.includes('necklace')) keywords = 'jewelry,necklace,pearl';
    else if (n.includes('earring')) keywords = 'jewelry,diamond,earrings';
    else if (n.includes('blouse')) keywords = 'womens,silk,blouse';
    else if (n.includes('coat')) keywords = 'womens,cashmere,coat';
    else if (n.includes('blazer')) keywords = 'womens,velvet,blazer';
    else keywords = 'womens,couture,fashion';
  } else if (c.includes('women_casual')) {
    if (n.includes('sundress') || n.includes('floral')) keywords = 'womens,floral,dress';
    else if (n.includes('yoga') || n.includes('leggings')) keywords = 'womens,yoga,outfit';
    else if (n.includes('cardigan') || n.includes('knit')) keywords = 'womens,cardigan,style';
    else if (n.includes('loafers')) keywords = 'womens,loafers,casual';
    else if (n.includes('crossbody') || n.includes('vegan')) keywords = 'womens,crossbody,bag';
    else if (n.includes('skirt')) keywords = 'womens,denim,skirt';
    else if (n.includes('sweater')) keywords = 'womens,cable,sweater';
    else if (n.includes('canvas') || n.includes('shoes')) keywords = 'womens,canvas,shoes';
    else if (n.includes('linen') || n.includes('pants')) keywords = 'womens,linen,pants';
    else if (n.includes('tee')) keywords = 'womens,casual,top';
    else keywords = 'womens,casual,wear';
  } else if (c.includes('kids_premium')) {
    if (n.includes('vest')) keywords = 'kids,formal,vest';
    else if (n.includes('dress') || n.includes('gown') || n.includes('party')) keywords = 'kids,party,dress';
    else if (n.includes('blazer')) keywords = 'kids,formal,blazer';
    else if (n.includes('loafers')) keywords = 'kids,formal,shoes';
    else if (n.includes('suit')) keywords = 'kids,formal,suit';
    else if (n.includes('embroidered')) keywords = 'kids,elegant,gown';
    else if (n.includes('jacket') || n.includes('quilted')) keywords = 'kids,premium,jacket';
    else if (n.includes('bowtie')) keywords = 'kids,formal,bowtie';
    else if (n.includes('satin') || n.includes('ribbon')) keywords = 'kids,satin,dress';
    else if (n.includes('booties') || n.includes('baby')) keywords = 'kids,baby,shoes';
    else keywords = 'kids,elegant,clothing';
  } else if (c.includes('kids_casual')) {
    if (n.includes('graphic') || n.includes('tee')) keywords = 'kids,graphic,tee';
    else if (n.includes('sweatpants')) keywords = 'kids,sweatpants,casual';
    else if (n.includes('sneakers')) keywords = 'kids,sneakers,running';
    else if (n.includes('pajama')) keywords = 'kids,pajama,set';
    else if (n.includes('windbreaker')) keywords = 'kids,windbreaker,jacket';
    else if (n.includes('denim') || n.includes('overalls')) keywords = 'kids,denim,overalls';
    else if (n.includes('rain') || n.includes('boots')) keywords = 'kids,rain,boots';
    else if (n.includes('beanie')) keywords = 'kids,knit,beanie';
    else if (n.includes('shorts')) keywords = 'kids,shorts,elastic';
    else if (n.includes('fleece') || n.includes('zip')) keywords = 'kids,fleece,jacket';
    else keywords = 'kids,clothing,casual';
  }
  return `https://loremflickr.com/400/600/${keywords}?lock=${id + 100}`;
}

const SEED_PRODUCTS = [
  // Men Premium (20)
  ['Men Premium Tailored Suit 1', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'men_PREMIUM', 140.61, 21, 3.8, 0, 0, 387, 0.42],
  ['Men Premium Silk Blazer 2', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'men_PREMIUM', 188.94, 8, 4.6, 20, 0, 288, 0.38],
  ['Men Premium Classic Tuxedo 3', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'men_PREMIUM', 110.08, 65, 4.6, 20, 0, 413, 0.09],
  ['Men Premium Luxury Watch 4', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'men_PREMIUM', 199.48, 90, 3.9, 0, 1, 131, 0.01],
  ['Men Premium Handmade Oxfords 5', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'men_PREMIUM', 144.66, 48, 4.1, 20, 0, 329, 0.36],
  ['Men Premium Leather Briefcase 6', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'men_PREMIUM', 120.88, 44, 4.2, 10, 0, 278, 0.83],
  ['Men Premium Silk Tie Set 7', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'men_PREMIUM', 136.49, 126, 3.7, 20, 0, 391, 0.59],
  ['Men Premium Cashmere Knitwear 8', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'men_PREMIUM', 105.43, 55, 4.0, 20, 1, 303, 0.85],
  ['Men Premium Premium Wool Coat 9', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'men_PREMIUM', 125.59, 89, 4.6, 20, 0, 269, 0.28],
  ['Men Premium Designer Dress Shirt 10', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'men_PREMIUM', 146.53, 40, 4.9, 5, 1, 192, 0.54],
  ['Men Premium Tailored Suit 11', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'men_PREMIUM', 188.81, 20, 4.7, 15, 0, 486, 0.41],
  ['Men Premium Silk Blazer 12', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'men_PREMIUM', 158.30, 70, 4.1, 5, 1, 292, 0.73],
  ['Men Premium Classic Tuxedo 13', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'men_PREMIUM', 178.31, 120, 4.4, 0, 1, 323, 0.25],
  ['Men Premium Luxury Watch 14', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'men_PREMIUM', 192.31, 70, 3.6, 5, 0, 258, 0.76],
  ['Men Premium Handmade Oxfords 15', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'men_PREMIUM', 153.02, 66, 4.5, 5, 0, 377, 0.49],
  ['Men Premium Leather Briefcase 16', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'men_PREMIUM', 177.20, 126, 4.8, 20, 0, 128, 0.49],
  ['Men Premium Silk Tie Set 17', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'men_PREMIUM', 189.48, 103, 3.6, 15, 1, 153, 0.66],
  ['Men Premium Cashmere Knitwear 18', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'men_PREMIUM', 180.03, 111, 4.7, 10, 0, 428, 0.95],
  ['Men Premium Premium Wool Coat 19', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'men_PREMIUM', 166.04, 81, 3.8, 15, 0, 78, 1.00],
  ['Men Premium Designer Dress Shirt 20', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'men_PREMIUM', 149.40, 26, 4.4, 10, 0, 112, 0.55],
  // Women Premium (20)
  ['Women Premium Evening Gala Gown 1', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'women_PREMIUM', 165.48, 54, 4.5, 5, 0, 107, 0.69],
  ['Women Premium Designer Cocktail Dress 2', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'women_PREMIUM', 172.86, 21, 4.5, 10, 0, 416, 0.79],
  ['Women Premium Luxury Leather Handbag 3', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'women_PREMIUM', 124.93, 10, 4.0, 20, 0, 258, 0.83],
  ['Women Premium Signature Stilettos 4', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'women_PREMIUM', 140.47, 90, 3.8, 15, 1, 291, 0.10],
  ['Women Premium Fine Pearl Necklace 5', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'women_PREMIUM', 118.20, 14, 3.9, 20, 0, 17, 0.02],
  ['Women Premium Italian Silk Blouse 6', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'women_PREMIUM', 185.62, 124, 4.9, 5, 0, 46, 0.21],
  ['Women Premium Cashmere Wrap Coat 7', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'women_PREMIUM', 105.67, 50, 4.4, 0, 0, 121, 0.11],
  ['Women Premium Diamond Stud Earrings 8', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'women_PREMIUM', 175.59, 63, 3.6, 15, 0, 389, 0.26],
  ['Women Premium Lace Overlay Dress 9', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'women_PREMIUM', 168.85, 32, 3.6, 20, 1, 241, 0.70],
  ['Women Premium Velvet Evening Blazer 10', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'women_PREMIUM', 159.69, 106, 4.7, 20, 0, 176, 0.84],
  ['Women Premium Evening Gala Gown 11', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'women_PREMIUM', 172.31, 144, 4.7, 15, 0, 246, 0.87],
  ['Women Premium Designer Cocktail Dress 12', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'women_PREMIUM', 162.21, 38, 4.9, 15, 0, 81, 0.28],
  ['Women Premium Luxury Leather Handbag 13', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'women_PREMIUM', 187.59, 40, 4.8, 10, 0, 485, 0.20],
  ['Women Premium Signature Stilettos 14', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'women_PREMIUM', 196.07, 106, 4.1, 15, 1, 58, 0.05],
  ['Women Premium Fine Pearl Necklace 15', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'women_PREMIUM', 119.35, 126, 4.6, 15, 0, 424, 0.96],
  ['Women Premium Italian Silk Blouse 16', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'women_PREMIUM', 122.21, 24, 4.2, 5, 0, 18, 0.71],
  ['Women Premium Cashmere Wrap Coat 17', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'women_PREMIUM', 114.42, 132, 4.3, 5, 0, 14, 0.57],
  ['Women Premium Diamond Stud Earrings 18', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'women_PREMIUM', 151.26, 78, 4.6, 5, 0, 70, 0.86],
  ['Women Premium Lace Overlay Dress 19', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'women_PREMIUM', 171.34, 25, 4.8, 10, 0, 48, 0.29],
  ['Women Premium Velvet Evening Blazer 20', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'women_PREMIUM', 137.52, 98, 4.9, 15, 0, 178, 0.30],
  // Kids Premium (20)
  ['Kids Premium Mini Formal Vest 1', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'kids_PREMIUM', 113.83, 50, 4.4, 5, 1, 292, 0.26],
  ['Kids Premium Luxe Party Dress 2', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'kids_PREMIUM', 145.34, 147, 4.9, 5, 0, 33, 0.52],
  ['Kids Premium Junior Smart Blazer 3', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'kids_PREMIUM', 152.78, 119, 3.6, 15, 0, 38, 0.99],
  ['Kids Premium Patent Leather Loafers 4', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'kids_PREMIUM', 195.27, 55, 3.7, 15, 0, 292, 0.21],
  ['Kids Premium Holiday Occasion Suit 5', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'kids_PREMIUM', 104.04, 101, 4.0, 20, 0, 271, 0.53],
  ['Kids Premium Heirloom Embroidered Gown 6', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'kids_PREMIUM', 189.49, 112, 3.6, 5, 0, 88, 0.92],
  ['Kids Premium Premium Quilted Jacket 7', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'kids_PREMIUM', 162.84, 113, 4.4, 20, 0, 174, 0.58],
  ['Kids Premium Velvet Bowtie Set 8', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'kids_PREMIUM', 110.66, 94, 4.9, 10, 1, 225, 0.19],
  ['Kids Premium Satin Ribbon Dress 9', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'kids_PREMIUM', 188.85, 49, 4.7, 0, 0, 199, 0.87],
  ['Kids Premium Designer Baby Booties 10', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'kids_PREMIUM', 177.20, 112, 4.6, 15, 0, 388, 0.44],
  ['Kids Premium Mini Formal Vest 11', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'kids_PREMIUM', 190.22, 134, 4.8, 10, 0, 160, 0.54],
  ['Kids Premium Luxe Party Dress 12', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'kids_PREMIUM', 101.03, 90, 4.6, 10, 0, 169, 0.38],
  ['Kids Premium Junior Smart Blazer 13', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'kids_PREMIUM', 197.80, 99, 4.3, 0, 0, 246, 0.14],
  ['Kids Premium Patent Leather Loafers 14', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'kids_PREMIUM', 141.01, 74, 4.6, 5, 0, 314, 0.94],
  ['Kids Premium Holiday Occasion Suit 15', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'kids_PREMIUM', 132.58, 68, 4.7, 20, 0, 99, 0.20],
  ['Kids Premium Heirloom Embroidered Gown 16', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'kids_PREMIUM', 117.61, 56, 4.6, 15, 1, 324, 0.55],
  ['Kids Premium Premium Quilted Jacket 17', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'kids_PREMIUM', 151.78, 28, 4.0, 0, 0, 178, 0.39],
  ['Kids Premium Velvet Bowtie Set 18', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'kids_PREMIUM', 182.04, 18, 3.8, 10, 0, 285, 0.47],
  ['Kids Premium Satin Ribbon Dress 19', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'kids_PREMIUM', 186.84, 5, 4.2, 5, 0, 110, 0.87],
  ['Kids Premium Designer Baby Booties 20', 'Exquisite craftsmanship meets timeless elegance for the discerning individual.', 'kids_PREMIUM', 128.44, 65, 4.1, 15, 0, 267, 0.24],
  // Men Casual (20)
  ['Men Casual Essential Cotton T-Shirt 1', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'men_CASUAL', 78.17, 48, 4.4, 10, 0, 246, 0.94],
  ['Men Casual Slim-Fit Indigo Jeans 2', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'men_CASUAL', 24.35, 38, 4.0, 0, 0, 56, 0.14],
  ['Men Casual Urban Everyday Sneakers 3', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'men_CASUAL', 56.89, 131, 4.7, 15, 0, 207, 0.40],
  ['Men Casual Over-sized Fleece Hoodie 4', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'men_CASUAL', 68.90, 82, 3.7, 0, 0, 302, 0.85],
  ['Men Casual Classic Piqué Polo 5', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'men_CASUAL', 82.59, 45, 4.6, 10, 0, 163, 0.58],
  ['Men Casual Rugged Cargo Pants 6', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'men_CASUAL', 49.37, 69, 4.3, 10, 0, 306, 0.22],
  ['Men Casual Vintage Denim Jacket 7', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'men_CASUAL', 73.12, 33, 4.0, 20, 0, 102, 0.10],
  ['Men Casual Premium Baseball Cap 8', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'men_CASUAL', 21.97, 68, 4.2, 5, 0, 173, 0.15],
  ['Men Casual Chino Walk Shorts 9', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'men_CASUAL', 44.50, 34, 4.6, 5, 0, 118, 0.03],
  ['Men Casual Brushed Flannel Shirt 10', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'men_CASUAL', 44.77, 56, 4.8, 5, 0, 18, 0.70],
  ['Men Casual Essential Cotton T-Shirt 11', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'men_CASUAL', 78.92, 106, 3.5, 15, 1, 490, 0.69],
  ['Men Casual Slim-Fit Indigo Jeans 12', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'men_CASUAL', 77.54, 111, 3.9, 10, 0, 320, 0.21],
  ['Men Casual Urban Everyday Sneakers 13', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'men_CASUAL', 39.51, 69, 4.0, 10, 0, 152, 0.96],
  ['Men Casual Over-sized Fleece Hoodie 14', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'men_CASUAL', 50.47, 43, 4.8, 10, 0, 247, 0.03],
  ['Men Casual Classic Piqué Polo 15', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'men_CASUAL', 31.03, 61, 4.4, 15, 0, 278, 0.36],
  ['Men Casual Rugged Cargo Pants 16', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'men_CASUAL', 41.40, 50, 4.5, 0, 0, 245, 0.63],
  ['Men Casual Vintage Denim Jacket 17', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'men_CASUAL', 39.77, 17, 4.1, 10, 0, 289, 0.91],
  ['Men Casual Premium Baseball Cap 18', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'men_CASUAL', 56.33, 16, 4.7, 20, 0, 268, 0.54],
  ['Men Casual Chino Walk Shorts 19', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'men_CASUAL', 98.46, 20, 3.9, 5, 0, 447, 0.63],
  ['Men Casual Brushed Flannel Shirt 20', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'men_CASUAL', 88.66, 11, 5.0, 10, 0, 24, 0.91],
  // Women Casual (20)
  ['Women Casual Floral Garden Sundress 1', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'women_CASUAL', 66.83, 150, 4.0, 15, 1, 299, 0.64],
  ['Women Casual High-Rise Yoga Leggings 2', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'women_CASUAL', 92.67, 140, 4.7, 15, 0, 246, 0.12],
  ['Women Casual Soft Knit Cardigan 3', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'women_CASUAL', 96.09, 33, 4.9, 20, 0, 65, 0.80],
  ['Women Casual Comfort Leather Loafers 4', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'women_CASUAL', 43.64, 92, 4.3, 10, 1, 422, 0.83],
  ['Women Casual Vegan Leather Crossbody 5', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'women_CASUAL', 60.16, 26, 4.6, 15, 1, 306, 0.33],
  ['Women Casual A-Line Denim Skirt 6', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'women_CASUAL', 30.96, 118, 4.5, 20, 0, 73, 0.27],
  ['Women Casual Oversized Cable Sweater 7', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'women_CASUAL', 95.05, 72, 4.2, 0, 0, 269, 0.52],
  ['Women Casual Lightweight Canvas Shoes 8', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'women_CASUAL', 83.21, 129, 3.5, 0, 0, 116, 0.27],
  ['Women Casual Breathable Linen Pants 9', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'women_CASUAL', 33.66, 135, 4.2, 10, 0, 17, 0.08],
  ['Women Casual Micro-Ribbed Basic Tee 10', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'women_CASUAL', 39.13, 124, 4.3, 20, 0, 4, 0.63],
  ['Women Casual Floral Garden Sundress 11', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'women_CASUAL', 26.73, 60, 4.1, 0, 0, 327, 0.48],
  ['Women Casual High-Rise Yoga Leggings 12', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'women_CASUAL', 59.20, 20, 4.1, 20, 0, 42, 0.87],
  ['Women Casual Soft Knit Cardigan 13', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'women_CASUAL', 90.40, 24, 3.5, 15, 0, 406, 0.37],
  ['Women Casual Comfort Leather Loafers 14', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'women_CASUAL', 87.40, 10, 4.0, 15, 0, 317, 0.91],
  ['Women Casual Vegan Leather Crossbody 15', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'women_CASUAL', 23.45, 114, 4.4, 15, 0, 401, 0.11],
  ['Women Casual A-Line Denim Skirt 16', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'women_CASUAL', 96.15, 44, 4.2, 5, 0, 387, 0.49],
  ['Women Casual Oversized Cable Sweater 17', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'women_CASUAL', 82.05, 56, 3.7, 0, 0, 130, 0.50],
  ['Women Casual Lightweight Canvas Shoes 18', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'women_CASUAL', 71.88, 124, 4.0, 0, 0, 81, 0.54],
  ['Women Casual Breathable Linen Pants 19', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'women_CASUAL', 78.60, 25, 3.7, 15, 0, 153, 0.34],
  ['Women Casual Micro-Ribbed Basic Tee 20', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'women_CASUAL', 70.48, 30, 4.2, 5, 0, 139, 0.29],
  // Kids Casual (20)
  ['Kids Casual Playful Graphic Tee 1', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'kids_CASUAL', 69.49, 34, 5.0, 10, 0, 88, 0.43],
  ['Kids Casual Comfy Cotton Sweatpants 2', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'kids_CASUAL', 43.41, 23, 4.4, 15, 0, 238, 0.01],
  ['Kids Casual Active Running Sneakers 3', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'kids_CASUAL', 30.66, 74, 3.7, 15, 0, 442, 0.40],
  ['Kids Casual Soft Pajama Set 4', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'kids_CASUAL', 29.80, 90, 3.7, 15, 0, 195, 0.94],
  ['Kids Casual Water-Resistant Windbreaker 5', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'kids_CASUAL', 61.24, 12, 4.9, 20, 0, 247, 0.34],
  ['Kids Casual Classic Denim Overalls 6', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'kids_CASUAL', 67.17, 6, 4.2, 15, 0, 277, 0.10],
  ['Kids Casual Bright Rubber Rain Boots 7', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'kids_CASUAL', 96.94, 11, 4.0, 15, 0, 479, 0.50],
  ['Kids Casual Cozy Knit Beanie 8', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'kids_CASUAL', 82.48, 93, 4.2, 0, 0, 466, 0.87],
  ['Kids Casual Elastic Waist Shorts 9', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'kids_CASUAL', 58.87, 149, 3.5, 5, 1, 423, 0.55],
  ['Kids Casual Full-Zip Fleece Jacket 10', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'kids_CASUAL', 78.48, 25, 4.8, 5, 0, 387, 0.02],
  ['Kids Casual Playful Graphic Tee 11', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'kids_CASUAL', 67.55, 118, 3.9, 0, 1, 484, 0.33],
  ['Kids Casual Comfy Cotton Sweatpants 12', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'kids_CASUAL', 75.91, 98, 3.6, 0, 0, 190, 0.86],
  ['Kids Casual Active Running Sneakers 13', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'kids_CASUAL', 23.71, 66, 4.5, 10, 0, 388, 0.75],
  ['Kids Casual Soft Pajama Set 14', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'kids_CASUAL', 31.06, 102, 4.1, 20, 0, 148, 0.43],
  ['Kids Casual Water-Resistant Windbreaker 15', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'kids_CASUAL', 95.28, 49, 4.6, 10, 1, 409, 0.73],
  ['Kids Casual Classic Denim Overalls 16', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'kids_CASUAL', 60.74, 16, 4.3, 10, 0, 336, 0.17],
  ['Kids Casual Bright Rubber Rain Boots 17', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'kids_CASUAL', 26.41, 125, 3.5, 10, 0, 116, 0.29],
  ['Kids Casual Cozy Knit Beanie 18', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'kids_CASUAL', 53.61, 107, 4.0, 0, 0, 25, 0.57],
  ['Kids Casual Elastic Waist Shorts 19', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'kids_CASUAL', 30.72, 60, 4.0, 20, 0, 181, 0.98],
  ['Kids Casual Full-Zip Fleece Jacket 20', 'Versatile, high-quality piece designed for ultimate comfort and daily style.', 'kids_CASUAL', 78.15, 122, 4.8, 0, 1, 256, 0.85],
];

function seedProducts(callback) {
  db.get('SELECT COUNT(*) as count FROM products', [], (err, row) => {
    if (err) {
      console.error('Error checking products count:', err.message);
      if (callback) callback();
      return;
    }
    if (row.count > 0) {
      console.log(`Products table already has ${row.count} rows, skipping seed.`);
      if (callback) callback();
      return;
    }

    console.log('Seeding products with real image URLs...');
    const stmt = db.prepare(
      'INSERT INTO products (name, description, category, price, stock, rating, discount, is_featured, sales_count, ai_score, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    let id = 1;
    SEED_PRODUCTS.forEach(([name, description, category, price, stock, rating, discount, is_featured, sales_count, ai_score]) => {
      const imageUrl = getImageUrl(name, category, id);
      stmt.run(name, description, category, price, stock, rating, discount, is_featured, sales_count, ai_score, imageUrl);
      id++;
    });

    stmt.finalize(() => {
      console.log(`Seeded ${SEED_PRODUCTS.length} products with working image URLs.`);
      if (callback) callback();
    });
  });
}

function initDb() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  db.exec(schema, (err) => {
    if (err) {
      console.error('Error initializing database schema', err.message);
    } else {
      console.log('Database schema initialized.');
      seedProducts();
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
