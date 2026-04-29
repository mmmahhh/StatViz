import React from 'react';
import {
  BoxPlotStats,
  CapabilityResult,
  DescriptiveResult,
  HypothesisResult,
  KappaResult,
  LinearityBiasResult,
  MSAResult,
  RegressionResult,
  AnalysisModule,
} from '../../types';
import { Dataset } from '../../store/useDataStore';

interface ReportSummaryPanelProps {
  activeDataset?: Dataset;
  module: AnalysisModule;
  xAxisLabel?: string;
  yAxisLabel?: string;
  boxPlotData: BoxPlotStats[];
  descriptiveStats: DescriptiveResult | null;
  capabilityStats: CapabilityResult | null;
  regressionData: { points: { x: number; y: number }[]; result: RegressionResult | null };
  hypothesisData: HypothesisResult | null;
  msaData: MSAResult | null;
  kappaData: KappaResult | null;
  linearityData: LinearityBiasResult | null;
  metadata?: { totalCount: number; validCount: number; invalidCount: number };
}

const moduleLabels: Record<AnalysisModule, string> = {
  basic: '基础箱线图分析',
  capability: '过程能力分析',
  regression: '回归分析',
  hypothesis: '假设检验',
  msa: 'MSA 计量型分析',
  'msa-kappa': 'Kappa 一致性分析',
  'msa-linearity': '线性与偏移分析',
};

const KeyMetric: React.FC<{ label: string; value: string; tone?: 'neutral' | 'good' | 'warn' | 'bad' }> = ({ label, value, tone = 'neutral' }) => {
  const tones = {
    neutral: 'border-white/10 bg-white/5 text-white',
    good: 'border-green-500/20 bg-green-500/10 text-green-300',
    warn: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    bad: 'border-red-500/20 bg-red-500/10 text-red-300',
  };

  return (
    <div className={`rounded-xl border p-3 space-y-1 ${tones[tone]}`}>
      <div className="text-[10px] uppercase tracking-wider text-linear-quaternary">{label}</div>
      <div className="text-[15px] font-linear-semibold">{value}</div>
    </div>
  );
};

const formatNumber = (value: number | null | undefined, digits = 4) =>
  typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '-';

