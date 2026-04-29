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
}

module.exports = { 
    db: new Database(), 
    ai: new AIService() 
};
