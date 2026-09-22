import { describe, it, expect } from 'vitest';
import { nextDelayMs, hashPin } from '../auth.js';

describe('пауза после неверных попыток', () => {
  it('даёт три попытки без паузы', () => {
    expect(nextDelayMs(0)).toBe(0);
    expect(nextDelayMs(1)).toBe(0);
    expect(nextDelayMs(2)).toBe(0);
  });

  it('после трёх неверных вводов включает паузу', () => {
    expect(nextDelayMs(3)).toBe(30000);
    expect(nextDelayMs(7)).toBe(30000);
  });
});

describe('хеш PIN', () => {
  it('для одного и того же PIN всегда даёт одинаковый хеш', async () => {
    const a = await hashPin('1234');
    const b = await hashPin('1234');
    expect(a).toBe(b);
  });

  it('для разных PIN даёт разные хеши', async () => {
    const a = await hashPin('1234');
    const b = await hashPin('4321');
    expect(a).not.toBe(b);
  });

  it('не хранит PIN в открытом виде', async () => {
    const hash = await hashPin('1234');
    expect(hash).not.toContain('1234');
  });
});
