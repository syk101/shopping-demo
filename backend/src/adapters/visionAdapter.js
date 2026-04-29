const fetch = require('node-fetch');

class VisionAdapter {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.apiUrl = `https://api-inference.huggingface.co/models/${config.model}`;
    }

    async getEmbedding(buffer) {
        if (!this.apiKey || this.apiKey === 'undefined') {
            console.warn("HF_API_KEY missing, using mock embedding.");
            return new Array(512).fill(0).map(() => Math.random());
        }
        try {
            const res = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.apiKey}` },
                body: buffer
            });
            if (!res.ok) throw new Error(`AI Fetch Failed: ${res.statusText}`);
            const json = await res.json();
            return Array.isArray(json[0]) ? json[0] : json;
        } catch (err) {
            console.error("AI Embedding failed, using fallback:", err);
            return new Array(512).fill(0).map(() => Math.random());
        }
    }

    async search(imageBase64, products) {
        const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const queryVector = await this.getEmbedding(buffer);
        
        return products.map(p => {
            // If product has no vector, return 0 similarity
            if (!p.vector) return { ...p, similarity: 0 };
            
            const pVector = typeof p.vector === 'string' ? JSON.parse(p.vector) : p.vector;
            const sim = this.cosineSimilarity(queryVector, pVector);
            return { ...p, similarity: sim };
        }).sort((a, b) => b.similarity - a.similarity).slice(0, 10);
    }

    cosineSimilarity(v1, v2) {
        let dot = 0, n1 = 0, n2 = 0;
        for (let i = 0; i < v1.length; i++) {
            dot += v1[i] * v2[i];
            n1 += v1[i] * v1[i];
            n2 += v2[i] * v2[i];
        }
        return dot / (Math.sqrt(n1) * Math.sqrt(n2));
    }
}

module.exports = VisionAdapter;
