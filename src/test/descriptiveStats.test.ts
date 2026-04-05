import { describe, it, expect } from 'vitest';
import { computeDescriptiveStats } from '../utils/descriptiveStats';

describe('computeDescriptiveStats', () => {
  it('returns null for empty array', () => {
    expect(computeDescriptiveStats([])).toBeNull();
  });

  it('computes correct stats for known dataset', () => {
    const data = [2, 4, 6, 8, 10];
    const result = computeDescriptiveStats(data);
    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.n).toBe(5);
    expect(result.mean).toBeCloseTo(6, 4);
    expect(result.min).toBe(2);
    expect(result.max).toBe(10);
    expect(result.median).toBeCloseTo(6, 4);
  });

  it('calculates correct stdev for known values', () => {
    // Population: [1,2,3,4,5], mean=3, sample stdev = sqrt(2.5)
    const data = [1, 2, 3, 4, 5];
    const result = computeDescriptiveStats(data)!;
    expect(result.stdev).toBeCloseTo(Math.sqrt(2.5), 4);
  });

  it('filters NaN and Infinity', () => {
    const data = [1, NaN, 3, Infinity, 5, -Infinity];
    const result = computeDescriptiveStats(data)!;
    expect(result.n).toBe(3); // only 1, 3, 5
  });
});
