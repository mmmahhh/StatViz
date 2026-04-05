import { RawDataRow, BoxPlotStats } from '../types';
import * as d3 from 'd3';

export const calculateBoxPlotStats = (
  data: RawDataRow[],
  xDimension: string,
  yDimension: string
): BoxPlotStats[] => {
  // Group data by xDimension (or treat as one group if missing)
  const groupedData = d3.group(data, (d) => {
    if (!xDimension) return 'Total';
    const val = d[xDimension];
    return val !== null && val !== undefined ? String(val) : 'Unknown';
  });

  const stats: BoxPlotStats[] = [];

  for (const [groupName, groupRecords] of groupedData) {
    // Extract continuous values for the yDimension
    const values = groupRecords
      .map((d) => {
        const val = d[yDimension];
        return typeof val === 'number' ? val : Number(val);
      })
      .filter((v) => !isNaN(v));

    if (values.length === 0) continue;

    // Use d3 to sort and calculate quartiles
    values.sort(d3.ascending);

    const q1 = d3.quantile(values, 0.25) ?? 0;
    const q2 = d3.quantile(values, 0.5) ?? 0;
    const q3 = d3.quantile(values, 0.75) ?? 0;
    const iqr = q3 - q1;

    // Define outlier thresholds
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    // Filter outliers
    const outliers = values.filter((v) => v < lowerBound || v > upperBound);

    // Filter regular values to find min and max within boundaries
    const regularValues = values.filter((v) => v >= lowerBound && v <= upperBound);
    const min = regularValues.length > 0 ? Math.min(...regularValues) : q1;
    const max = regularValues.length > 0 ? Math.max(...regularValues) : q3;

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

  return stats;
};
