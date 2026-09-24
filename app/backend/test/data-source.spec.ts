describe('CLI data source', () => {
  it('keeps synchronize off', async () => {
    process.env.NODE_ENV = 'test';
    process.env.PGHOST = 'localhost';
    process.env.PGPORT = '5432';
    process.env.PGUSER = 'bar';
    process.env.PGPASSWORD = 'bar';
    process.env.PGDATABASE = 'bar';

    const { AppDataSource } =
      await import('../src/providers/orm/data-source.js');
    expect(AppDataSource.options.synchronize).toBe(false);
  });
});
