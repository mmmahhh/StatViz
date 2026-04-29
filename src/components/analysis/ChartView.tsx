import React, { RefObject } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { BoxPlot, StatsOverlayOptions } from '../charts/BoxPlot';
import { Histogram } from '../charts/Histogram';
import { ScatterPlot } from '../charts/ScatterPlot';
import { StatsSummaryPanel } from '../analysis/StatsSummaryPanel';
import { CapabilityPanel } from '../analysis/CapabilityPanel';
import { RegressionPanel } from '../analysis/RegressionPanel';
import { HypothesisPanel } from '../analysis/HypothesisPanel';
import { MSAPanel } from '../analysis/MSAPanel';
import { KappaPanel } from '../analysis/KappaPanel';
import { LinearityBiasPanel } from '../analysis/LinearityBiasPanel';
import { useTranslation } from '../../hooks/useTranslation';
import { BoxPlotStats, DimensionConfig, DescriptiveResult, CapabilityResult, CapabilityConfig, AnalysisModule, RegressionResult, HypothesisResult, MSAResult, KappaResult, LinearityBiasResult } from '../../types';
import { Dataset } from '../../store/useDataStore';

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
  histogramValues: number[];
  descriptiveStats: DescriptiveResult | null;
  capabilityStats: CapabilityResult | null;
  capabilityConfig: CapabilityConfig;
  regressionData: { points: { x: number; y: number }[]; result: RegressionResult | null };
  hypothesisData: HypothesisResult | null;
  msaData: MSAResult | null;
  kappaData: KappaResult | null;
  linearityData: LinearityBiasResult | null;
  module: AnalysisModule;
  dimensions: DimensionConfig;
  xAxisLabel: string;
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
  capabilityStats,
  capabilityConfig,
  regressionData,
  hypothesisData,
  msaData,
  kappaData,
  linearityData,
  module,
  dimensions,
  xAxisLabel,
  chartContainerRef,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 rounded-2xl bg-linear-surface border border-linear-border shadow-linear-level2 flex flex-col overflow-hidden">
      {module === 'basic' && chartType === 'boxplot' && (
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
              const labelKey = `charts.${key}` as keyof typeof t; // Cast to available translation keys
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
        {module === 'regression' ? (
          <ScatterPlot
            points={regressionData.points}
            regression={regressionData.result}
            xLabel={xAxisLabel || 'X'}
            yLabel={dimensions.yAxis || 'Y'}
          />
        ) : module === 'msa' ? (
          <BoxPlot 
            key={`boxplot-msa-${activeDataset?.id}`}
            data={boxPlotData} 
            primaryLabel={activeDataset?.name}
            xAxisLabel={xAxisLabel} 
            yAxisLabel={dimensions.yAxis} 
            overlayOptions={{ ...overlayOptions, showMean: true, showMedian: true }}
          />
        ) : module === 'hypothesis' ? (
          <BoxPlot 
            key={`boxplot-hypo-${activeDataset?.id}`}
            data={boxPlotData} 
            primaryLabel={activeDataset?.name}
            xAxisLabel={xAxisLabel} 
            yAxisLabel={dimensions.yAxis} 
            overlayOptions={{ ...overlayOptions, showMean: true, showMedian: true }}
          />
        ) : module === 'basic' && chartType === 'boxplot' ? (
          <BoxPlot 
            key={`boxplot-${activeDataset?.id}-${compareDatasetId}`}
            data={boxPlotData} 
            compareData={compareBoxPlotData}
            primaryLabel={activeDataset?.name}
            compareLabel={datasets.find(d => d.id === compareDatasetId)?.name}
            xAxisLabel={xAxisLabel} 
            yAxisLabel={dimensions.yAxis} 
            overlayOptions={overlayOptions}
          />
        ) : module === 'msa-kappa' ? (
          <div className="w-full h-full flex items-center justify-center p-8">
            <div className="max-w-2xl rounded-2xl border border-linear-brandAccent/20 bg-linear-brandAccent/5 px-8 py-10 text-center space-y-3">
              <div className="text-[12px] uppercase tracking-wider text-linear-brandAccent font-linear-emphasis">
                Kappa Consistency Analysis
              </div>
              <div className="text-[20px] text-white font-linear-semibold tracking-tight">
                属性一致性分析已完成
              </div>
              <p className="text-[13px] text-linear-secondary leading-relaxed">
                Kappa 分析的核心结果展示在下方摘要面板中，包含 Kappa 值、实际一致率、显著性和判定建议。
              </p>
            </div>
          </div>
        ) : (
          <Histogram 
            values={histogramValues} 
            label={dimensions.yAxis} 
            capabilityConfig={module === 'capability' ? capabilityConfig : undefined} 
          />
        )}
      </div>
      
      {module === 'regression' && regressionData.result ? (
        <div className="p-6 border-t border-linear-borderSubtle bg-white/[0.01] space-y-6">
          <RegressionPanel 
            regression={regressionData.result} 
            xLabel={xAxisLabel || 'X'} 
            yLabel={dimensions.yAxis || 'Y'} 
          />
        </div>
      ) : module === 'hypothesis' && hypothesisData ? (
        <div className="p-6 border-t border-linear-borderSubtle bg-white/[0.01] space-y-6">
          <HypothesisPanel 
            data={hypothesisData} 
            xLabel={xAxisLabel || 'Factor'} 
            yLabel={dimensions.yAxis || 'Response'} 
          />
        </div>
      ) : module === 'msa' && msaData ? (
        <div className="p-6 border-t border-linear-borderSubtle bg-white/[0.01] space-y-6">
          <MSAPanel 
            data={msaData} 
            partLabel={xAxisLabel || 'Part'} 
            operatorLabel={dimensions.xAxis[1] || 'Operator'} 
            measureLabel={dimensions.yAxis || 'Response'} 
          />
        </div>
      ) : module === 'msa-kappa' && kappaData ? (
        <div className="p-6 border-t border-linear-borderSubtle bg-white/[0.01] space-y-6">
          <KappaPanel data={kappaData} />
        </div>
      ) : module === 'msa-linearity' && linearityData ? (
        <div className="p-6 border-t border-linear-borderSubtle bg-white/[0.01] space-y-6">
          <LinearityBiasPanel data={linearityData} />
        </div>
      ) : descriptiveStats ? (
        <div className="p-6 border-t border-linear-borderSubtle bg-white/[0.01] space-y-6">
          {module === 'capability' && capabilityStats ? (
            <CapabilityPanel capStats={capabilityStats} columnName={dimensions.yAxis} />
          ) : (
            <StatsSummaryPanel stats={descriptiveStats} columnName={dimensions.yAxis} />
          )}
        </div>
      ) : null}
    </div>
  );
};
