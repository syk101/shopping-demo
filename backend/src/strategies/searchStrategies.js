class SearchContext {
    setStrategy(strategy) { this.strategy = strategy; }
    async search(query, data) { 
        if (!this.strategy) throw new Error("Search strategy not set");
        return this.strategy.execute(query, data); 
    }
}

class TextSearchStrategy {
    execute(q, data) {
        if (!q) return data;
        const query = q.toLowerCase();
        return data.filter(p => 
            p.name.toLowerCase().includes(query) || 
            (p.description && p.description.toLowerCase().includes(query))
        );
    }
}

class AISearchStrategy {
    execute(queryVector, data) {
        if (!queryVector || !Array.isArray(queryVector)) return [];
        
        return data.map(p => {
            const pVector = typeof p.vector === 'string' ? JSON.parse(p.vector) : p.vector;
            if (!pVector) return { ...p, similarity: 0 };
            
            const sim = this.cosineSimilarity(queryVector, pVector);
            return { ...p, similarity: sim };
        }).sort((a, b) => b.similarity - a.similarity).slice(0, 8);
    }

    cosineSimilarity(v1, v2) {
        let dot = 0, n1 = 0, n2 = 0;
        for (let i = 0; i < v1.length; i++) {
            dot += v1[i] * v2[i];
            n1 += v1[i] * v1[i];
            n2 += v2[i] * v2[i];
        }
        return dot / (Math.sqrt(n1) * Math.sqrt(n2)) || 0;
    }
}

module.exports = { SearchContext, TextSearchStrategy, AISearchStrategy };
