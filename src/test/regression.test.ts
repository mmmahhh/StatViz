import { describe, it, expect } from 'vitest';
import { calculateRegression } from '../utils/regressionStats';
import { RawDataRow } from '../types';

describe('calculateRegression', () => {
  it('should correctly calculate SLR for a perfectly linear dataset (y = 2x + 1)', () => {
    const data: RawDataRow[] = [
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: 7 },
      { x: 4, y: 9 },
      { x: 5, y: 11 },
    ];

    const { points, result } = calculateRegression(data, 'x', 'y');

    expect(points).toHaveLength(5);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.slope).toBeCloseTo(2, 5);
      expect(result.intercept).toBeCloseTo(1, 5);
      expect(result.rSquared).toBeCloseTo(1, 5);
      expect(result.r).toBeCloseTo(1, 5);
      expect(result.equation).toBe('Y = 2.0000X + 1.0000');
    }
  });

  it('should handle negative correlation correctly (y = -0.5x + 10)', () => {
    const data: RawDataRow[] = [
      { x: 0, y: 10 },
      { x: 10, y: 5 },
      { x: 20, y: 0 },
    ];

    const { result } = calculateRegression(data, 'x', 'y');

    expect(result).not.toBeNull();
    if (result) {
      expect(result.slope).toBeCloseTo(-0.5, 5);
      expect(result.intercept).toBeCloseTo(10, 5);
      expect(result.r).toBeCloseTo(-1, 5);
      expect(result.rSquared).toBeCloseTo(1, 5);
      expect(result.equation).toBe('Y = -0.5000X + 10.0000');
    }
  });

  it('should return null result if less than 2 valid pairs', () => {
    const data: RawDataRow[] = [
      { x: 1, y: null },
      { x: null, y: 5 },
      { x: 2, y: 10 },
    ];

    const { points, result } = calculateRegression(data, 'x', 'y');
    expect(points).toHaveLength(1);
    expect(result).toBeNull();
  });

  it('should handle non-numeric strings by parsing them', () => {
    const data: RawDataRow[] = [
      { x: '1.5', y: '3.5' },
      { x: '2.5', y: '5.5' },
    ];

    const { result } = calculateRegression(data, 'x', 'y');
    expect(result).not.toBeNull();
    if (result) {
      expect(result.slope).toBeCloseTo(2, 5);
      expect(result.intercept).toBeCloseTo(0.5, 5);
    }
  });

  it('should omit intercept in equation when intercept is exactly 0', () => {
    // y = 2x (no intercept)
    const data: RawDataRow[] = [
      { x: 1, y: 2 },
      { x: 2, y: 4 },
      { x: 3, y: 6 },
      { x: 4, y: 8 },
      { x: 5, y: 10 },
    ];

    const { result } = calculateRegression(data, 'x', 'y');
    expect(result).not.toBeNull();
    if (result) {
      expect(result.intercept).toBeCloseTo(0, 5);
      expect(result.equation).toBe('Y = 2.0000X');
    }
  });
});
