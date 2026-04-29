import React from 'react';
import { HypothesisResult } from '../../types';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface HypothesisPanelProps {
  data: HypothesisResult;
  xLabel: string;
  yLabel: string;
}

export const HypothesisPanel: React.FC<HypothesisPanelProps> = ({ data, xLabel, yLabel }) => {
  const isSignificant = data.significant;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-linear-semibold text-white tracking-tight">假设检验 (Hypothesis Testing) - {yLabel} by {xLabel}</h3>
        <div className={`px-3 py-1 rounded-full flex items-center gap-2 border ${
          isSignificant 
            ? 'bg-red-500/10 border-red-500/30 text-red-400' 
            : 'bg-green-500/10 border-green-500/30 text-green-400'
        }`}>
          {isSignificant ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
          <span className="text-[11px] font-linear-bold uppercase tracking-wider">
            {isSignificant ? '差异显著 (Significant)' : '无显著差异 (Not Significant)'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1">
          <div className="text-[11px] text-linear-quaternary font-linear-emphasis uppercase">方法 (Method)</div>
          <div className="text-[16px] text-white font-linear-bold">{data.method}</div>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1">
          <div className="text-[11px] text-linear-quaternary font-linear-emphasis uppercase">P 值 (P-Value)</div>
          <div className={`text-[18px] font-mono font-bold ${isSignificant ? 'text-red-400' : 'text-green-400'}`}>
            {data.pValue < 0.001 ? '< 0.001' : data.pValue.toFixed(4)}
          </div>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1">
          <div className="text-[11px] text-linear-quaternary font-linear-emphasis uppercase">统计量 ({data.method === 't-Test' ? 't' : 'F'})</div>
          <div className="text-[16px] text-white font-mono font-bold">{data.statistic.toFixed(3)}</div>
        </div>
      </div>

      <div className="bg-[#0a0a0b] rounded-lg border border-linear-borderSubtle overflow-hidden">
        <table className="w-full text-left text-[12px] text-linear-secondary">
          <thead className="bg-[#121314] text-linear-quaternary font-linear-emphasis uppercase tracking-wider text-[10px] border-b border-linear-borderSubtle">
            <tr>
              <th className="px-4 py-2 font-medium">{xLabel} 组别</th>
              <th className="px-4 py-2 font-medium">样本量 (N)</th>
              <th className="px-4 py-2 font-medium">均值 (Mean)</th>
              <th className="px-4 py-2 font-medium">标准差 (StDev)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linear-borderSubtle/20">
            {data.groupStats.map((gs, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-2 text-white font-linear-medium">{gs.name}</td>
                <td className="px-4 py-2 font-mono">{gs.n}</td>
                <td className="px-4 py-2 font-mono">{gs.mean.toFixed(4)}</td>
                <td className="px-4 py-2 font-mono">{gs.stdev.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-linear-brand/5 border border-dashed border-linear-brand/20 rounded-lg">
        <p className="text-[11px] text-linear-tertiary leading-relaxed">
          结论：基于 $\alpha = {data.alpha}$ 的显著性水平，{isSignificant 
            ? `由于 P 值小于显著性水平，我们拒绝原假设。有足够的证据表明不同 ${xLabel} 之间的 ${yLabel} 均值存在显著差异。` 
            : `由于 P 值大于显著性水平，我们无法拒绝原假设。没有足够的证据表明不同 ${xLabel} 之间的 ${yLabel} 均值存在显著差异。`}
        </p>
      </div>
    </div>
  );
};
