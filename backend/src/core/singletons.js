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
            
            // In a real app, productImageUrl would be a relative path or URL
            // If it's relative, we need the full path
            const productPath = path.isAbsolute(productImageUrl) ? productImageUrl : path.join(__dirname, '../../../frontend/public', productImageUrl);
            const product = await Jimp.read(productPath);

            // Simple "AI" Simulation: Overlay product on avatar center-down
            product.resize(avatar.getWidth() * 0.5, Jimp.AUTO);
            const x = (avatar.getWidth() - product.getWidth()) / 2;
            const y = avatar.getHeight() * 0.35; // Position near chest area

            avatar.composite(product, x, y, {
                mode: Jimp.BLEND_SOURCE_OVER,
                opacitySource: 0.9
            });

            const resultBase64 = await avatar.getBase64Async(Jimp.MIME_JPEG);
            return { image: resultBase64 };
        } catch (err) {
            console.error("AI Try-On Simulation failed:", err);
            // Fallback: return the original avatar if product loading fails
            return { image: avatarBase64 };
        }
    }
}

module.exports = { 
    db: new Database(), 
    ai: new AIService() 
};
