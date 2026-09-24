import { SnakeNamingStrategy } from './snake-naming.strategy.js';

describe('SnakeNamingStrategy', () => {
  const strategy = new SnakeNamingStrategy();

  it('snake-cases column and join column names', () => {
    expect(strategy.columnName('createdAt', '', [])).toBe('created_at');
    expect(strategy.joinColumnName('visit', 'id')).toBe('visit_id');
  });
});
