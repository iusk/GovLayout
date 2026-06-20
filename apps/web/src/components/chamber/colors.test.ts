import { describe, expect, it } from 'vitest';
import { moneyColorKey } from './colors';

// Thresholds from the requirements: 0% -> green, < 25% -> yellow, >= 25% -> red.
describe('moneyColorKey', () => {
  it('maps 0% to green', () => {
    expect(moneyColorKey(0)).toBe('green');
  });

  it('maps 24% to yellow', () => {
    expect(moneyColorKey(24)).toBe('yellow');
  });

  it('maps exactly 25% to red', () => {
    expect(moneyColorKey(25)).toBe('red');
  });

  it('maps 60% to red', () => {
    expect(moneyColorKey(60)).toBe('red');
  });
});
