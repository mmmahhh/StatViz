import { RawDataRow, RegressionResult } from '../types';

/**
 * Calculates Simple Linear Regression (OLS)
 * Extracts pairs of (x, y) where both are valid numbers.
 */
export const calculateRegression = (
  data: RawDataRow[],
  xDimension: string,
  yDimension: string
): { points: { x: number; y: number }[]; result: RegressionResult | null } => {
  const points: { x: number; y: number }[] = [];

  for (const row of data) {
    const xVal = row[xDimension];
    const yVal = row[yDimension];

    if (xVal !== null && xVal !== undefined && xVal !== '' && 
        yVal !== null && yVal !== undefined && yVal !== '') {
      
      const xNum = typeof xVal === 'number' ? xVal : parseFloat(xVal as string);
      const yNum = typeof yVal === 'number' ? yVal : parseFloat(yVal as string);

      if (isFinite(xNum) && isFinite(yNum)) {
        points.push({ x: xNum, y: yNum });
      }
    }
  }

  const n = points.length;

  if (n < 2) {
    return { points, result: null };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
    sumY2 += p.y * p.y;
  }

  const denominator = n * sumX2 - sumX * sumX;
  
  if (denominator === 0) {
    // Vertical line, undefined slope
    return { points, result: null };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Pearson correlation coefficient (r)
  const rNumerator = n * sumXY - sumX * sumY;
  const rDenominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  const r = rDenominator !== 0 ? rNumerator / rDenominator : 0;
  const rSquared = r * r;

  // Build equation string, handling edge case when intercept is exactly 0
  let equation: string;
  if (Math.abs(intercept) < 1e-10) {
    equation = `Y = ${slope.toFixed(4)}X`;
  } else {
    const sign = intercept < 0 ? '-' : '+';
    equation = `Y = ${slope.toFixed(4)}X ${sign} ${Math.abs(intercept).toFixed(4)}`;
  }

  return {
    points,
    result: {
      slope,
      intercept,
      r,
      rSquared,
      equation,
      n
    }
  };
};