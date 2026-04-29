import * as ss from 'simple-statistics';
import { jStat } from 'jstat';
import { RawDataRow, HypothesisResult, GroupStats } from '../types';

/**
 * Perform Hypothesis Testing (t-Test or ANOVA) based on group count.
 */
export const calculateHypothesis = (
  data: RawDataRow[],
  xDimension: string,
  yDimension: string,
  alpha: number = 0.05
): HypothesisResult | null => {
  // 1. Group data
  const groups = new Map<string, number[]>();
  
  for (const row of data) {
    const xVal = String(row[xDimension] ?? 'Unknown');
    const yVal = row[yDimension];
    
    if (yVal !== null && yVal !== undefined && yVal !== '') {
      const yNum = typeof yVal === 'number' ? yVal : parseFloat(yVal as string);
      if (isFinite(yNum)) {
        if (!groups.has(xVal)) groups.set(xVal, []);
        groups.get(xVal)!.push(yNum);
      }
    }
  }

  const groupKeys = Array.from(groups.keys());
  if (groupKeys.length < 2) return null;

  const groupStats: GroupStats[] = groupKeys.map(name => {
    const vals = groups.get(name)!;
    return {
      name,
      n: vals.length,
      mean: ss.mean(vals),
      stdev: vals.length > 1 ? ss.standardDeviation(vals) : 0
    };
  });

  // 2. Decide method
  if (groupKeys.length === 2) {
    // Independent Two-Sample Welch t-Test
    const sample1 = groups.get(groupKeys[0])!;
    const sample2 = groups.get(groupKeys[1])!;
    
    if (sample1.length < 2 || sample2.length < 2) return null;

    const t = ss.tTestTwoSample(sample1, sample2);
    if (t === null || t === undefined) return null;

    const variance1 = ss.variance(sample1);
    const variance2 = ss.variance(sample2);
    const n1 = sample1.length;
    const n2 = sample2.length;
    const numerator = Math.pow(variance1 / n1 + variance2 / n2, 2);
    const denominator =
      (n1 > 1 ? Math.pow(variance1 / n1, 2) / (n1 - 1) : 0) +
      (n2 > 1 ? Math.pow(variance2 / n2, 2) / (n2 - 1) : 0);
    const df = denominator > 0 ? numerator / denominator : n1 + n2 - 2;
    const pValue = tDistPValue(Math.abs(t), df);

    return {
      method: 't-Test',
      statistic: t,
      df,
      pValue,
      significant: pValue < alpha,
      alpha,
      groupStats
    };
  } else {
    // One-Way ANOVA
    const allSamples = groupKeys.map(k => groups.get(k)!);
    
    // ANOVA F-test
    // F = (between-group variance) / (within-group variance)
    const grandMean = ss.mean(data.map(d => Number(d[yDimension])).filter(v => isFinite(v)));
    const nTotal = groupStats.reduce((sum, g) => sum + g.n, 0);
    const k = groupStats.length;

    let ssBetween = 0;
    let ssWithin = 0;

    groupStats.forEach((g, i) => {
      ssBetween += g.n * Math.pow(g.mean - grandMean, 2);
      const sample = allSamples[i];
      sample.forEach(v => {
        ssWithin += Math.pow(v - g.mean, 2);
      });
    });

    const dfBetween = k - 1;
    const dfWithin = nTotal - k;
    const msBetween = ssBetween / dfBetween;
    const msWithin = ssWithin / dfWithin;
    
    const f = msWithin !== 0 ? msBetween / msWithin : 0;

    // Calculate p-value using F-distribution approximation
    const pValue = fDistPValue(f, dfBetween, dfWithin);

    return {
      method: 'ANOVA',
      statistic: f,
      df: `${dfBetween}, ${dfWithin}`,
      pValue,
      significant: pValue < alpha,
      alpha,
      groupStats
    };
  }
};

function tDistPValue(t: number, df: number): number {
  if (!isFinite(t) || !isFinite(df) || df <= 0) return 1;
  const cdf = jStat.studentt.cdf(t, df);
  return Math.min(1, Math.max(0, 2 * (1 - cdf)));
}

function fDistPValue(f: number, d1: number, d2: number): number {
  if (!isFinite(f) || !isFinite(d1) || !isFinite(d2) || f <= 0 || d1 <= 0 || d2 <= 0) return 1;
  return Math.min(1, Math.max(0, 1 - jStat.centralF.cdf(f, d1, d2)));
}
