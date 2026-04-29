import { useMemo } from 'react';
import { CapabilityConfig, DescriptiveResult, RawDataRow } from '../types';
import { calculateCapability } from '../utils/capabilityStats';
import { extractNumericColumn } from '../utils/descriptiveStats';

interface CapabilityAnalysisParams {
  showPlot: boolean;
  module: string;
  processedData: RawDataRow[];
  yAxis: string;
  capabilityConfig: CapabilityConfig;
  descriptiveStats: DescriptiveResult | null;
}

export function useCapabilityAnalysis({
  showPlot,
  module,
  processedData,
  yAxis,
  capabilityConfig,
  descriptiveStats,
}: CapabilityAnalysisParams) {
  const histogramValues = useMemo(() => {
    if (showPlot && (module === 'histogram' || module === 'capability') && yAxis && processedData.length > 0) {
      return extractNumericColumn(processedData, yAxis);
    }
    return [];
  }, [showPlot, module, yAxis, processedData]);

  const capabilityStats = useMemo(() => {
    if (showPlot && module === 'capability' && descriptiveStats && histogramValues.length > 0) {
      return calculateCapability(histogramValues, capabilityConfig, descriptiveStats.stdev, descriptiveStats.mean);
    }
    return null;
  }, [showPlot, module, descriptiveStats, histogramValues, capabilityConfig]);

  return {
    histogramValues,
    capabilityStats,
  };
}
