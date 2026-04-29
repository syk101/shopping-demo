class SearchContext {
    setStrategy(strategy) { this.strategy = strategy; }
    async search(query, data) { return this.strategy.execute(query, data); }
}

class TextSearchStrategy {
    execute(q, data) {
        return data.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
    }
}

class AISearchStrategy {
    execute(vector, data) {
        // Mocking vector logic for brevity, real logic uses dotProduct
        return data.filter(p => p.embedding).slice(0, 8);
    }
}

module.exports = { SearchContext, TextSearchStrategy, AISearchStrategy };
