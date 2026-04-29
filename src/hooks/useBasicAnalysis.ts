import { useMemo, useState, useEffect } from 'react';
import { RawDataRow, DimensionConfig, GroupBuilderConfig, BoxPlotStats, AnalysisMetadata } from '../types';
import { calculateBoxPlotStats } from '../utils/stats';
import { applyGroupBuilder, DERIVED_GROUP_COLUMN, describeGroupBuilder, isDateLikeColumn, DERIVED_GROUP_SORT_COLUMN } from '../utils/groupBuilder';
import { useDebounce } from './useDebounce';

interface BasicAnalysisParams {
  showPlot: boolean;
  rawData: RawDataRow[];
  dimensions: DimensionConfig;
  groupBuilder?: GroupBuilderConfig;
}

export function useBasicAnalysis({ showPlot, rawData, dimensions, groupBuilder }: BasicAnalysisParams) {
  const [asyncResult, setAsyncResult] = useState<{ stats: BoxPlotStats[]; metadata: AnalysisMetadata } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Debounce dimensions to avoid triggering expensive calculations on every change
  const debouncedDimensions = useDebounce(dimensions, 300);

  const sanitizedGroupBuilder = useMemo(() => {
    if (!groupBuilder) return null;
    const safeFields = groupBuilder.fields.map((field) => {
      if (!field.column || field.column === debouncedDimensions.yAxis) {
        return { ...field, column: '' };
      }
      if (field.transform === 'original') return field;
      if (isDateLikeColumn(rawData, field.column)) return field;
      return { ...field, transform: 'original' as const };
    });
    return { ...groupBuilder, fields: safeFields };
  }, [groupBuilder, rawData, debouncedDimensions.yAxis]);

  const derivedGroupingEnabled =
    !!sanitizedGroupBuilder?.enabled &&
    sanitizedGroupBuilder.fields.some((field) => field.column);

  const processedData = useMemo(() => {
    if (!derivedGroupingEnabled || !sanitizedGroupBuilder) return rawData;
    return applyGroupBuilder(rawData, sanitizedGroupBuilder);
  }, [rawData, sanitizedGroupBuilder, derivedGroupingEnabled]);

  const effectiveXAxis = derivedGroupingEnabled ? DERIVED_GROUP_COLUMN : (debouncedDimensions.xAxis[0] || '');
  const effectiveXAxisLabel = derivedGroupingEnabled
    ? `组合分组 (${describeGroupBuilder(sanitizedGroupBuilder!)})`
    : (debouncedDimensions.xAxis[0] || '');

  useEffect(() => {
    if (showPlot && debouncedDimensions.yAxis && processedData.length > 0) {
      // Use Worker for large datasets (> 5000 rows)
      if (processedData.length > 5000) {
        setIsCalculating(true);
        const worker = new Worker(new URL('../utils/statsWorker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (e) => {
          if (e.data.type === 'calculateBoxPlotStatsResult') {
            setAsyncResult({ stats: e.data.stats, metadata: e.data.metadata });
            setIsCalculating(false);
            worker.terminate();
          }
        };
        // BUG-03: Add onerror handler
        worker.onerror = (error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Worker calculation failed:', error);
          }
          setIsCalculating(false);
          worker.terminate();
        };
        worker.postMessage({
          type: 'calculateBoxPlotStats',
          data: processedData,
          xDimension: effectiveXAxis,
          yDimension: debouncedDimensions.yAxis,
          DERIVED_GROUP_SORT_COLUMN
        });
        return () => worker.terminate();
      } else {
        // Synchronous for small datasets
        const result = calculateBoxPlotStats(processedData, effectiveXAxis, debouncedDimensions.yAxis);
        setAsyncResult(result);
        setIsCalculating(false);
      }
    } else {
      setAsyncResult({ stats: [], metadata: { totalCount: 0, validCount: 0, invalidCount: 0 } });
    }
  }, [showPlot, debouncedDimensions.yAxis, processedData, effectiveXAxis]);

  return {
    processedData,
    boxPlotData: asyncResult?.stats || [],
    analysisMetadata: asyncResult?.metadata || { totalCount: 0, validCount: 0, invalidCount: 0 },
    effectiveXAxisLabel,
    derivedGroupingEnabled,
    sanitizedGroupBuilder,
    isCalculating
  };
}
