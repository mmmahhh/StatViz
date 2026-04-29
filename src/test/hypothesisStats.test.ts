import { describe, it, expect } from 'vitest';
import { calculateHypothesis } from '../utils/hypothesisStats';
import { RawDataRow } from '../types';

describe('calculateHypothesis', () => {
  it('should return null when less than 2 groups', () => {
    const data: RawDataRow[] = [
      { group: 'A', value: 10 },
      { group: 'A', value: 11 },
    ];
    const result = calculateHypothesis(data, 'group', 'value');
    expect(result).toBeNull();
  });

  it('should perform t-test for 2 groups', () => {
    // Group A: [10, 11, 10, 11] mean=10.5
    // Group B: [20, 21, 20, 21] mean=20.5
    // Should show significant difference
    const data: RawDataRow[] = [
      { group: 'A', value: 10 },
      { group: 'A', value: 11 },
      { group: 'A', value: 10 },
      { group: 'A', value: 11 },
      { group: 'B', value: 20 },
      { group: 'B', value: 21 },
      { group: 'B', value: 20 },
      { group: 'B', value: 21 },
    ];
    const result = calculateHypothesis(data, 'group', 'value');

    expect(result).not.toBeNull();
    if (result) {
      expect(result.method).toBe('t-Test');
      expect(result.statistic).not.toBeNull();
      expect(result.df).toBeGreaterThan(0);
      expect(result.pValue).toBeGreaterThan(0);
      expect(result.pValue).toBeLessThan(1);
      expect(result.significant).toBe(true); // These groups are clearly different
    }
  });

  it('should perform ANOVA for more than 2 groups', () => {
    const data: RawDataRow[] = [
      { group: 'A', value: 10 },
      { group: 'A', value: 11 },
      { group: 'B', value: 20 },
      { group: 'B', value: 21 },
      { group: 'C', value: 30 },
      { group: 'C', value: 31 },
    ];
    const result = calculateHypothesis(data, 'group', 'value');

    expect(result).not.toBeNull();
    if (result) {
      expect(result.method).toBe('ANOVA');
      expect(result.statistic).toBeGreaterThan(0);
      expect(typeof result.df).toBe('string'); // ANOVA df is "between, within"
      expect(result.pValue).toBeGreaterThan(0);
      expect(result.pValue).toBeLessThan(1);
    }
  });

  it('should return null when sample sizes are too small for t-test', () => {
    const data: RawDataRow[] = [
      { group: 'A', value: 10 },
      { group: 'B', value: 20 },
    ];
    const result = calculateHypothesis(data, 'group', 'value');
    expect(result).toBeNull();
  });

  it('should handle string values that parse to numbers', () => {
    const data: RawDataRow[] = [
      { group: 'A', value: '10' },
      { group: 'A', value: '11' },
      { group: 'B', value: '20' },
      { group: 'B', value: '21' },
    ];
    const result = calculateHypothesis(data, 'group', 'value');
    expect(result).not.toBeNull();
  });

  it('should ignore null/undefined/empty values', () => {
    const data: RawDataRow[] = [
      { group: 'A', value: 10 },
      { group: 'A', value: 11 },
      { group: 'A', value: null },
      { group: 'A', value: null },
      { group: 'A', value: '' },
      { group: 'B', value: 20 },
      { group: 'B', value: 21 },
      { group: 'B', value: null },
    ];
    const result = calculateHypothesis(data, 'group', 'value');
    expect(result).not.toBeNull();
  });

  it('should respect alpha parameter', () => {
    // Two groups with small but detectable difference
    // mean A = 10, mean B = 12, stdev ~1
    const data: RawDataRow[] = [
      { group: 'A', value: 9 },
      { group: 'A', value: 10 },
      { group: 'A', value: 11 },
      { group: 'A', value: 10 },
      { group: 'A', value: 10 },
      { group: 'B', value: 11 },
      { group: 'B', value: 12 },
      { group: 'B', value: 13 },
      { group: 'B', value: 12 },
      { group: 'B', value: 12 },
    ];
    const result = calculateHypothesis(data, 'group', 'value', 0.05);

    expect(result).not.toBeNull();
    if (result) {
      expect(result.alpha).toBe(0.05);
      // p-value should be between 0 and 1
      expect(result.pValue).toBeGreaterThan(0);
      expect(result.pValue).toBeLessThanOrEqual(1);
    }
  });

  it('should provide group statistics in result', () => {
    const data: RawDataRow[] = [
      { group: 'A', value: 10 },
      { group: 'A', value: 12 },
      { group: 'B', value: 20 },
      { group: 'B', value: 22 },
    ];
    const result = calculateHypothesis(data, 'group', 'value');

    expect(result).not.toBeNull();
    if (result) {
      expect(result.groupStats).toHaveLength(2);
      expect(result.groupStats[0].name).toBe('A');
      expect(result.groupStats[1].name).toBe('B');
      expect(result.groupStats[0].n).toBe(2);
      expect(result.groupStats[1].n).toBe(2);
    }
  });

  it('uses finite p-values for small-sample t-tests', () => {
    const data: RawDataRow[] = [
      { group: 'A', value: 1 },
      { group: 'A', value: 2 },
      { group: 'A', value: 3 },
      { group: 'B', value: 3 },
      { group: 'B', value: 4 },
      { group: 'B', value: 5 },
    ];
    const result = calculateHypothesis(data, 'group', 'value');

    expect(result).not.toBeNull();
    if (result) {
      expect(result.method).toBe('t-Test');
      expect(Number.isFinite(result.pValue)).toBe(true);
      expect(result.pValue).toBeGreaterThanOrEqual(0);
      expect(result.pValue).toBeLessThanOrEqual(1);
    }
  });

  it('reports Welch-Satterthwaite degrees of freedom for unequal variances', () => {
    const data: RawDataRow[] = [
      { group: 'A', value: 10 },
      { group: 'A', value: 10 },
      { group: 'A', value: 10 },
      { group: 'A', value: 10 },
      { group: 'B', value: 10 },
      { group: 'B', value: 20 },
      { group: 'B', value: 30 },
      { group: 'B', value: 40 },
    ];
    const result = calculateHypothesis(data, 'group', 'value');

    expect(result).not.toBeNull();
    if (result && typeof result.df === 'number') {
      expect(result.df).toBeLessThan(6);
      expect(result.df).toBeGreaterThanOrEqual(3);
    }
  });
});
