import { describe, it, expect } from 'vitest';
import { calculateCapability } from '../utils/capabilityStats';
import { CapabilityConfig } from '../types';

describe('calculateCapability', () => {
  it('should return null values for insufficient data (n < 2)', () => {
    const values = [10];
    const config: CapabilityConfig = { usl: 12, lsl: 8, target: 10, subgroupSize: 1 };
    const result = calculateCapability(values, config, 1, 10);

    expect(result.cp).toBeNull();
    expect(result.cpk).toBeNull();
    expect(result.pp).toBeNull();
    expect(result.ppk).toBeNull();
  });

  it('should calculate Cp correctly for centered process with USL and LSL', () => {
    // Values within 3 stdev of mean, with USL=10, LSL=6, mean=8, stdev=0.5
    // Cp = (USL - LSL) / (6 * stdev) = 4 / 3 = 1.333
    const values = [8, 8, 8, 8];
    const config: CapabilityConfig = { usl: 10, lsl: 6, target: 8, subgroupSize: 1 };
    const result = calculateCapability(values, config, 0.5, 8);

    expect(result.cp).toBeCloseTo(1.333, 2);
    expect(result.pp).toBeCloseTo(1.333, 2);
  });

  it('should calculate Cpk correctly for offset process', () => {
    // mean=9 (closer to USL=10), stdev=0.5
    // Cpu = (USL - mean) / (3*stdev) = 1 / 1.5 = 0.667
    // Cpl = (mean - LSL) / (3*stdev) = 5 / 1.5 = 3.333
    // Cpk = min(Cpu, Cpl) = 0.667
    const values = [9, 9, 9, 9];
    const config: CapabilityConfig = { usl: 10, lsl: 6, target: 8, subgroupSize: 1 };
    const result = calculateCapability(values, config, 0.5, 9);

    expect(result.cpu).toBeCloseTo(0.667, 2);
    expect(result.cpl).toBeCloseTo(2, 2);
    expect(result.cpk).toBeCloseTo(0.667, 2);
  });

  it('should handle null USL or LSL', () => {
    const values = [8, 8, 8, 8, 8];
    const configWithOnlyUSL: CapabilityConfig = { usl: 10, lsl: null, target: null, subgroupSize: 1 };
    const result = calculateCapability(values, configWithOnlyUSL, 0.5, 8);

    expect(result.cp).toBeNull(); // Cp requires both USL and LSL
    expect(result.cpu).not.toBeNull();
    expect(result.cpl).toBeNull();
  });

  it('should handle zero standard deviation', () => {
    const values = [8, 8, 8, 8, 8]; // All same values
    const config: CapabilityConfig = { usl: 10, lsl: 6, target: 8, subgroupSize: 1 };
    const result = calculateCapability(values, config, 0, 8);

    expect(result.cp).toBeNull();
    expect(result.cpk).toBeNull();
  });

  it('should calculate expected PPM based on normal distribution', () => {
    // mean=8, stdev=0.5, USL=10, LSL=6
    // z_LSL = (6-8)/0.5 = -4, z_USL = (10-8)/0.5 = 4
    // P(outside) ≈ 0.00003 + 0.00003 ≈ 0.00006
    // PPM ≈ 60
    const values = [8, 8, 8, 8, 8, 8, 8, 8];
    const config: CapabilityConfig = { usl: 10, lsl: 6, target: 8, subgroupSize: 1 };
    const result = calculateCapability(values, config, 0.5, 8);

    expect(result.ppmTotalExpected).toBeLessThan(100);
    expect(result.ppmTotalExpected).toBeGreaterThan(0);
  });

  it('should calculate observed PPM from actual data', () => {
    // One value (12) exceeds USL=10
    const values = [8, 8, 8, 8, 12];
    const config: CapabilityConfig = { usl: 10, lsl: null, target: null, subgroupSize: 1 };
    const result = calculateCapability(values, config, 0.5, 8);

    // 1 out of 5 values outside = 0.2 * 1,000,000 = 200,000 PPM
    expect(result.ppmTotalObserved).toBeCloseTo(200000, 0);
  });
});
