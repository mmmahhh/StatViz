import { useMemo } from 'react';
import { RawDataRow, DimensionConfig } from '../types';
import { calculateMSA, calculateKappa, calculateLinearityBias } from '../utils/msaStats';

interface MsaAnalysisParams {
  showPlot: boolean;
  module: string;
  rawData: RawDataRow[];
  dimensions: DimensionConfig;
}

export function useMsaAnalysis({ showPlot, module, rawData, dimensions }: MsaAnalysisParams) {
  const msaData = useMemo(() => {
    if (showPlot && module === 'msa' && dimensions.xAxis[0] && dimensions.xAxis[1] && dimensions.yAxis && rawData.length > 0) {
      return calculateMSA(rawData, dimensions.xAxis[0], dimensions.xAxis[1], dimensions.yAxis);
    }
    return null;
  }, [showPlot, module, dimensions.xAxis, dimensions.yAxis, rawData]);

  const kappaData = useMemo(() => {
    if (showPlot && module === 'msa-kappa' && dimensions.xAxis[0] && dimensions.xAxis[1] && dimensions.yAxis && rawData.length > 0) {
      return calculateKappa(rawData, dimensions.xAxis[0], dimensions.xAxis[1], dimensions.yAxis);
    }
    return null;
  }, [showPlot, module, dimensions.xAxis, dimensions.yAxis, rawData]);

  const linearityData = useMemo(() => {
    if (showPlot && module === 'msa-linearity' && dimensions.xAxis[0] && dimensions.yAxis && rawData.length > 0) {
      return calculateLinearityBias(rawData, dimensions.xAxis[0], dimensions.yAxis);
    }
    return null;
  }, [showPlot, module, dimensions.xAxis, dimensions.yAxis, rawData]);

  return {
    msaData,
    kappaData,
    linearityData,
  };
}