export const ReportSummaryPanel: React.FC<ReportSummaryPanelProps> = ({
  activeDataset,
  module,
  xAxisLabel,
  yAxisLabel,
  boxPlotData,
  descriptiveStats,
  capabilityStats,
  regressionData,
  hypothesisData,
  msaData,
  kappaData,
  linearityData,
  metadata,
}) => {
  const filterSummary = activeDataset?.filters.filter((item) => item.enabled) ?? [];
  const outlierCount = boxPlotData.reduce((sum, group) => sum + group.outliers.length, 0);
  const groupCount = boxPlotData.length;

  const renderFindings = () => {
    if (module === 'capability' && capabilityStats) {
      const cpk = capabilityStats.cpk ?? capabilityStats.ppk;
      const tone = cpk === null ? 'warn' : cpk >= 1.33 ? 'good' : cpk >= 1 ? 'warn' : 'bad';
      return [
        <KeyMetric key="cpk" label="关键能力指数" value={`Cpk ${formatNumber(capabilityStats.cpk, 3)} / Ppk ${formatNumber(capabilityStats.ppk, 3)}`} tone={tone} />,
        <KeyMetric key="ppm" label="不良风险" value={`观察PPM ${formatNumber(capabilityStats.ppmTotalObserved, 1)}`} tone={tone} />,
        <KeyMetric key="std" label="波动水平" value={`Within ${formatNumber(capabilityStats.withinStDev)} / Overall ${formatNumber(capabilityStats.overallStDev)}`} />,
      ];
    }

    if (module === 'regression' && regressionData.result) {
      return [
        <KeyMetric key="eq" label="回归方程" value={regressionData.result.equation} />,
        <KeyMetric key="r2" label="拟合优度" value={`R² ${formatNumber(regressionData.result.rSquared, 4)}`} tone={regressionData.result.rSquared >= 0.8 ? 'good' : regressionData.result.rSquared >= 0.5 ? 'warn' : 'bad'} />,
        <KeyMetric key="n" label="有效样本" value={`${regressionData.result.n} 对`} />,
      ];
    }

    if (module === 'hypothesis' && hypothesisData) {
      return [
        <KeyMetric key="method" label="检验方法" value={hypothesisData.method} />,
        <KeyMetric key="p" label="显著性" value={`P = ${formatNumber(hypothesisData.pValue, 4)}`} tone={hypothesisData.significant ? 'good' : 'warn'} />,
        <KeyMetric key="result" label="结论" value={hypothesisData.significant ? '组间差异显著' : '组间差异不显著'} tone={hypothesisData.significant ? 'good' : 'warn'} />,
      ];
    }

    if (module === 'msa' && msaData) {
      return [
        <KeyMetric key="status" label="MSA判定" value={msaData.isAcceptable === 'excellent' ? '测量系统优秀' : msaData.isAcceptable === 'marginal' ? '测量系统勉强可用' : '测量系统不可接受'} tone={msaData.isAcceptable === 'excellent' ? 'good' : msaData.isAcceptable === 'marginal' ? 'warn' : 'bad'} />,
        <KeyMetric key="ndc" label="区分类别数" value={`ndc = ${msaData.ndc}`} tone={msaData.ndc >= 5 ? 'good' : 'bad'} />,
        <KeyMetric key="tv" label="总变差" value={formatNumber(msaData.totalVar, 6)} />,
      ];
    }

    if (module === 'msa-kappa' && kappaData) {
      return [
        <KeyMetric key="kappa" label="Kappa值" value={formatNumber(kappaData.kappa, 4)} tone={kappaData.isAcceptable === 'excellent' ? 'good' : kappaData.isAcceptable === 'marginal' ? 'warn' : 'bad'} />,
        <KeyMetric key="agree" label="实际一致率" value={`${formatNumber(kappaData.observedAgreement * 100, 2)}%`} />,
        <KeyMetric key="p" label="显著性" value={`P = ${formatNumber(kappaData.pValue, 4)}`} />,
      ];
    }

    if (module === 'msa-linearity' && linearityData) {
      return [
        <KeyMetric key="linearity" label="线性结论" value={linearityData.isLinearityAcceptable ? '线性可接受' : '线性不可接受'} tone={linearityData.isLinearityAcceptable ? 'good' : 'bad'} />,
        <KeyMetric key="bias" label="偏移结论" value={linearityData.isBiasAcceptable ? '偏移可接受' : '偏移不可接受'} tone={linearityData.isBiasAcceptable ? 'good' : 'bad'} />,
        <KeyMetric key="eq" label="偏移方程" value={linearityData.equation} />,
      ];
    }

    return [
      <KeyMetric key="median" label="总体中位数" value={formatNumber(descriptiveStats?.median)} />,
      <KeyMetric key="iqr" label="四分位跨度" value={descriptiveStats ? formatNumber(descriptiveStats.q3 - descriptiveStats.q1) : '-'} />,
      <KeyMetric key="outliers" label="异常值数量" value={`${outlierCount} 个`} tone={outlierCount === 0 ? 'good' : outlierCount <= 3 ? 'warn' : 'bad'} />,
    ];
  };

  const renderNarrative = () => {
    if (module === 'capability' && capabilityStats) {
      const cpk = capabilityStats.cpk ?? capabilityStats.ppk;
      if (cpk === null) return '当前仅能给出部分能力指标，建议补齐 USL/LSL 与目标值后再出正式能力报告。';
      if (cpk >= 1.33) return '过程能力达到常见量产要求，短期与长期波动均处于较好水平，可用于正式过程能力汇报。';
      if (cpk >= 1) return '过程能力处于临界区间，建议同时关注中心偏移与波动收敛，再决定是否放量。';
      return '过程能力不足，当前过程偏差或波动较大，建议优先排查设备、工艺参数和异常批次。';
    }

    if (module === 'hypothesis' && hypothesisData) {
      return hypothesisData.significant
        ? '统计检验显示分组之间存在显著差异，可继续追溯具体批次、优裂类别或工艺条件带来的影响。'
        : '统计检验未发现显著差异，建议补充样本量或检查分组方式是否过粗。';
    }

    if (module === 'msa' && msaData) {
      return msaData.ndc >= 5
        ? '测量系统具备区分部件差异的能力，适合继续作为正式 MSA 报告依据。'
        : '测量系统区分能力不足，建议优先降低重复性/再现性误差后再执行正式评价。';
    }

    if (module === 'msa-kappa' && kappaData) {
      return kappaData.isAcceptable === 'excellent'
        ? '属性判定一致性较高，评估员之间判定标准基本稳定。'
        : '属性判定一致性仍有改进空间，建议统一判定标准并复训评估员。';
    }

    if (module === 'msa-linearity' && linearityData) {
      return linearityData.isLinearityAcceptable && linearityData.isBiasAcceptable
        ? '量具在当前量程内线性与偏移表现均可接受，可继续使用当前量测方案。'
        : '当前量具在部分量程存在趋势性偏差，建议校准或调整量程覆盖策略。';
    }

    if (module === 'regression' && regressionData.result) {
      return regressionData.result.rSquared >= 0.8
        ? '自变量与因变量之间存在较强线性关系，可进一步用于参数联动分析。'
        : '线性关系较弱，建议检查是否存在分层、非线性或异常点影响。';
    }

    return `本次报告共纳入 ${metadata?.validCount ?? descriptiveStats?.n ?? 0} 条有效记录，形成 ${groupCount} 组箱线图。建议重点关注中位数差异、四分位跨度和异常值分布。`;
  };

  return (
    <section className="rounded-2xl border border-linear-border bg-linear-surface shadow-linear-level2 p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-linear-brandAccent font-linear-emphasis">正式分析报告摘要</div>
          <h2 className="text-[22px] text-white font-linear-semibold tracking-tight">{moduleLabels[module]}</h2>
          <div className="text-[13px] text-linear-tertiary">
            数据集：{activeDataset?.name || '未命名数据集'}
            {yAxisLabel ? ` · 指标列：${yAxisLabel}` : ''}
            {xAxisLabel ? ` · 分组列：${xAxisLabel}` : ''}
          </div>
        </div>
        <div className="text-right text-[12px] text-linear-tertiary">
          <div>原始记录：{metadata?.totalCount ?? activeDataset?.rawData.length ?? 0}</div>
          <div>有效记录：{metadata?.validCount ?? descriptiveStats?.n ?? 0}</div>
          <div>异常/跳过：{metadata?.invalidCount ?? 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {renderFindings()}
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-2">
        <div className="text-[11px] uppercase tracking-wider text-linear-brandAccent font-linear-emphasis">分析条件</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[12px] text-linear-secondary">
          <div>分组数：{groupCount}</div>
          <div>异常值：{outlierCount}</div>
          <div>X 轴字段：{xAxisLabel || '未设置'}</div>
          <div>Y 轴字段：{yAxisLabel || '未设置'}</div>
        </div>
        <div className="text-[12px] text-linear-secondary leading-relaxed">
          筛选条件：
          {filterSummary.length === 0
            ? ' 无'
            : filterSummary.map((filter) => {
                const value = Array.isArray(filter.value) ? filter.value.join(', ') : filter.value;
                return ` [${filter.column} ${filter.operator} ${value}${filter.groupAlias ? ` => ${filter.groupAlias}` : ''}]`;
              }).join(' ')}
        </div>
      </div>

      <div className="rounded-xl border border-linear-brandAccent/20 bg-linear-brandAccent/5 p-4">
        <div className="text-[11px] uppercase tracking-wider text-linear-brandAccent font-linear-emphasis mb-2">结论与建议</div>
        <p className="text-[13px] text-linear-secondary leading-relaxed">{renderNarrative()}</p>
      </div>
    </section>
  );
};
