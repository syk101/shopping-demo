const sqlite3 = require('sqlite3').verbose();
const path = require('path');

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
        this.model = "sentence-transformers/clip-ViT-B-32";
        AIService.instance = this;
    }
}

module.exports = { 
    db: new Database(), 
    ai: new AIService() 
};
