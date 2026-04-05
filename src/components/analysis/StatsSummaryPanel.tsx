import React from 'react';
import { DescriptiveResult } from '../../utils/descriptiveStats';
import { useTranslation } from '../../hooks/useTranslation';

interface StatsSummaryPanelProps {
  stats: DescriptiveResult;
  columnName: string;
}

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col gap-0.5 px-3 py-2 bg-white/[0.03] border border-white/5 rounded-lg">
    <span className="text-[10px] text-linear-quaternary font-linear-emphasis uppercase tracking-wider">{label}</span>
    <span className="text-[14px] text-linear-primary font-mono tabular-nums">{value}</span>
  </div>
);

export const StatsSummaryPanel: React.FC<StatsSummaryPanelProps> = ({ stats, columnName }) => {
  const { t } = useTranslation();
  const fmt = (v: number, d = 4) => (v === undefined || v === null) ? '-' : v.toFixed(d);

  return (
    <div className="mt-6 border-t border-linear-borderSubtle pt-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-[14px] font-linear-semibold text-white">{t('stats.title')}</h3>
        <span className="text-[11px] text-linear-quaternary bg-white/5 px-2 py-0.5 rounded">{columnName}</span>
      </div>
      
      <div className="grid grid-cols-4 lg:grid-cols-7 gap-2">
        <StatCard label={t('stats.n')} value={String(stats.n)} />
        <StatCard label={t('stats.mean')} value={fmt(stats.mean)} />
        <StatCard label={t('stats.stdev')} value={fmt(stats.stdev)} />
        <StatCard label={t('stats.seMean')} value={fmt(stats.seMean)} />
        <StatCard label={t('stats.min')} value={fmt(stats.min)} />
        <StatCard label={t('stats.q1')} value={fmt(stats.q1)} />
        <StatCard label={t('stats.median')} value={fmt(stats.median)} />
        <StatCard label={t('stats.q3')} value={fmt(stats.q3)} />
        <StatCard label={t('stats.max')} value={fmt(stats.max)} />
        <StatCard label={t('stats.skewness')} value={fmt(stats.skewness)} />
        <StatCard label={t('stats.kurtosis')} value={fmt(stats.kurtosis)} />
        <StatCard label={t('stats.ciLower')} value={fmt(stats.ciLower)} />
        <StatCard label={t('stats.ciUpper')} value={fmt(stats.ciUpper)} />
      </div>
    </div>
  );
};
