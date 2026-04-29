import React from 'react';
import { MSAResult } from '../../types';
import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';

interface MSAPanelProps {
  data: MSAResult;
  partLabel: string;
  operatorLabel: string;
  measureLabel: string;
}

export const MSAPanel: React.FC<MSAPanelProps> = ({ data, measureLabel }) => {
  const getStatusInfo = () => {
    switch (data.isAcceptable) {
      case 'excellent':
        return { 
          color: 'text-green-400', 
          bg: 'bg-green-500/10', 
          border: 'border-green-500/30', 
          icon: <ShieldCheck size={16} />, 
          text: '系统可接受 (Acceptable)' 
        };
      case 'marginal':
        return { 
          color: 'text-amber-400', 
          bg: 'bg-amber-500/10', 
          border: 'border-amber-500/30', 
          icon: <ShieldQuestion size={16} />, 
          text: '勉强可接受 (Marginal)' 
        };
      default:
        return { 
          color: 'text-red-400', 
          bg: 'bg-red-500/10', 
          border: 'border-red-500/30', 
          icon: <ShieldAlert size={16} />, 
          text: '不可接受 (Unacceptable)' 
        };
    }
  };

  const status = getStatusInfo();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-linear-semibold text-white tracking-tight">量具 R&R 分析 (Gage R&R ANOVA) - {measureLabel}</h3>
        <div className={`px-3 py-1 rounded-full flex items-center gap-2 border ${status.bg} ${status.border} ${status.color}`}>
          {status.icon}
          <span className="text-[11px] font-linear-bold uppercase tracking-wider">{status.text}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Variance Components Table */}
        <div className="space-y-2">
          <div className="text-[12px] font-linear-emphasis text-linear-brandAccent px-1">方差分量 (Variance Components)</div>
          <div className="bg-[#0a0a0b] rounded-lg border border-linear-borderSubtle overflow-hidden">
            <table className="w-full text-left text-[12px] text-linear-secondary">
              <thead className="bg-[#121314] text-linear-quaternary font-linear-emphasis uppercase tracking-wider text-[10px] border-b border-linear-borderSubtle">
                <tr>
                  <th className="px-4 py-2 font-medium w-1/3">来源 (Source)</th>
                  <th className="px-4 py-2 font-medium">方差分量 (VarComp)</th>
                  <th className="px-4 py-2 font-medium">贡献率 (%Contribution)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linear-borderSubtle/20">
                {data.varComponents.map((vc, idx) => (
                  <tr key={idx} className={`hover:bg-white/[0.02] transition-colors ${vc.source.includes('Total') ? 'bg-white/[0.03]' : ''}`}>
                    <td className={`px-4 py-2 ${vc.source.startsWith('  ') ? 'pl-8' : vc.source.startsWith('    ') ? 'pl-12' : 'text-white font-linear-medium'}`}>
                      {vc.source.trim()}
                    </td>
                    <td className="px-4 py-2 font-mono">{vc.varComp.toFixed(6)}</td>
                    <td className="px-4 py-2 font-mono">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-linear-brand" style={{ width: `${vc.contribution}%` }} />
                        </div>
                        <span className="w-12 text-right">{vc.contribution.toFixed(2)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gage Evaluation Table */}
        <div className="space-y-2">
          <div className="text-[12px] font-linear-emphasis text-linear-brandAccent px-1">量具评估 (Gage Evaluation)</div>
          <div className="bg-[#0a0a0b] rounded-lg border border-linear-borderSubtle overflow-hidden">
            <table className="w-full text-left text-[12px] text-linear-secondary">
              <thead className="bg-[#121314] text-linear-quaternary font-linear-emphasis uppercase tracking-wider text-[10px] border-b border-linear-borderSubtle">
                <tr>
                  <th className="px-4 py-2 font-medium w-1/3">来源 (Source)</th>
                  <th className="px-4 py-2 font-medium">标准差 (StdDev)</th>
                  <th className="px-4 py-2 font-medium">研究变异 (6 * SD)</th>
                  <th className="px-4 py-2 font-medium">研究变异百分比 (%StudyVar)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linear-borderSubtle/20">
                {data.gageEvaluation.map((ge, idx) => (
                  <tr key={idx} className={`hover:bg-white/[0.02] transition-colors ${ge.source.includes('Total') ? 'bg-white/[0.03]' : ''}`}>
                    <td className={`px-4 py-2 ${ge.source.startsWith('  ') ? 'pl-8' : ge.source.startsWith('    ') ? 'pl-12' : 'text-white font-linear-medium'}`}>
                      {ge.source.trim()}
                    </td>
                    <td className="px-4 py-2 font-mono">{ge.stdDev.toFixed(5)}</td>
                    <td className="px-4 py-2 font-mono">{ge.studyVar.toFixed(5)}</td>
                    <td className="px-4 py-2 font-mono">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${ge.source.includes('GRR') ? (data.isAcceptable === 'excellent' ? 'bg-green-500' : data.isAcceptable === 'marginal' ? 'bg-amber-500' : 'bg-red-500') : 'bg-linear-brand'}`} style={{ width: `${ge.percentStudyVar}%` }} />
                        </div>
                        <span className="w-12 text-right">{ge.percentStudyVar.toFixed(2)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/[0.04]">
        <div className="p-4 bg-linear-brand/5 border border-linear-brand/20 rounded-xl flex items-center justify-between">
          <div className="text-[12px] font-linear-emphasis text-linear-primary uppercase">可区分类别数 (ndc)</div>
          <div className={`text-[24px] font-mono font-bold ${data.ndc >= 5 ? 'text-green-400' : 'text-red-400'}`}>
            {data.ndc}
          </div>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-[11px] text-linear-tertiary leading-relaxed">
          判定准则：<br/>
          • %StudyVar &lt; 10%: 优秀；10%-30%: 勉强接受；&gt; 30%: 必须改进。<br/>
          • ndc 必须 &ge; 5 测量系统才能有效区分部件。
        </div>
      </div>

      <div className="p-4 rounded-xl border border-linear-brandAccent/20 bg-linear-brandAccent/5 text-[12px] text-linear-secondary leading-relaxed">
        结论建议：
        {data.isAcceptable === 'excellent'
          ? ' 当前量具重复性与再现性表现较好，可继续用于正式产品一致性分析。'
          : data.isAcceptable === 'marginal'
            ? ' 当前量具系统可用但风险偏高，建议复核操作员差异和夹具/定位一致性。'
            : ' 当前量具系统不可接受，建议先做校准、作业标准统一和样件重复测量后，再重新执行 MSA。'}
      </div>
    </div>
  );
};
