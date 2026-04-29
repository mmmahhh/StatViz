import { CapabilityConfig, CapabilityResult } from '../types';

// Constants for estimating standard deviation
const D2_FOR_N_2 = 1.128;

// Standard Normal CDF approximation (Hart's approximation or similar)
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) p = 1 - p;
  return p;
}

export const calculateCapability = (
  values: number[],
  config: CapabilityConfig,
  overallStDevFallback: number, // from descriptive stats
  mean: number
): CapabilityResult => {
  const { usl, lsl, target } = config;
  const n = values.length;
  
  if (n < 2) {
    return {
      cp: null, cpl: null, cpu: null, cpk: null,
      pp: null, ppl: null, ppu: null, ppk: null, cpm: null,
      ppmTotalExpected: null, ppmTotalObserved: null,
      overallStDev: overallStDevFallback,
      withinStDev: overallStDevFallback
    };
  }

  // Calculate Overall Standard Deviation
  const overallStDev = overallStDevFallback;

  // Calculate Within Standard Deviation (using Average Moving Range of span 2 for subgroup size 1)
  let mrSum = 0;
  let mrCount = 0;
  for (let i = 1; i < n; i++) {
    mrSum += Math.abs(values[i] - values[i - 1]);
    mrCount++;
  }
  const mrBar = mrCount > 0 ? mrSum / mrCount : 0;
  const withinStDev = mrBar > 0 ? mrBar / D2_FOR_N_2 : overallStDev;

  // Helper for metrics
  const calcIndices = (stdev: number) => {
    if (stdev === 0) return { p: null, pl: null, pu: null, pk: null };
    const pl = lsl !== null ? (mean - lsl) / (3 * stdev) : null;
    const pu = usl !== null ? (usl - mean) / (3 * stdev) : null;
    const p = (usl !== null && lsl !== null) ? (usl - lsl) / (6 * stdev) : null;
    const pk = (pl !== null && pu !== null) ? Math.min(pl, pu) : (pl !== null ? pl : pu);
    return { p, pl, pu, pk };
  };

  const within = calcIndices(withinStDev);
  const overall = calcIndices(overallStDev);

  let cpm: number | null = null;
  if (target !== null && usl !== null && lsl !== null && overallStDev > 0) {
    const variance = overallStDev * overallStDev;
    const targetDiff = mean - target;
    const targetStDev = Math.sqrt(variance + targetDiff * targetDiff);
    cpm = (usl - lsl) / (6 * targetStDev);
  }

  // Expected PPM (Overall) based on Normal Distribution
  let ppmTotalExpected: number | null = null;
  if (overallStDev > 0) {
    let pOut = 0;
    if (lsl !== null) {
      const zLsl = (lsl - mean) / overallStDev;
      pOut += normalCDF(zLsl);
    }
    if (usl !== null) {
      const zUsl = (usl - mean) / overallStDev;
      pOut += (1 - normalCDF(zUsl));
    }
    if (lsl !== null || usl !== null) {
      ppmTotalExpected = pOut * 1_000_000;
    }
  }

  // Observed PPM
  let ppmTotalObserved: number | null = null;
  if (lsl !== null || usl !== null) {
    let outCount = 0;
    for (const v of values) {
      if ((lsl !== null && v < lsl) || (usl !== null && v > usl)) {
        outCount++;
      }
    }
    ppmTotalObserved = (outCount / n) * 1_000_000;
  }

  return {
    cp: within.p,
    cpl: within.pl,
    cpu: within.pu,
    cpk: within.pk,
    pp: overall.p,
    ppl: overall.pl,
    ppu: overall.pu,
    ppk: overall.pk,
    cpm,
    ppmTotalExpected,
    ppmTotalObserved,
    overallStDev,
    withinStDev
  };
};
