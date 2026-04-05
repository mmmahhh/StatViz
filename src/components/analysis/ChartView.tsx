import React, { RefObject } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { BoxPlot, StatsOverlayOptions } from '../charts/BoxPlot';
import { Histogram } from '../charts/Histogram';
import { StatsSummaryPanel } from '../analysis/StatsSummaryPanel';
import { useTranslation } from '../../hooks/useTranslation';
import { BoxPlotStats, DimensionConfig, DescriptiveResult } from '../../types';
import { Dataset } from '../../store/useDataStore';

import { AIInsightPanel } from './AIInsightPanel';

interface ChartViewProps {
  chartType: 'boxplot' | 'histogram';
  activeDataset?: Dataset;
  compareDatasetId: string | null;
  setCompareDatasetId: (id: string | null) => void;
  datasets: Dataset[];
  overlayOptions: StatsOverlayOptions;
  setOverlayOptions: (opts: StatsOverlayOptions) => void;
  boxPlotData: BoxPlotStats[];
  compareBoxPlotData?: BoxPlotStats[];
  metadata?: { totalCount: number; validCount: number; invalidCount: number };
  histogramValues: number[];
  descriptiveStats: DescriptiveResult | null;
  dimensions: DimensionConfig;
  chartContainerRef: RefObject<HTMLDivElement>;
}

export const ChartView: React.FC<ChartViewProps> = ({
  chartType,
  activeDataset,
  compareDatasetId,
  setCompareDatasetId,
  datasets,
  overlayOptions,
  setOverlayOptions,
  boxPlotData,
  compareBoxPlotData,
  histogramValues,
  descriptiveStats,
  dimensions,
  chartContainerRef,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 rounded-2xl bg-linear-surface border border-linear-border shadow-linear-level2 flex flex-col overflow-hidden">
      {chartType === 'boxplot' && (
        <div className="h-12 border-b border-linear-borderSubtle bg-white/[0.02] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-linear-emphasis text-linear-quaternary flex items-center gap-2">
              <SlidersHorizontal size={12} />
              {t('charts.compareWith')}
            </span>
            <select 
              className="bg-black/20 border border-white/10 rounded px-2 py-1 text-[12px] text-linear-primary font-linear-medium outline-none focus:border-linear-brand/50 transition-colors"
              value={compareDatasetId || ''}
              onChange={e => setCompareDatasetId(e.target.value || null)}
            >
              <option value="">{t('charts.none')}</option>
              {datasets.filter(d => d.id !== activeDataset?.id).map(ds => (
                <option key={ds.id} value={ds.id}>{ds.name} ({ds.rawData.length} {t('app.rows')})</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-4 text-[12px] text-linear-secondary font-linear-medium">
            {Object.entries(overlayOptions).map(([key, val]) => {
              const labelKey = `charts.${key}` as any;
              return (
                <label key={key} className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors group">
                  <input 
                    type="checkbox" 
                    checked={val as boolean} 
                    onChange={e => setOverlayOptions({...overlayOptions, [key]: e.target.checked})}
                    className="w-3 h-3 rounded-sm border-white/20 bg-white/5 text-linear-brand focus:ring-1 focus:ring-linear-brand focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer"
                  />
                  <span className={val ? 'text-linear-primary' : 'text-linear-quaternary group-hover:text-linear-secondary'}>{t(labelKey)}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div ref={chartContainerRef} className="flex-1 flex items-center justify-center p-2">
        {chartType === 'boxplot' ? (
          <BoxPlot 
            key={`boxplot-${activeDataset?.id}-${compareDatasetId}`}
            data={boxPlotData} 
            compareData={compareBoxPlotData}
            primaryLabel={activeDataset?.name}
            compareLabel={datasets.find(d => d.id === compareDatasetId)?.name}
            xAxisLabel={dimensions.xAxis[0] || ''} 
            yAxisLabel={dimensions.yAxis} 
            overlayOptions={overlayOptions}
          />
        ) : (
          <Histogram values={histogramValues} label={dimensions.yAxis} />
        )}
      </div>
      
      {descriptiveStats && (
        <div className="p-6 border-t border-linear-borderSubtle bg-white/[0.01] space-y-6">
          <AIInsightPanel 
            stats={descriptiveStats} 
            outliersCount={boxPlotData.reduce((acc, curr) => acc + (curr.outliers?.length || 0), 0)} 
            metadata={metadata}
          />
          <div className="pt-4 border-t border-white/[0.04]">
            <StatsSummaryPanel stats={descriptiveStats} columnName={dimensions.yAxis} />
          </div>
        </div>
      )}
    </div>
  );
};
