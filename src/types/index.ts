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

/**
 * Statistical results for a single box in the box plot.
 */
export interface BoxPlotStats {
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
