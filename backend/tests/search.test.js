const { TextSearchStrategy } = require('../src/strategies/searchStrategies');

describe('Search Strategies', () => {
    test('TextSearchStrategy should filter products by name', () => {
        const strategy = new TextSearchStrategy();
        const data = [{ name: 'Suit' }, { name: 'Jeans' }];
        const result = strategy.execute('suit', data);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Suit');
    });
});
