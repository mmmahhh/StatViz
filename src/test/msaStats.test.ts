import { describe, it, expect } from 'vitest';
import { calculateMSA } from '../utils/msaStats';
import { RawDataRow } from '../types';

describe('calculateMSA', () => {
  it('should return null for insufficient data', () => {
    const data: RawDataRow[] = [
      { part: 'A', operator: 'Op1', value: 10 },
    ];
    const result = calculateMSA(data, 'part', 'operator', 'value');
    expect(result).toBeNull();
  });

  it('should return null for single part or operator', () => {
    const data: RawDataRow[] = [
      { part: 'A', operator: 'Op1', value: 10 },
      { part: 'A', operator: 'Op2', value: 11 },
      { part: 'A', operator: 'Op1', value: 10 },
      { part: 'A', operator: 'Op2', value: 11 },
    ];
    const result = calculateMSA(data, 'part', 'operator', 'value');
    expect(result).toBeNull();
  });

  it('should calculate variance components for balanced data', () => {
    // Balanced: 3 parts × 2 operators × 2 trials = 12 measurements
    const data: RawDataRow[] = [
      { part: 'A', operator: 'Op1', value: 10 },
      { part: 'A', operator: 'Op1', value: 10.1 },
      { part: 'A', operator: 'Op2', value: 10.2 },
      { part: 'A', operator: 'Op2', value: 10.3 },
      { part: 'B', operator: 'Op1', value: 20 },
      { part: 'B', operator: 'Op1', value: 20.1 },
      { part: 'B', operator: 'Op2', value: 20.2 },
      { part: 'B', operator: 'Op2', value: 20.3 },
      { part: 'C', operator: 'Op1', value: 30 },
      { part: 'C', operator: 'Op1', value: 30.1 },
      { part: 'C', operator: 'Op2', value: 30.2 },
      { part: 'C', operator: 'Op2', value: 30.3 },
    ];
    const result = calculateMSA(data, 'part', 'operator', 'value');

    expect(result).not.toBeNull();
    if (result) {
      expect(result.varComponents).toHaveLength(7);
      expect(result.ndc).toBeGreaterThan(0);
      expect(result.totalVar).toBeGreaterThan(0);
    }
  });

  it('should classify GRR correctly based on percentage', () => {
    // Create data where GRR is very low compared to total variation
    const data: RawDataRow[] = [
      // Parts vary significantly (10, 20, 30), operators vary minimally
      { part: 'A', operator: 'Op1', value: 10 },
      { part: 'A', operator: 'Op2', value: 10 },
      { part: 'B', operator: 'Op1', value: 20 },
      { part: 'B', operator: 'Op2', value: 20 },
      { part: 'C', operator: 'Op1', value: 30 },
      { part: 'C', operator: 'Op2', value: 30 },
      // Add repeated measurements
      { part: 'A', operator: 'Op1', value: 10.1 },
      { part: 'A', operator: 'Op2', value: 10.1 },
      { part: 'B', operator: 'Op1', value: 20.1 },
      { part: 'B', operator: 'Op2', value: 20.1 },
      { part: 'C', operator: 'Op1', value: 30.1 },
      { part: 'C', operator: 'Op2', value: 30.1 },
    ];
    const result = calculateMSA(data, 'part', 'operator', 'value');

    expect(result).not.toBeNull();
    if (result) {
      // GRR contribution should be low
      const grrComponent = result.varComponents.find(v => v.source === 'Total Gage R&R');
      expect(grrComponent).toBeDefined();
      expect(grrComponent!.contribution).toBeLessThan(30);
    }
  });

  it('should include all required variance component sources', () => {
    // Balanced data: 3 parts × 2 operators × 2 replicates = 12 measurements (>= 10 required)
    const data: RawDataRow[] = [
      { part: 'A', operator: 'Op1', value: 10 },
      { part: 'A', operator: 'Op1', value: 10.1 },
      { part: 'A', operator: 'Op2', value: 10.2 },
      { part: 'A', operator: 'Op2', value: 10.3 },
      { part: 'B', operator: 'Op1', value: 20 },
      { part: 'B', operator: 'Op1', value: 20.1 },
      { part: 'B', operator: 'Op2', value: 20.2 },
      { part: 'B', operator: 'Op2', value: 20.3 },
      { part: 'C', operator: 'Op1', value: 30 },
      { part: 'C', operator: 'Op1', value: 30.1 },
      { part: 'C', operator: 'Op2', value: 30.2 },
      { part: 'C', operator: 'Op2', value: 30.3 },
    ];
    const result = calculateMSA(data, 'part', 'operator', 'value');

    expect(result).not.toBeNull();
    if (result) {
      const sources = result.varComponents.map(v => v.source);
      expect(sources).toContain('Total Gage R&R');
      expect(sources).toContain('Part-to-Part');
      expect(sources).toContain('Total Variation');
    }
  });

  it('should reject unbalanced studies instead of estimating with fractional replicates', () => {
    const data: RawDataRow[] = [
      { part: 'A', operator: 'Op1', value: 10 },
      { part: 'A', operator: 'Op1', value: 10.1 },
      { part: 'A', operator: 'Op2', value: 10.2 },
      { part: 'A', operator: 'Op2', value: 10.3 },
      { part: 'B', operator: 'Op1', value: 20 },
      { part: 'B', operator: 'Op1', value: 20.1 },
      { part: 'B', operator: 'Op2', value: 20.2 },
      { part: 'B', operator: 'Op2', value: 20.3 },
      { part: 'C', operator: 'Op1', value: 30 },
      { part: 'C', operator: 'Op1', value: 30.1 },
      { part: 'C', operator: 'Op2', value: 30.2 },
    ];

    expect(calculateMSA(data, 'part', 'operator', 'value')).toBeNull();
  });
});
