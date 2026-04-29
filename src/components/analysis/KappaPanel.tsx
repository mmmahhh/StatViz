import React from 'react';
import { KappaResult } from '../../types';
import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';

interface KappaPanelProps {
  data: KappaResult;
}

export const KappaPanel: React.FC<KappaPanelProps> = ({ data }) => {
  const getStatusInfo = () => {
    switch (data.isAcceptable) {
      case 'excellent': return { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: <ShieldCheck size={16} />, text: '一致性优秀 (Excellent)' };
      case 'marginal': return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: <ShieldQuestion size={16} />, text: '勉强接受 (Marginal)' };
      default: return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: <ShieldAlert size={16} />, text: '不可接受 (Unacceptable)' };
    }
  };

  const status = getStatusInfo();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-linear-semibold text-white tracking-tight">属性一致性分析 (Kappa Analysis)</h3>
        <div className={`px-3 py-1 rounded-full flex items-center gap-2 border ${status.bg} ${status.border} ${status.color}`}>
          {status.icon}
          <span className="text-[11px] font-linear-bold uppercase tracking-wider">{status.text}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1">
          <div className="text-[11px] text-linear-quaternary font-linear-emphasis uppercase">Kappa 值</div>
          <div className={`text-[20px] font-mono font-bold ${status.color}`}>{data.kappa.toFixed(4)}</div>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1">
          <div className="text-[11px] text-linear-quaternary font-linear-emphasis uppercase">实际一致率</div>
          <div className="text-[20px] text-white font-mono font-bold">{(data.observedAgreement * 100).toFixed(2)}%</div>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1">
          <div className="text-[11px] text-linear-quaternary font-linear-emphasis uppercase">P Value</div>
          <div className="text-[20px] text-white font-mono font-bold">{data.pValue < 0.001 ? '< 0.001' : data.pValue.toFixed(4)}</div>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1">
          <div className="text-[11px] text-linear-quaternary font-linear-emphasis uppercase">评估样本数</div>
          <div className="text-[20px] text-white font-mono font-bold">{data.n}</div>
        </div>
      </div>
      
      <div className="p-3 bg-linear-brand/5 border border-dashed border-linear-brand/20 rounded-lg">
        <p className="text-[11px] text-linear-tertiary leading-relaxed">
          判定准则：Kappa &gt; 0.75 认为测量系统一致性好；0.4 &lt; Kappa &lt; 0.75 勉强接受；Kappa &lt; 0.4 不可接受。
        </p>
      </div>

      <div className="p-4 rounded-xl border border-linear-brandAccent/20 bg-linear-brandAccent/5 text-[12px] text-linear-secondary leading-relaxed">
        结论建议：
        {data.isAcceptable === 'excellent'
          ? ' 评估员判定口径稳定，可以继续把这套标准用于优裂或等级判定的一致性报告。'
          : data.isAcceptable === 'marginal'
            ? ' 当前一致性仅勉强可接受，建议补充样板训练和判定边界示例。'
            : ' 当前一致性不足，建议统一判定标准、复训评估员，并重新抽样评估。'}
      </div>
    </div>
  );
};
