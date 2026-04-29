import React from 'react';
import { CapabilityResult } from '../../types';

interface CapabilityPanelProps {
  capStats: CapabilityResult;
  columnName: string;
}

const StatBox: React.FC<{ label: string; value: number | null | undefined; precision?: number }> = ({ label, value, precision = 3 }) => (
  <div className="flex flex-col gap-1 p-3 bg-white/5 border border-white/10 rounded-lg">
    <span className="text-[11px] text-linear-quaternary font-linear-emphasis tracking-wider uppercase">{label}</span>
    <span className="text-[16px] text-white font-linear-bold font-mono">
      {typeof value === 'number' && isFinite(value) ? value.toFixed(precision) : '-'}
    </span>
  </div>
);

export const CapabilityPanel: React.FC<CapabilityPanelProps> = ({ capStats, columnName }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-[14px] font-linear-semibold text-white tracking-tight">过程能力分析 (Process Capability) - {columnName}</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="text-[12px] font-linear-emphasis text-linear-brandAccent">潜在能力 (Within)</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatBox label="Cp" value={capStats.cp} />
            <StatBox label="Cpl" value={capStats.cpl} />
            <StatBox label="Cpu" value={capStats.cpu} />
            <StatBox label="Cpk" value={capStats.cpk} />
          </div>
          <div className="text-[11px] text-linear-tertiary">标准差 (Within): {capStats.withinStDev.toFixed(4)}</div>
        </div>

        <div className="space-y-3">
          <div className="text-[12px] font-linear-emphasis text-linear-brandAccent">整体能力 (Overall)</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatBox label="Pp" value={capStats.pp} />
            <StatBox label="Ppl" value={capStats.ppl} />
            <StatBox label="Ppu" value={capStats.ppu} />
            <StatBox label="Ppk" value={capStats.ppk} />
          </div>
          <div className="text-[11px] text-linear-tertiary flex justify-between">
            <span>标准差 (Overall): {capStats.overallStDev.toFixed(4)}</span>
            <span>Cpm: {capStats.cpm !== null ? capStats.cpm.toFixed(3) : '-'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/[0.04]">
        <div className="space-y-2">
          <div className="text-[12px] font-linear-emphasis text-linear-secondary">预期性能 (Expected PPM)</div>
          <StatBox label="PPM Total (Exp)" value={capStats.ppmTotalExpected} precision={1} />
        </div>
        <div className="space-y-2">
          <div className="text-[12px] font-linear-emphasis text-linear-secondary">实际性能 (Observed PPM)</div>
          <StatBox label="PPM Total (Obs)" value={capStats.ppmTotalObserved} precision={1} />
        </div>
      </div>

      <div className="p-4 rounded-xl border border-linear-brandAccent/20 bg-linear-brandAccent/5 text-[12px] text-linear-secondary leading-relaxed">
        结论建议：
        {(capStats.cpk ?? 0) >= 1.33
          ? ' 当前过程能力达到常见量产要求，建议保持过程中心化并持续监控波动。'
          : (capStats.cpk ?? 0) >= 1
            ? ' 当前过程能力处于临界水平，建议同步改善均值偏移和短期波动。'
            : ' 当前过程能力偏低，建议优先排查设备状态、工艺参数及异常批次来源。'}
      </div>
    </div>
  );
};
