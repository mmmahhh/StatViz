import { useMemo } from 'react';
import { RawDataRow, DimensionConfig } from '../types';
import { calculateBoxPlotStats } from '../utils/stats';
import { computeDescriptiveStats, extractNumericColumn } from '../utils/descriptiveStats';

interface AnalysisParams {
  showPlot: boolean;
  chartType: 'boxplot' | 'histogram';
  activeDataset?: { id: string; name: string; rawData: RawDataRow[]; dimensions: DimensionConfig };
  compareDataset?: { id: string; name: string; rawData: RawDataRow[]; dimensions: DimensionConfig };
}

/**
 * Custom hook to handle all analysis logic for the application.
 * Extracts raw data, columns, and computes statistics for charts and reports.
 * Memoizes heavy calculations to ensure performance.
 */
export function useAnalysis({ showPlot, chartType, activeDataset, compareDataset }: AnalysisParams) {
  const rawData = useMemo(() => activeDataset?.rawData ?? [], [activeDataset]);
  const dimensions = useMemo(() => 
    activeDataset?.dimensions ?? { xAxis: [] as string[], yAxis: '', color: null }, 
    [activeDataset]
  );

  const columns = useMemo(() => {
    if (rawData.length > 0) return Object.keys(rawData[0]);
    return [];
  }, [rawData]);

  const analysisResult = useMemo(() => {
    if (showPlot && chartType === 'boxplot' && dimensions.yAxis && rawData.length > 0) {
      return calculateBoxPlotStats(rawData, dimensions.xAxis[0] || '', dimensions.yAxis);
    }
    return { stats: [], metadata: { totalCount: 0, validCount: 0, invalidCount: 0 } };
  }, [showPlot, chartType, dimensions, rawData]);

  const boxPlotData = analysisResult.stats;
  const analysisMetadata = analysisResult.metadata;

  const compareBoxPlotData = useMemo(() => {
    if (showPlot && chartType === 'boxplot' && dimensions.yAxis && compareDataset && compareDataset.rawData.length > 0) {
      return calculateBoxPlotStats(compareDataset.rawData, dimensions.xAxis[0] || '', dimensions.yAxis).stats;
    }
    return undefined;
  }, [showPlot, chartType, dimensions, compareDataset]);

  const histogramValues = useMemo(() => {
    if (showPlot && chartType === 'histogram' && dimensions.yAxis && rawData.length > 0) {
      return extractNumericColumn(rawData, dimensions.yAxis);
    }
    return [];
  }, [showPlot, chartType, dimensions.yAxis, rawData]);

  const descriptiveStats = useMemo(() => {
    if (showPlot && dimensions.yAxis && rawData.length > 0) {
      const nums = extractNumericColumn(rawData, dimensions.yAxis);
      return computeDescriptiveStats(nums);
    }
    return null;
  }, [showPlot, dimensions.yAxis, rawData]);

  const canRunAnalysis = rawData.length > 0 && !!dimensions.yAxis;

  return {
    rawData,
    dimensions,
    columns,
    boxPlotData,
    analysisMetadata,
    compareBoxPlotData,
    histogramValues,
    descriptiveStats,
    canRunAnalysis
  };
}
