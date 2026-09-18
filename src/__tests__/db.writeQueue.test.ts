import { serializeWrite } from '@/data/db/writeQueue';

const tick = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('serializeWrite', () => {
  it('never runs two writes on the same database at once, and keeps call order', async () => {
    const db = {};
    let active = 0;
    let peak = 0;
    const order: number[] = [];
    // Simulates three sync pages landing together, each doing a slow transaction.
    const write = (id: number, ms: number) =>
      serializeWrite(db, async () => {
        active += 1;
        peak = Math.max(peak, active);
        await tick(ms);
        order.push(id);
        active -= 1;
        return id;
      });

    const results = await Promise.all([write(1, 20), write(2, 5), write(3, 1)]);
    expect(peak).toBe(1);
    expect(order).toEqual([1, 2, 3]);
    expect(results).toEqual([1, 2, 3]);
  });

  it('a failed write rejects its own caller but does not block later writes', async () => {
    const db = {};
    const failing = serializeWrite(db, () => Promise.reject(new Error('database is locked')));
    const next = serializeWrite(db, async () => 'ok');
    await expect(failing).rejects.toThrow('database is locked');
    await expect(next).resolves.toBe('ok');
  });

  it('different databases do not wait on each other', async () => {
    const a = {};
    const b = {};
    let bFinished = false;
    const slowA = serializeWrite(a, async () => {
      await tick(30);
      expect(bFinished).toBe(true);
    });
    await serializeWrite(b, async () => {
      bFinished = true;
    });
    await slowA;
  });
});
