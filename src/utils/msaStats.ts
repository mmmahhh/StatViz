import * as ss from 'simple-statistics';
import { RawDataRow, MSAResult, MSAVarComponent, MSAGageResult, KappaResult, LinearityBiasResult } from '../types';

/**
 * Perform Gage R&R Analysis (ANOVA Cross Method)
 * Assumes balanced data for simplicity in this prototype.
 */
export const calculateMSA = (
  data: RawDataRow[],
  partDim: string,
  operatorDim: string,
  measureDim: string
): MSAResult | null => {
  const cleanData = data.filter(d => 
    d[partDim] != null && 
    d[operatorDim] != null && 
    isFinite(Number(d[measureDim]))
  ).map(d => ({
    part: String(d[partDim]),
    operator: String(d[operatorDim]),
    value: Number(d[measureDim])
  }));

  if (cleanData.length < 10) return null;

  const parts = Array.from(new Set(cleanData.map(d => d.part)));
  const operators = Array.from(new Set(cleanData.map(d => d.operator)));
  const p = parts.length;
  const o = operators.length;

  if (p < 2 || o < 2) return null;

  const cellCounts = new Map<string, number>();
  cleanData.forEach(({ part, operator }) => {
    const key = `${part}__${operator}`;
    cellCounts.set(key, (cellCounts.get(key) ?? 0) + 1);
  });

  if (cellCounts.size !== p * o) return null;

  const counts = Array.from(cellCounts.values());
  const n = counts[0];
  if (!n || counts.some((count) => count !== n)) return null;

  const grandMean = ss.mean(cleanData.map(d => d.value));

  // 1. Calculate Sum of Squares
  let ssTotal = 0;
  cleanData.forEach(d => {
    ssTotal += Math.pow(d.value - grandMean, 2);
  });

  // SS Part
  let ssPart = 0;
  parts.forEach(partId => {
    const partValues = cleanData.filter(d => d.part === partId).map(d => d.value);
    const partMean = ss.mean(partValues);
    ssPart += partValues.length * Math.pow(partMean - grandMean, 2);
  });

  // SS Operator
  let ssOperator = 0;
  operators.forEach(opId => {
    const opValues = cleanData.filter(d => d.operator === opId).map(d => d.value);
    const opMean = ss.mean(opValues);
    ssOperator += opValues.length * Math.pow(opMean - grandMean, 2);
  });

  // SS Model (Cell means)
  let ssModel = 0;
  parts.forEach(partId => {
    operators.forEach(opId => {
      const cellValues = cleanData.filter(d => d.part === partId && d.operator === opId).map(d => d.value);
      if (cellValues.length > 0) {
        const cellMean = ss.mean(cellValues);
        ssModel += cellValues.length * Math.pow(cellMean - grandMean, 2);
      }
    });
  });

  const ssInteraction = ssModel - ssPart - ssOperator;
  const ssRepeatability = ssTotal - ssModel;

  // 2. Mean Squares
  const dfPart = p - 1;
  const dfOp = o - 1;
  const dfInteraction = (p - 1) * (o - 1);
  const dfRepeatability = p * o * (n - 1);

  const msPart = ssPart / dfPart;
  const msOp = ssOperator / dfOp;
  const msInteraction = dfInteraction > 0 ? ssInteraction / dfInteraction : 0;
  const msRepeatability = dfRepeatability > 0 ? ssRepeatability / dfRepeatability : 0;

  // 3. Variance Components (Random Effects Model)
  // Repeatability (EV)
  const varRepeat = msRepeatability;

  // Interaction
  let varInteraction = (msInteraction - msRepeatability) / n;
  if (varInteraction < 0) varInteraction = 0;

  // Operator (AV)
  let varOperator = (msOp - msInteraction) / (p * n);
  if (varOperator < 0) varOperator = 0;

  // Reproducibility
  const varReproduce = varOperator + varInteraction;

  // GRR
  const varGRR = varRepeat + varReproduce;

  // Part-to-Part (PV)
  let varPart = (msPart - msInteraction) / (o * n);
  if (varPart < 0) varPart = 0;

  // Total
  const varTotal = varGRR + varPart;

  // 4. Formatting Results
  const getContribution = (v: number) => (v / varTotal) * 100;

  const varComponents: MSAVarComponent[] = [
    { source: 'Total Gage R&R', varComp: varGRR, contribution: getContribution(varGRR) },
    { source: '  Repeatability', varComp: varRepeat, contribution: getContribution(varRepeat) },
    { source: '  Reproducibility', varComp: varReproduce, contribution: getContribution(varReproduce) },
    { source: '    Operator', varComp: varOperator, contribution: getContribution(varOperator) },
    { source: '    Operator*Part', varComp: varInteraction, contribution: getContribution(varInteraction) },
    { source: 'Part-to-Part', varComp: varPart, contribution: getContribution(varPart) },
    { source: 'Total Variation', varComp: varTotal, contribution: 100 }
  ];

  const totalStdDev = Math.sqrt(varTotal);

  const gageEvaluation: MSAGageResult[] = varComponents.map(vc => ({
    source: vc.source,
    stdDev: Math.sqrt(vc.varComp),
    studyVar: Math.sqrt(vc.varComp) * 6,
    percentStudyVar: (Math.sqrt(vc.varComp) / totalStdDev) * 100
  }));

  // ndc = 1.41 * (PV / GRR)
  const ndc = Math.floor(1.41 * (Math.sqrt(varPart) / Math.sqrt(varGRR)));

  const grrPercent = (Math.sqrt(varGRR) / totalStdDev) * 100;
  let isAcceptable: MSAResult['isAcceptable'] = 'unacceptable';
  if (grrPercent < 10) isAcceptable = 'excellent';
  else if (grrPercent <= 30) isAcceptable = 'marginal';

  return {
    varComponents,
    gageEvaluation,
    ndc,
    totalVar: varTotal,
    isAcceptable
  };
};

