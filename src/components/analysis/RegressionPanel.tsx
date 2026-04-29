import React from 'react';
import { RegressionResult } from '../../types';

interface RegressionPanelProps {
  regression: RegressionResult;
  xLabel: string;
  yLabel: string;
}

const StatBox: React.FC<{ label: string; value: number | string; suffix?: string }> = ({ label, value, suffix = '' }) => (
  <div className="flex flex-col gap-1 p-3 bg-white/5 border border-white/10 rounded-lg">
    <span className="text-[11px] text-linear-quaternary font-linear-emphasis tracking-wider uppercase">{label}</span>
    <span className="text-[16px] text-white font-linear-bold font-mono">
      {typeof value === 'number' && isFinite(value) ? value.toFixed(4) : value} {suffix}
    </span>
  </div>
);

export const RegressionPanel: React.FC<RegressionPanelProps> = ({ regression, xLabel, yLabel }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-[14px] font-linear-semibold text-white tracking-tight">相关与回归分析 (Regression Analysis)</h3>
      </div>
      
      <div className="p-4 bg-[#1C1C1F] border border-white/10 rounded-xl mb-4">
        <div className="text-[12px] text-linear-quaternary font-linear-emphasis uppercase mb-1">回归方程式 (Regression Equation)</div>
        <div className="text-[18px] text-linear-brandAccent font-mono font-bold tracking-tight">
          {regression.equation.replace('Y', yLabel).replace('X', xLabel)}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="决定系数 (R-Sq)" value={regression.rSquared * 100} suffix="%" />
        <StatBox label="相关系数 (Pearson r)" value={regression.r} />
        <StatBox label="斜率 (Slope)" value={regression.slope} />
        <StatBox label="截距 (Intercept)" value={regression.intercept} />
      </div>

      <div className="text-[11px] text-linear-tertiary mt-2">
        样本量 (N) = {regression.n}
      </div>
    </div>
  );
};
