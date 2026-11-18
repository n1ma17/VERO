import { generateTemporaryPassword } from './temporary-password.js';

describe('generateTemporaryPassword', () => {
  it('returns 12 characters from the safe alphabet', () => {
    const password = generateTemporaryPassword();
    expect(password).toHaveLength(12);
    expect(password).toMatch(/^[A-HJ-NP-Za-km-z2-9]+$/);
  });

  it('does not repeat the same value twice in a row', () => {
    const first = generateTemporaryPassword();
    const second = generateTemporaryPassword();
    expect(first).not.toBe(second);
  });
});
