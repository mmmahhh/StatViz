import React, { useState } from 'react';
import { Filter, Plus, Trash2, Check, Edit2 } from 'lucide-react';
import { useDataStore, useActiveDataset } from '../../store/useDataStore';
import { FilterOperator } from '../../types';
import { Button } from '../ui/Button';

export const DataFilterPanel: React.FC = () => {
  const activeDataset = useActiveDataset();
  const { addFilter, removeFilter, updateFilter, clearFilters } = useDataStore();
  const [isAdding, setIsAdding] = useState(false);

  // New filter state
  const [newColumn, setNewColumn] = useState('');
  const [newOperator, setNewOperator] = useState<FilterOperator>('in');
  const [newValue, setNewValue] = useState('');
  const [newAlias, setNewAlias] = useState('');

  const columns = activeDataset?.rawData.length ? Object.keys(activeDataset.rawData[0]) : [];

  if (!activeDataset) return null;

  const handleAdd = () => {
    if (!newColumn || !newValue) return;
    
    let parsedValue: string | string[] = newValue;
    if (newOperator === 'in' || newOperator === 'not_in' || newOperator === 'range') {
      parsedValue = newValue.split(',').map(s => s.trim());
    }

    addFilter(activeDataset.id, {
      id: Math.random().toString(36).substring(2, 9),
      column: newColumn,
      operator: newOperator,
      value: parsedValue,
      groupAlias: newAlias || undefined,
      enabled: true
    });
    
    setIsAdding(false);
    setNewColumn('');
    setNewValue('');
    setNewAlias('');
  };

  return (
    <div>
      <div className="text-[11px] font-linear-emphasis text-linear-quaternary tracking-wider uppercase mb-2 px-1 flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <Filter size={12} />
          <span>数据切片与聚合 (Data Slicer)</span>
        </div>
        <Button 
          variant="icon" 
          onClick={() => setIsAdding(!isAdding)} 
          className="!w-5 !h-5 !rounded"
          aria-label={isAdding ? "关闭添加面板" : "添加过滤条件"}
        >
          <Plus size={12} className={isAdding ? 'rotate-45 transition-transform' : 'transition-transform'} />
        </Button>
      </div>

      {activeDataset.filters.length > 0 && (
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => clearFilters(activeDataset.id)}
            className="w-full justify-center h-8 text-[12px] border-red-500/20 text-red-300 hover:text-white hover:bg-red-500/10"
          >
            清空当前筛选
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {activeDataset.filters.map(filter => (
          <div key={filter.id} className="bg-white/5 border border-white/10 rounded-md p-2 text-[11px] relative group">
            <div className="flex items-center gap-2 mb-1 pr-6">
              <input 
                type="checkbox" 
                checked={filter.enabled}
                onChange={(e) => updateFilter(activeDataset.id, filter.id, { enabled: e.target.checked })}
                className="w-3 h-3 rounded-sm border-white/20 bg-white/5 text-linear-brand focus:ring-2 focus:ring-linear-brand/50 cursor-pointer"
                aria-label={`启用筛选: ${filter.column}`}
              />
              <span className="font-linear-medium text-linear-brandAccent truncate">{filter.column}</span>
              <span className="text-linear-quaternary">{filter.operator}</span>
            </div>
            <div className="pl-5 text-linear-secondary truncate">
              {Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}
            </div>
            {filter.groupAlias && (
              <div className="pl-5 mt-1 text-linear-brandAccent/80 flex items-center gap-1">
                <Edit2 size={10} /> 
                <span>聚合为: {filter.groupAlias}</span>
              </div>
            )}
            <button 
              onClick={() => removeFilter(activeDataset.id, filter.id)}
              className="absolute top-2 right-2 text-linear-quaternary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:text-red-400"
              aria-label={`删除筛选: ${filter.column}`}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}

        {isAdding && (
          <div className="bg-[#1C1C1F] border border-linear-brandAccent/50 rounded-md p-2 text-[11px] space-y-2 shadow-[0_0_10px_rgba(var(--brand-accent-rgb),0.1)]" role="form" aria-label="添加新筛选">
            <div>
              <label htmlFor="new-column" className="text-linear-quaternary mb-1 block">列名 (Column)</label>
              <select 
                id="new-column"
                value={newColumn} 
                onChange={(e) => setNewColumn(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white outline-none focus:border-linear-brandAccent/50"
              >
                <option value="">选择列...</option>
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <label htmlFor="new-operator" className="text-linear-quaternary mb-1 block">条件 (Operator)</label>
                <select 
                  id="new-operator"
                  value={newOperator} 
                  onChange={(e) => setNewOperator(e.target.value as FilterOperator)}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white outline-none focus:border-linear-brandAccent/50"
                >
                  <option value="in">包含 (In)</option>
                  <option value="range">范围 (Range)</option>
                  <option value="not_in">不包含 (Not In)</option>
                  <option value="regex">正则 (Regex)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="new-value" className="text-linear-quaternary mb-1 block">值 (多个用逗号分隔)</label>
              <input 
                id="new-value"
                type="text" 
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={newOperator === 'range' ? 'min, max' : 'val1, val2'}
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white outline-none focus:border-linear-brandAccent/50"
              />
            </div>

            <div>
              <label htmlFor="new-alias" className="text-linear-quaternary mb-1 block">聚合别名 (选填, Virtual Group)</label>
              <input 
                id="new-alias"
                type="text" 
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                placeholder="例如: 大批次_Benchmark"
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-white outline-none focus:border-linear-brandAccent/50 placeholder:text-linear-quaternary/50 text-linear-brandAccent"
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button variant="primary" onClick={handleAdd} className="h-6 px-3 text-[10px] gap-1" aria-label="确认添加筛选">
                <Check size={10} /> 确定
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