export const calculateKappa = (
  data: RawDataRow[],
  partDim: string,
  operatorDim: string,
  measureDim: string
): KappaResult | null => {
  const cleanData = data.filter(d => d[partDim] != null && d[operatorDim] != null && d[measureDim] != null);
  if (cleanData.length < 5) return null;

  // 1. 构建交叉表 (假设只有两个评估者，取前两个)
  const operators = Array.from(new Set(cleanData.map(d => String(d[operatorDim]))));
  if (operators.length < 2) return null;
  const op1 = operators[0];
  const op2 = operators[1];

  const partRatings: Record<string, { [op: string]: string }> = {};
  cleanData.forEach(d => {
    const p = String(d[partDim]);
    const o = String(d[operatorDim]);
    const m = String(d[measureDim]);
    if (!partRatings[p]) partRatings[p] = {};
    partRatings[p][o] = m;
  });

  const categories = Array.from(new Set(cleanData.map(d => String(d[measureDim]))));
  const crossTab: { [key: string]: { [key: string]: number } } = {};
  categories.forEach(c1 => {
    crossTab[c1] = {};
    categories.forEach(c2 => crossTab[c1][c2] = 0);
  });

  let n = 0;
  Object.values(partRatings).forEach(ratings => {
    if (ratings[op1] !== undefined && ratings[op2] !== undefined) {
      crossTab[ratings[op1]][ratings[op2]]++;
      n++;
    }
  });

  if (n === 0) return null;

  // 2. 计算 Kappa
  let observedAgreement = 0;
  categories.forEach(c => observedAgreement += crossTab[c][c]);
  observedAgreement /= n;

  let expectedAgreement = 0;
  categories.forEach(c => {
    let rowTotal = 0;
    let colTotal = 0;
    categories.forEach(other => {
      rowTotal += crossTab[c][other];
      colTotal += crossTab[other][c];
    });
    expectedAgreement += (rowTotal * colTotal);
  });
  expectedAgreement /= (n * n);

  const kappa = (expectedAgreement === 1) ? 1 : (observedAgreement - expectedAgreement) / (1 - expectedAgreement);

  // 3. 显著性检验 (简单近似)
  const se = Math.sqrt((observedAgreement * (1 - observedAgreement)) / (n * Math.pow(1 - expectedAgreement, 2)));
  const z = se === 0 ? 0 : kappa / se;
  // 正态分布 P 值近似
  const pValue = 2 * (1 - ss.cumulativeStdNormalProbability(Math.abs(z)));

  return {
    kappa,
    se,
    z,
    pValue,
    observedAgreement,
    expectedAgreement,
    n,
    isAcceptable: kappa > 0.75 ? 'excellent' : kappa > 0.4 ? 'marginal' : 'unacceptable',
    crossTab
  };
};

export const calculateLinearityBias = (
  data: RawDataRow[],
  refDim: string,
  measuredDim: string
): LinearityBiasResult | null => {
  const points: {x: number, y: number}[] = [];
  data.forEach(d => {
    const r = Number(d[refDim]);
    const m = Number(d[measuredDim]);
    if (isFinite(r) && isFinite(m)) {
      points.push({x: r, y: m - r}); // y 是 Bias (测量值 - 基准值)
    }
  });

  if (points.length < 2) return null;

  // 1. 回归分析 (Bias vs. Reference)
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
  const n = points.length;
  points.forEach(p => {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
    sumYY += p.y * p.y;
  });

  const denominator = (n * sumXX - sumX * sumX);
  if (denominator === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  
  const rNumerator = n * sumXY - sumX * sumY;
  const rDenominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
  const rSquared = rDenominator !== 0 ? Math.pow(rNumerator / rDenominator, 2) : 0;

  // 2. 分组计算各基准值的平均偏移
  const refGroups: Record<number, number[]> = {};
  points.forEach(p => {
    if (!refGroups[p.x]) refGroups[p.x] = [];
    refGroups[p.x].push(p.y);
  });

  const biasStats = Object.keys(refGroups).map(k => {
    const ref = Number(k);
    const biases = refGroups[ref];
    const meanBias = biases.reduce((a,b) => a+b, 0) / biases.length;
    
    // 简单的 T 检验 P 值模拟 (实际中需要 stdev 和 T 分布)
    const stdev = biases.length > 1 ? Math.sqrt(biases.reduce((a, b) => a + Math.pow(b - meanBias, 2), 0) / (biases.length - 1)) : 0;
    const t = stdev === 0 ? (meanBias === 0 ? 0 : 999) : (meanBias / (stdev / Math.sqrt(biases.length)));
    const pValue = 2 * (1 - ss.cumulativeStdNormalProbability(Math.abs(t)));

    return { refValue: ref, bias: meanBias, meanBias, pValue };
  });

  const totalMeanBias = sumY / n;

  return {
    equation: `Bias = ${slope.toFixed(4)} * Ref ${intercept >= 0 ? '+' : '-'} ${Math.abs(intercept).toFixed(4)}`,
    slope,
    intercept,
    rSquared,
    meanBias: totalMeanBias,
    biasStats,
    isLinearityAcceptable: Math.abs(slope) < 0.05, // 常用准则：斜率显著性或绝对值极小
    isBiasAcceptable: Math.abs(totalMeanBias) < (Math.max(...points.map(p => Math.abs(p.x))) * 0.01) // 偏移小于量程的 1%
  };
};
