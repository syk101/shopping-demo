const fetch = require('node-fetch');

class VisionAdapter {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.apiUrl = `https://api-inference.huggingface.co/models/${config.model}`;
    }

    async getEmbedding(buffer) {
        const res = await fetch(this.apiUrl, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.apiKey}` },
            body: buffer
        });
        if (!res.ok) throw new Error("AI Fetch Failed");
        const json = await res.json();
        return Array.isArray(json[0]) ? json[0] : json;
    }
}

module.exports = VisionAdapter;
