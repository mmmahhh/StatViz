import * as d3 from 'd3';
import { RawDataRow, BoxPlotStats } from '../types';

/**
 * Worker-side implementation of stats calculations.
 */
self.onmessage = (e: MessageEvent) => {
  const { type, data, xDimension, yDimension, DERIVED_GROUP_SORT_COLUMN } = e.data;

  if (type === 'calculateBoxPlotStats') {
    const totalCount = data.length;
    
    // Group data
    const groupedData = d3.group(data as RawDataRow[], (d) => {
      if (!xDimension) return 'Total';
      const val = d[xDimension];
      return val !== null && val !== undefined ? String(val) : 'Unknown';
    });

    const stats: BoxPlotStats[] = [];
    let totalValidCount = 0;

    const groupedEntries = Array.from(groupedData.entries()).sort(([, recordsA], [, recordsB]) => {
      const sortA = String(recordsA[0]?.[DERIVED_GROUP_SORT_COLUMN] ?? '');
      const sortB = String(recordsB[0]?.[DERIVED_GROUP_SORT_COLUMN] ?? '');
      if (!sortA && !sortB) return 0;
      return sortA.localeCompare(sortB, 'zh-Hans-CN', { numeric: true });
    });

    for (const [groupName, groupRecords] of groupedEntries) {
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

      values.sort(d3.ascending);

      const n = values.length;
      const q1 = d3.quantile(values, 0.25) ?? 0;
      const q2 = d3.quantile(values, 0.5) ?? 0;
      const q3 = d3.quantile(values, 0.75) ?? 0;
      const iqr = q3 - q1;

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
        n,
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

    self.postMessage({
      type: 'calculateBoxPlotStatsResult',
      stats,
      metadata: {
        totalCount,
        validCount: totalValidCount,
        invalidCount: totalCount - totalValidCount,
      }
    });
  }
};
