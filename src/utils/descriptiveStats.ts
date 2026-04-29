import * as d3 from 'd3';
import { jStat } from 'jstat';
import { DescriptiveResult } from '../types';

export const computeDescriptiveStats = (values: number[]): DescriptiveResult | null => {
  const clean = values.filter((v) => !isNaN(v) && isFinite(v));
  const n = clean.length;
  if (n === 0) return null;

  clean.sort(d3.ascending);

  const mean = d3.mean(clean) ?? 0;
  const stdev = n > 1 ? Math.sqrt(d3.sum(clean, (v) => (v - mean) ** 2) / (n - 1)) : 0;
  const seMean = n > 1 ? stdev / Math.sqrt(n) : 0;

  const min = clean[0];
  const max = clean[n - 1];
  const q1 = d3.quantile(clean, 0.25) ?? min;
  const median = d3.quantile(clean, 0.5) ?? mean;
  const q3 = d3.quantile(clean, 0.75) ?? max;

  let skewness = 0;
  if (n > 2 && stdev > 0) {
    const m3 = d3.sum(clean, (v) => (v - mean) ** 3) / n;
    skewness = (n * m3) / (stdev ** 3 * (1 - 1 / n) * (1 - 2 / n));
  }

  let kurtosis = 0;
  if (n > 3 && stdev > 0) {
    const m4 = d3.sum(clean, (v) => (v - mean) ** 4) / n;
    kurtosis = (n * (n + 1) * m4) / ((n - 1) * (n - 2) * (n - 3) * stdev ** 4) - (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
  }

  const tCritical = n > 1 ? jStat.studentt.inv(0.975, n - 1) : 1.96;
  const ciLower = mean - tCritical * seMean;
  const ciUpper = mean + tCritical * seMean;

  return {
    n,
    mean,
    stdev,
    seMean,
    min,
    q1,
    median,
    q3,
    max,
    skewness,
    kurtosis,
    ciLower,
    ciUpper,
  };
};

/**
 * Extract numeric values from a column in the dataset.
 */
export const extractNumericColumn = (
  data: Record<string, unknown>[],
  column: string
): number[] => {
  return data
    .map((row) => {
      const val = row[column];
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return parseFloat(val);
      return NaN;
    })
    .filter((v) => !isNaN(v));
};
