/**
 * Represents a single row of raw data from CSV or Excel.
 * Keys are column names, and values can be strings, numbers, or null.
 */
export interface RawDataRow {
  [key: string]: string | number | null;
}

/**
 * Configuration for data mapping to the box plot.
 * Supports multi-dimensional nested grouping on the X-axis.
 */
export interface DimensionConfig {
  /** Column names for the X-axis, supporting nested levels */
  xAxis: string[];
  /** Column name for the Y-axis (value axis) */
  yAxis: string;
  /** Column name for color coding, or null if no color dimension is used */
  color: string | null;
}

export type DateGroupingGranularity = 'day' | 'week' | 'month';

export interface DateGroupingConfig {
  enabled: boolean;
  dateColumn: string;
  categoryColumn: string | null;
  granularity: DateGroupingGranularity;
  labelPrefix: string;
}

export type GroupTransform = 'original' | 'day' | 'week' | 'month';

export interface GroupBuilderField {
  column: string;
  transform: GroupTransform;
  prefix: string;
}

export interface GroupBuilderConfig {
  enabled: boolean;
  separator: string;
  fields: GroupBuilderField[];
}

/**
 * Statistical results for a single box in the box plot.
 */
export interface BoxPlotStats {
  /** Sample size for the group */
  n: number;
  /** First quartile (25th percentile) */
  q1: number;
  /** Second quartile (50th percentile / median) */
  q2: number;
  /** Third quartile (75th percentile) */
  q3: number;
  /** Minimum value excluding outliers */
  min: number;
  /** Maximum value excluding outliers */
  max: number;
  /** Array of outlier values */
  outliers: number[];
  /** Arithmetic mean */
  mean: number;
  /** Display name for the group represented by this box */
  groupName: string;
  /** Unique ID for the box, often a serialized path of its nested categories */
  id: string;
}

export interface DescriptiveResult {
  n: number;
  mean: number;
  stdev: number;
  seMean: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  skewness: number;
  kurtosis: number;
  ciLower: number;
  ciUpper: number;
}

export type AnalysisModule = 'basic' | 'capability' | 'regression' | 'hypothesis' | 'msa' | 'msa-kappa' | 'msa-linearity';

export interface CapabilityConfig {
  usl: number | null;
  lsl: number | null;
  target: number | null;
  subgroupSize: number;
}

export interface CapabilityResult {
  cp: number | null;
  cpl: number | null;
  cpu: number | null;
  cpk: number | null;
  pp: number | null;
  ppl: number | null;
  ppu: number | null;
  ppk: number | null;
  cpm: number | null;
  ppmTotalExpected: number | null;
  ppmTotalObserved: number | null;
  overallStDev: number;
  withinStDev: number;
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  r: number;
  rSquared: number;
  equation: string;
  n: number;
}

export interface GroupStats {
  name: string;
  n: number;
  mean: number;
  stdev: number;
}

export interface HypothesisResult {
  method: 't-Test' | 'ANOVA';
  statistic: number;
  df: number | string; // e.g. "2, 27" for ANOVA
  pValue: number;
  significant: boolean;
  alpha: number;
  groupStats: GroupStats[];
}

export interface MSAVarComponent {
  source: string;
  varComp: number;
  contribution: number; // %Contribution
}

export interface MSAGageResult {
  source: string;
  stdDev: number;
  studyVar: number;
  percentStudyVar: number;
}

export interface MSAResult {
  varComponents: MSAVarComponent[];
  gageEvaluation: MSAGageResult[];
  ndc: number;
  totalVar: number;
  isAcceptable: 'excellent' | 'marginal' | 'unacceptable';
}

export type FilterOperator = 'in' | 'not_in' | 'range' | 'regex';

export interface FilterRule {
  id: string;
  column: string;
  operator: FilterOperator;
  value: string | string[]; // e.g., ['0402', '0403'] for 'in', or ['0320', '0330'] for 'range'
  groupAlias?: string;      // If set, matches will be renamed to this alias in the analysis
  enabled: boolean;
}

export interface KappaResult {
  kappa: number;
  se: number;
  z: number;
  pValue: number;
  observedAgreement: number;
  expectedAgreement: number;
  n: number;
  isAcceptable: 'excellent' | 'marginal' | 'unacceptable';
  crossTab: { [key: string]: { [key: string]: number } };
}

export interface LinearityBiasResult {
  equation: string;
  slope: number;
  intercept: number;
  rSquared: number;
  meanBias: number;
  biasStats: { refValue: number; bias: number; meanBias: number; pValue: number }[];
  isLinearityAcceptable: boolean;
  isBiasAcceptable: boolean;
}

export interface AnalysisMetadata {
  totalCount: number;
  validCount: number;
  invalidCount: number;
}
