import React from 'react';
import { LinearityBiasResult } from '../../types';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface LinearityBiasPanelProps {
  data: LinearityBiasResult;
}

export const LinearityBiasPanel: React.FC<LinearityBiasPanelProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-linear-semibold text-white tracking-tight">线性与偏移分析 (Linearity & Bias)</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1">
          <div className="text-[11px] text-linear-quaternary font-linear-emphasis uppercase">线性可接受性</div>
          <div className={`text-[14px] font-bold flex items-center gap-1 ${data.isLinearityAcceptable ? 'text-green-400' : 'text-red-400'}`}>
            {data.isLinearityAcceptable ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
            {data.isLinearityAcceptable ? '可接受' : '不可接受'}
          </div>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1">
          <div className="text-[11px] text-linear-quaternary font-linear-emphasis uppercase">偏移可接受性</div>
          <div className={`text-[14px] font-bold flex items-center gap-1 ${data.isBiasAcceptable ? 'text-green-400' : 'text-red-400'}`}>
            {data.isBiasAcceptable ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
            {data.isBiasAcceptable ? '可接受' : '不可接受'}
          </div>
        </div>
        <div className="p-4 bg-[#1C1C1F] border border-white/10 rounded-xl col-span-2 flex flex-col justify-center">
          <div className="text-[11px] text-linear-quaternary font-linear-emphasis uppercase mb-1">回归方程式 (Bias Equation)</div>
          <div className="text-[16px] text-linear-brandAccent font-mono font-bold tracking-tight">
            {data.equation}
          </div>
        </div>
      </div>
      
      <div className="bg-[#0a0a0b] rounded-lg border border-linear-borderSubtle overflow-hidden mt-4">
        <table className="w-full text-left text-[12px] text-linear-secondary">
          <thead className="bg-[#121314] text-linear-quaternary font-linear-emphasis uppercase tracking-wider text-[10px] border-b border-linear-borderSubtle">
            <tr>
              <th className="px-4 py-2 font-medium">基准值 (Reference)</th>
              <th className="px-4 py-2 font-medium">平均偏移 (Mean Bias)</th>
              <th className="px-4 py-2 font-medium">P-Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linear-borderSubtle/20">
            {data.biasStats.map((bs, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-2 text-white font-linear-medium">{bs.refValue}</td>
                <td className="px-4 py-2 font-mono">{bs.meanBias.toFixed(4)}</td>
                <td className="px-4 py-2 font-mono">{bs.pValue.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 rounded-xl border border-linear-brandAccent/20 bg-linear-brandAccent/5 text-[12px] text-linear-secondary leading-relaxed">
        结论建议：
        {data.isLinearityAcceptable && data.isBiasAcceptable
          ? ' 当前量具在线性与偏移两方面均可接受，适合继续用于该量程内的正式分析。'
          : ' 当前量具在量程内存在趋势性误差或固定偏移，建议先校准后再出正式报告，尤其要关注高低端参考值。'}
      </div>
    </div>
  );
};
