import { useMemo, useRef, useEffect } from 'react';
import { AnalysisMetadata } from '../types';
import { computeDescriptiveStats, extractNumericColumn } from '../utils/descriptiveStats';
import { calculateRegression } from '../utils/regressionStats';
import { calculateHypothesis } from '../utils/hypothesisStats';
import { applyFilters } from '../utils/filterData';
import { calculateBoxPlotStats } from '../utils/stats';
import { applyGroupBuilder, DERIVED_GROUP_COLUMN, isDateLikeColumn } from '../utils/groupBuilder';
import { useDataStore, Dataset } from '../store/useDataStore';
import { useBasicAnalysis } from './useBasicAnalysis';
import { useCapabilityAnalysis } from './useCapabilityAnalysis';
import { useMsaAnalysis } from './useMsaAnalysis';
import { useDebounce } from './useDebounce';

interface AnalysisParams {
  showPlot: boolean;
  activeDataset?: Dataset;
  compareDataset?: Dataset;
}

/**
 * Internal helper to calculate comparison data
 */
function calculateCompareData(
  showPlot: boolean,
  yAxis: string,
  module: string,
  compareDataset?: Dataset
) {
  if (!showPlot || !yAxis || !compareDataset || compareDataset.rawData.length === 0) {
    return undefined;
  }

  const filteredData = applyFilters(compareDataset.rawData, compareDataset.filters || []);
  
  const derivedEnabled =
    module === 'basic' && 
    !!compareDataset.groupBuilder?.enabled && 
    compareDataset.groupBuilder.fields.some((field) => field.column);

  const safeBuilder = compareDataset.groupBuilder
    ? {
        ...compareDataset.groupBuilder,
        fields: compareDataset.groupBuilder.fields.map((field) => {
          if (!field.column || field.column === yAxis) return { ...field, column: '' };
          if (field.transform === 'original') return field;
          return isDateLikeColumn(filteredData, field.column)
            ? field
            : { ...field, transform: 'original' as const };
        }),
      }
    : undefined;

  const processedData = derivedEnabled && safeBuilder
    ? applyGroupBuilder(filteredData, safeBuilder)
    : filteredData;

  // BUG-01: Prioritize compareDataset's own dimensions if not derived
  const compareXAxis = compareDataset.dimensions.xAxis[0] || '';
  const effectiveX = derivedEnabled ? DERIVED_GROUP_COLUMN : compareXAxis;
  
  return calculateBoxPlotStats(processedData, effectiveX, yAxis).stats;
}

/**
 * Custom hook to handle all analysis logic for the application.
 * Refactored to use modular sub-hooks for better maintainability.
 */
