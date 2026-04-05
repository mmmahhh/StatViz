import { RawDataRow, BoxPlotStats } from '../types';
import * as d3 from 'd3';

/**
 * Enhanced statistics calculation for quality engineering.
 * Handles data cleaning, outlier detection (IQR), and robust descriptive stats.
 */
export const calculateBoxPlotStats = (
  data: RawDataRow[],
  xDimension: string,
  yDimension: string
): { stats: BoxPlotStats[]; metadata: { totalCount: number; validCount: number; invalidCount: number } } => {
  const totalCount = data.length;
  
  // Group data by xDimension (or treat as one group if missing)
  const groupedData = d3.group(data, (d) => {
    if (!xDimension) return 'Total';
    const val = d[xDimension];
    return val !== null && val !== undefined ? String(val) : 'Unknown';
  });

  const stats: BoxPlotStats[] = [];
  let totalValidCount = 0;

  for (const [groupName, groupRecords] of groupedData) {
    // Robust data cleaning: Filter out non-numeric values and NaNs
    const values = groupRecords
      .map((d) => {
        const val = d[yDimension];
        if (val === null || val === undefined || val === '') return NaN;
        const num = Number(val);
        return isFinite(num) ? num : NaN;
      })
      .filter((v) => !isNaN(v));

    totalValidCount += values.length;

    if (values.length === 0) continue;

    // Sort values for quartile calculation
    values.sort(d3.ascending);

    const n = values.length;
    const q1 = d3.quantile(values, 0.25) ?? 0;
    const q2 = d3.quantile(values, 0.5) ?? 0;
    const q3 = d3.quantile(values, 0.75) ?? 0;
    const iqr = q3 - q1;

    // Standard IQR outlier thresholds (1.5 * IQR)
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outliers: number[] = [];
    let minIdx = -1;
    let maxIdx = -1;

    for (let i = 0; i < n; i++) {
      const v = values[i];
      if (v < lowerBound || v > upperBound) {
        outliers.push(v);
      } else {
        if (minIdx === -1) minIdx = i;
        maxIdx = i;
      }
    }

    const min = minIdx !== -1 ? values[minIdx] : q1;
    const max = maxIdx !== -1 ? values[maxIdx] : q3;
    const mean = d3.mean(values) ?? 0;

    stats.push({
      groupName,
      id: groupName,
      q1,
      q2,
      q3,
      min,
      max,
      outliers,
      mean,
    });
  }

  return {
    stats,
    metadata: {
      totalCount,
      validCount: totalValidCount,
      invalidCount: totalCount - totalValidCount,
    }
  };
};
