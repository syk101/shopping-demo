const { SearchContext, TextSearchStrategy, AISearchStrategy } = require('../src/strategies/searchStrategies');

describe('Search Strategies', () => {
    describe('TextSearchStrategy', () => {
        const strategy = new TextSearchStrategy();
        const data = [
            { name: 'Classic Suit', description: 'Premium business wear' },
            { name: 'Casual Jeans', description: 'Denim for everyday' }
        ];

        test('should filter products by name', () => {
            const result = strategy.execute('suit', data);
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Classic Suit');
        });

        test('should filter products by description', () => {
            const result = strategy.execute('denim', data);
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Casual Jeans');
        });

        test('should return all products if query is empty', () => {
            const result = strategy.execute('', data);
            expect(result).toHaveLength(2);
        });
    });

    describe('AISearchStrategy', () => {
        const strategy = new AISearchStrategy();
        const data = [
            { id: 1, name: 'A', vector: JSON.stringify([1, 0, 0]) },
            { id: 2, name: 'B', vector: JSON.stringify([0, 1, 0]) },
            { id: 3, name: 'C', vector: null }
        ];

        test('should sort products by similarity', () => {
            const queryVector = [1, 0.1, 0];
            const result = strategy.execute(queryVector, data);
            expect(result[0].id).toBe(1);
            expect(result[0].similarity).toBeGreaterThan(0.9);
            expect(result[1].id).toBe(2);
        });

        test('should handle missing vectors', () => {
            const result = strategy.execute([1, 1, 1], data);
            const itemC = result.find(p => p.id === 3);
            expect(itemC.similarity).toBe(0);
        });
    });

    describe('SearchContext', () => {
        test('should switch between strategies', async () => {
            const context = new SearchContext();
            const data = [{ name: 'Test' }];
            
            context.setStrategy(new TextSearchStrategy());
            const textResult = await context.search('test', data);
            expect(textResult).toHaveLength(1);

            context.setStrategy(new AISearchStrategy());
            const aiResult = await context.search([1], [{ vector: [1] }]);
            expect(aiResult).toHaveLength(1);
        });

        test('should throw error if no strategy set', async () => {
            const context = new SearchContext();
            await expect(context.search('q', [])).rejects.toThrow("Search strategy not set");
        });
    });
});