export function useAnalysis({ showPlot, activeDataset, compareDataset }: AnalysisParams) {

  const rawData = useMemo(() => {
    if (!activeDataset) return [];
    return applyFilters(activeDataset.rawData, activeDataset.filters || []);
  }, [activeDataset]);

  const dimensions = useMemo(() => 
    activeDataset?.dimensions ?? { xAxis: [] as string[], yAxis: '', color: null }, 
    [activeDataset]
  );
  
  const module = activeDataset?.module || 'basic';
  const groupBuilder = activeDataset?.groupBuilder;
  
  const capabilityConfig = useMemo(() => {
    const rawConf = activeDataset?.capabilityConfig;
    return {
      usl: rawConf?.usl ?? null,
      lsl: rawConf?.lsl ?? null,
      target: rawConf?.target ?? null,
      subgroupSize: rawConf?.subgroupSize ?? 1,
    };
  }, [activeDataset]);

  const columns = useMemo(() => {
    if (rawData.length > 0) return Object.keys(rawData[0]);
    return [];
  }, [rawData]);

  // 1. Basic BoxPlot/Histogram Analysis
  const {
    processedData,
    boxPlotData,
    analysisMetadata,
    effectiveXAxisLabel,
    derivedGroupingEnabled,
  } = useBasicAnalysis({ showPlot, rawData, dimensions, groupBuilder });

  // 2. Descriptive Statistics
  const descriptiveStats = useMemo(() => {
    if (showPlot && dimensions.yAxis && processedData.length > 0) {
      const nums = extractNumericColumn(processedData, dimensions.yAxis);
      return computeDescriptiveStats(nums);
    }
    return null;
  }, [showPlot, dimensions.yAxis, processedData]);

  // 3. Capability Analysis
  const { histogramValues, capabilityStats } = useCapabilityAnalysis({
    showPlot,
    module,
    processedData,
    yAxis: dimensions.yAxis,
    capabilityConfig,
    descriptiveStats,
  });

  // 4. MSA Analysis (Kappa, Linearity, Gage R&R)
  const { msaData, kappaData, linearityData } = useMsaAnalysis({
    showPlot,
    module,
    rawData,
    dimensions,
  });

  // 5. Regression Analysis
  const xAxisFirst = dimensions.xAxis[0];
  const yAxis = dimensions.yAxis;
  const debouncedXAxisFirst = useDebounce(xAxisFirst, 300);
  const debouncedYAxis = useDebounce(yAxis, 300);
  const regressionData = useMemo(() => {
    if (showPlot && module === 'regression' && debouncedXAxisFirst && debouncedYAxis && rawData.length > 0) {
      return calculateRegression(rawData, debouncedXAxisFirst, debouncedYAxis);
    }
    return { points: [], result: null };
  }, [showPlot, module, debouncedXAxisFirst, debouncedYAxis, rawData]);

  // 6. Hypothesis Testing Analysis
  const hypothesisData = useMemo(() => {
    if (showPlot && module === 'hypothesis' && debouncedXAxisFirst && debouncedYAxis && rawData.length > 0) {
      return calculateHypothesis(rawData, debouncedXAxisFirst, debouncedYAxis);
    }
    return null;
  }, [showPlot, module, debouncedXAxisFirst, debouncedYAxis, rawData]);

  // Handle Y-Axis changes to reset group builder fields if necessary
  const prevYAxisRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeDataset && dimensions.yAxis !== prevYAxisRef.current) {
      const oldYAxis = prevYAxisRef.current;
      prevYAxisRef.current = dimensions.yAxis;

      if (oldYAxis === null) return;

      if (module === 'basic' && activeDataset?.groupBuilder?.enabled) {
        const hasInvalidField = activeDataset.groupBuilder.fields.some((f) => f.column === dimensions.yAxis);
        
        if (hasInvalidField) {
          const newFields = activeDataset.groupBuilder.fields.map((field) => ({
            ...field,
            column: field.column === dimensions.yAxis ? '' : field.column,
            transform: field.column === dimensions.yAxis ? 'original' : field.transform
          }));
          
          // BUG-02: Pass activeDataset.id to avoid cross-dataset updates
          useDataStore.getState().setGroupBuilder(activeDataset.id, { fields: newFields });
        }
      }
    }
  }, [dimensions.yAxis, module, activeDataset]);

  const reportMetadata = useMemo((): AnalysisMetadata => {
    if (!showPlot || processedData.length === 0) {
      return analysisMetadata;
    }

    if (module === 'msa-kappa') {
      const xAxis0 = dimensions.xAxis[0];
      const xAxis1 = dimensions.xAxis[1];
      const totalCount = rawData.length;
      const validCount = rawData.filter((row) =>
        row[xAxis0] != null &&
        row[xAxis1] != null &&
        row[yAxis] != null
      ).length;

      return {
        totalCount,
        validCount,
        invalidCount: totalCount - validCount,
      };
    }

    return analysisMetadata;
  }, [showPlot, processedData.length, rawData, analysisMetadata, module, dimensions.xAxis, yAxis]);

  const compareBoxPlotData = useMemo(() => {
    return calculateCompareData(
      showPlot,
      yAxis,
      module,
      compareDataset
    );
  }, [showPlot, yAxis, module, compareDataset]);

  const canRunAnalysis = processedData.length > 0 && !!dimensions.yAxis &&
    (module === 'basic'
      ? (derivedGroupingEnabled || dimensions.xAxis.length > 0)
      : module === 'capability' || module === 'msa-linearity' ||
        ((module === 'msa' || module === 'msa-kappa') ? dimensions.xAxis.length >= 2 : dimensions.xAxis.length > 0));

  return {
    rawData,
    processedData,
    dimensions,
    columns,
    boxPlotData,
    analysisMetadata: reportMetadata,
    effectiveXAxisLabel,
    derivedGroupingEnabled,
    compareBoxPlotData,
    histogramValues,
    descriptiveStats,
    capabilityStats,
    capabilityConfig,
    regressionData,
    hypothesisData,
    msaData,
    kappaData,
    linearityData,
    module,
    canRunAnalysis
  };
}
