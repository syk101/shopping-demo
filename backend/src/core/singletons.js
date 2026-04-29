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

    async tryOn(avatarBase64, productImageUrl, anchors = null) {
        try {
            const avatarBuffer = Buffer.from(avatarBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
            const avatar = await Jimp.read(avatarBuffer);
            
            // 1. Stylization: "Snapchat Filter" Look
            avatar.posterize(8).contrast(0.15).brightness(0.05);

            // 2. Load Default Formal Suit (Demo Experience)
            const defaultSuitPath = path.join(__dirname, '../../../frontend/public/assets/ai/formal-suit.png');
            const product = await Jimp.read(defaultSuitPath);

            // 3. Precision Alignment using MediaPipe Anchors
            const avatarWidth = avatar.getWidth();
            const avatarHeight = avatar.getHeight();
            
            let x, y, pWidth;

            if (anchors && anchors.center) {
                // Precise alignment from MediaPipe
                pWidth = anchors.width * avatarWidth;
                product.resize(pWidth, Jimp.AUTO);
                x = (anchors.center.x * avatarWidth) - (product.getWidth() / 2);
                y = (anchors.center.y * avatarHeight) - (product.getHeight() / 2);
            } else {
                // Fallback to center-torso
                product.resize(avatarWidth * 0.7, Jimp.AUTO);
                x = (avatarWidth - product.getWidth()) / 2;
                y = avatarHeight * 0.25; // Slightly higher for formal suit
            }

            // 4. Composition with AR depth
            const shadow = product.clone().brightness(-1).blur(5).opacity(0.15);
            avatar.composite(shadow, x + 4, y + 4);
            
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
