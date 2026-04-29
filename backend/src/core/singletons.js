const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fetch = require('node-fetch');
const Jimp = require('jimp');

class Database {
    constructor() {
        if (Database.instance) return Database.instance;
        this.db = new sqlite3.Database(path.resolve(__dirname, '../../../database/shop.db'));
        Database.instance = this;
    }
    query(sql, params = []) {
        return new Promise((res, rej) => this.db.all(sql, params, (err, rows) => err ? rej(err) : res(rows)));
    }
    run(sql, params = []) {
        return new Promise((res, rej) => this.db.run(sql, params, function(err) { err ? rej(err) : res({ id: this.lastID, changes: this.changes }); }));
    }
}

class AIService {
    constructor() {
        if (AIService.instance) return AIService.instance;
        this.apiKey = process.env.HF_API_KEY;
        this.clipModel = "openai/clip-vit-base-patch32";
        this.segModel = "CIDAS/clipseg-rd64-refined";
        AIService.instance = this;
    }

    async fetchHF(model, buffer, params = {}) {
        const url = `https://api-inference.huggingface.co/models/${model}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.apiKey}` },
            body: buffer
        });
        if (!res.ok) throw new Error(`HF API Error: ${res.statusText}`);
        return await res.json();
    }

    async tryOn(avatarBase64, productImageUrl) {
        try {
            const avatarBuffer = Buffer.from(avatarBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
            const avatar = await Jimp.read(avatarBuffer);
            
            // 1. Stylization: Give it a "Vector/Graphic" look like Snapchat's Bitmoji
            avatar.posterize(8).contrast(0.15).brightness(0.05);

            // 2. Load Product
            const productPath = path.isAbsolute(productImageUrl) ? productImageUrl : path.join(__dirname, '../../../frontend/public', productImageUrl);
            let product;
            try {
                product = await Jimp.read(productPath);
            } catch (e) {
                product = await Jimp.read(productImageUrl);
            }

            // 3. Smart Scaling & Positioning
            const avatarWidth = avatar.getWidth();
            const avatarHeight = avatar.getHeight();
            product.resize(avatarWidth * 0.65, Jimp.AUTO);

            const x = (avatarWidth - product.getWidth()) / 2;
            const y = avatarHeight * 0.3; // Higher position for better fit

            // 4. Add subtle shadow for depth
            const shadow = product.clone().brightness(-1).blur(3).opacity(0.2);
            avatar.composite(shadow, x + 3, y + 3);
            
            avatar.composite(product, x, y, {
                mode: Jimp.BLEND_SOURCE_OVER,
                opacitySource: 1.0
            });

            // 5. Add "Snapchat" Branding Border
            const borderSize = Math.floor(avatarWidth * 0.015);
            avatar.scan(0, 0, avatarWidth, avatarHeight, function(x, y, idx) {
                if (x < borderSize || x > avatarWidth - borderSize || y < borderSize || y > avatarHeight - borderSize) {
                    this.bitmap.data[idx] = 255; 
                    this.bitmap.data[idx+1] = 252; 
                    this.bitmap.data[idx+2] = 0;   
                }
            });

            const resultBase64 = await avatar.getBase64Async(Jimp.MIME_JPEG);
            return { image: resultBase64 };
        } catch (err) {
            console.error("AI Try-On Simulation failed:", err);
            return { image: avatarBase64 };
        }
    }
}

module.exports = { 
    db: new Database(), 
    ai: new AIService() 
};
