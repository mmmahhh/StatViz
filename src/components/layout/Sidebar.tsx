import React from 'react';
import { Plus, Folders, GripVertical, X, ActivitySquare } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useDataStore, useActiveDataset } from '../../store/useDataStore';
import { useTranslation } from '../../hooks/useTranslation';
import { DimensionConfig, AnalysisModule, GroupBuilderField, GroupTransform } from '../../types';
import { DataFilterPanel } from './DataFilterPanel';

interface SidebarProps {
  onImportClick: () => void;
  onDragStart: (col: string) => void;
  onDrop: (e: React.DragEvent, target: 'x' | 'y' | 'x2') => void;
  onDragOver: (e: React.DragEvent) => void;
  columns: string[];
  dimensions: DimensionConfig;
  setDraggedColumn: (col: string | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onImportClick,
  onDragStart,
  onDrop,
  onDragOver,
  columns,
  dimensions,
  setDraggedColumn,
}) => {
  const { t, language, setLanguage } = useTranslation();
  const { datasets, setActiveDataset, removeDataset, setModule, setCapabilityConfig, setGroupBuilder, setDimensions } = useDataStore();
  const activeDataset = useActiveDataset();
  const groupBuilderEnabled = !!activeDataset?.groupBuilder.enabled;

  const updateGroupField = (index: number, patch: Partial<GroupBuilderField>) => {
    if (!activeDataset) return;
    const nextFields = activeDataset.groupBuilder.fields.map((field, fieldIndex) =>
      fieldIndex === index ? { ...field, ...patch } : field
    );
    setGroupBuilder(activeDataset.id, { fields: nextFields });
  };

  const handleDimensionSelect = (target: 'x' | 'x2' | 'y', value: string) => {
    if (target === 'y') {
      setDimensions({ yAxis: value });
      return;
    }
    const currentX = [...dimensions.xAxis];
    currentX[target === 'x' ? 0 : 1] = value;
    setDimensions({ xAxis: currentX });
  };

  return (
    <aside className="w-64 border-r border-linear-borderSubtle bg-linear-panel flex flex-col shrink-0 z-20 shadow-xl">
      <div className="h-14 border-b border-linear-borderSubtle flex items-center px-4 shrink-0">
        <div className="w-6 h-6 rounded-md bg-linear-brand flex items-center justify-center mr-2 shadow-sm">
          <div className="w-3 h-3 bg-white rounded-sm" />
        </div>
        <span className="font-linear-semibold text-[14px]">{t('app.title')}</span>
      </div>
      
      <div className="p-3 flex-1 overflow-y-auto space-y-6">
        {activeDataset && (
          <div>
            <div className="text-[11px] font-linear-emphasis text-linear-quaternary tracking-wider uppercase mb-2 px-1 flex items-center gap-1">
              <ActivitySquare size={12} />
              <span>分析模块</span>
            </div>
            <select 
              className="w-full bg-black/20 border border-white/10 rounded-md px-2 py-1.5 text-[13px] text-linear-primary font-linear-medium outline-none focus:border-linear-brand/50 transition-colors"
              value={activeDataset.module}
              onChange={(e) => setModule(e.target.value as AnalysisModule)}
            >
              <option value="basic">基础统计 (Basic Stats)</option>
              <option value="capability">能力分析 (Capability)</option>
              <option value="regression">相关与回归 (Regression)</option>
              <option value="hypothesis">假设检验 (Hypothesis)</option>
              <option value="msa">MSA - 计量型 (Gage R&R)</option>
              <option value="msa-kappa">MSA - 计数型 (Kappa)</option>
              <option value="msa-linearity">MSA - 线性与偏移 (Linearity)</option>
            </select>
          </div>
        )}

        <div>
          <div className="text-[11px] font-linear-emphasis text-linear-quaternary tracking-wider uppercase mb-2 px-1 flex justify-between items-center">
            <span>{t('app.datasets')}</span>
            <Button 
              variant="icon" 
              onClick={onImportClick} 
              className="!w-5 !h-5 !rounded"
              aria-label="导入数据集"
            >
              <Plus size={12} />
            </Button>
          </div>


          {datasets.length === 0 ? (
            <Button 
              variant="ghost" 
              onClick={onImportClick} 
              className="w-full justify-start text-linear-secondary hover:text-white pb-2 flex gap-2 items-center text-left"
              aria-label={t('app.import')}
            >
              <Folders size={14} />
              <span>{t('app.import')}</span>
            </Button>
          ) : (
            <div className="space-y-1" role="listbox" aria-label={t('app.datasets')}>
              {datasets.map((ds) => (
                <div
                  key={ds.id}
                  onClick={() => setActiveDataset(ds.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveDataset(ds.id);
                    }
                  }}
                  tabIndex={0}
                  role="option"
                  aria-selected={activeDataset?.id === ds.id}
                  aria-label={`${ds.name}, ${ds.rawData.length} rows`}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-md text-[13px] cursor-pointer transition-all border outline-none focus:ring-1 focus:ring-linear-brand/50 ${
                    activeDataset?.id === ds.id
                      ? 'bg-linear-brand/10 border-linear-brand/30 text-white'
                      : 'border-transparent hover:bg-white/5 text-linear-secondary hover:text-white'
                  }`}
                >
                  <span className="truncate flex-1">{ds.name}</span>
                  <span className="text-[10px] text-linear-quaternary mr-1">{ds.rawData.length}r</span>
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      removeDataset(ds.id); 
                    }}
                    className="text-linear-quaternary hover:text-red-400 transition-colors focus:outline-none focus:text-red-400"
                    aria-label={`Remove dataset ${ds.name}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {columns.length > 0 && (
          <div>
            <div className="text-[11px] font-linear-emphasis text-linear-quaternary tracking-wider uppercase mb-2 px-1 flex justify-between items-center">
              <span>{t('app.columns')}</span>
              <span className="text-linear-tertiary">{columns.length}</span>
            </div>
            <div className="space-y-1">
              {columns.map(col => (
                <div 
                  key={col} 
                  draggable
                  onDragStart={() => onDragStart(col)}
                  onDragEnd={() => setDraggedColumn(null)}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 rounded-md text-[13px] text-linear-primary cursor-grab active:cursor-grabbing border border-transparent hover:border-linear-borderSubtle transition-all"
                >
                  <GripVertical size={12} className="text-linear-quaternary" />
                  <span className="truncate">{col}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <DataFilterPanel />

        <div>
          <div className="text-[11px] font-linear-emphasis text-linear-quaternary tracking-wider uppercase mb-2 px-1">
            {t('app.dimensions')}
          </div>
          <div className="space-y-2">
            {activeDataset && (
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                <div className="text-[11px] text-linear-secondary font-linear-medium">快速选择字段</div>
                {activeDataset.module?.startsWith('msa') && activeDataset.module !== 'msa-linearity' ? (
                  <>
                    <select
                      value={dimensions.xAxis[0] || ''}
                      onChange={(e) => handleDimensionSelect('x', e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white outline-none text-[12px]"
                    >
                      <option value="">选择零件列...</option>
                      {columns.map((column) => <option key={column} value={column}>{column}</option>)}
                    </select>
                    <select
                      value={dimensions.xAxis[1] || ''}
                      onChange={(e) => handleDimensionSelect('x2', e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white outline-none text-[12px]"
                    >
                      <option value="">选择人员列...</option>
                      {columns.map((column) => <option key={column} value={column}>{column}</option>)}
                    </select>
                  </>
                ) : !groupBuilderEnabled && (
                  <select
                    value={dimensions.xAxis[0] || ''}
                    onChange={(e) => handleDimensionSelect('x', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white outline-none text-[12px]"
                  >
                    <option value="">选择分组列...</option>
                    {columns.map((column) => <option key={column} value={column}>{column}</option>)}
                  </select>
                )}
                <select
                  value={dimensions.yAxis || ''}
                  onChange={(e) => handleDimensionSelect('y', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white outline-none text-[12px]"
                >
                  <option value="">选择数值列...</option>
                  {columns.map((column) => <option key={column} value={column}>{column}</option>)}
                </select>
              </div>
            )}
            {activeDataset?.module?.startsWith('msa') && activeDataset.module !== 'msa-linearity' ? (
              <>
                <Card 
                  onDrop={(e) => onDrop(e, 'x')}
                  onDragOver={onDragOver}
                  className={`p-3 border-dashed hover:border-solid hover:border-linear-brand/50 cursor-pointer transition-all group shadow-none ${dimensions.xAxis.length > 0 ? 'border-linear-brand/30 bg-linear-brand/5' : 'border-white/10 bg-transparent'}`}
                >
                  <div className={`text-[12px] flex items-center justify-center gap-1 font-linear-emphasis ${dimensions.xAxis[0] ? 'text-linear-brandAccent' : 'text-linear-quaternary group-hover:text-linear-brandAccent'}`}>
                    {dimensions.xAxis[0] || '拖入零件 (Part)'}
                  </div>
                </Card>
                <Card 
                  onDrop={(e) => onDrop(e, 'x2')}
                  onDragOver={onDragOver}
                  className={`p-3 border-dashed hover:border-solid hover:border-linear-brand/50 cursor-pointer transition-all group shadow-none ${dimensions.xAxis.length > 1 ? 'border-linear-brand/30 bg-linear-brand/5' : 'border-white/10 bg-transparent'}`}
                >
                  <div className={`text-[12px] flex items-center justify-center gap-1 font-linear-emphasis ${dimensions.xAxis[1] ? 'text-linear-brandAccent' : 'text-linear-quaternary group-hover:text-linear-brandAccent'}`}>
                    {dimensions.xAxis[1] || '拖入人员 (Operator)'}
                  </div>
                </Card>
              </>
            ) : (
              <Card 
                onDrop={(e) => onDrop(e, 'x')}
                onDragOver={onDragOver}
                className={`p-3 border-dashed hover:border-solid hover:border-linear-brand/50 cursor-pointer transition-all group shadow-none ${dimensions.xAxis.length > 0 ? 'border-linear-brand/30 bg-linear-brand/5' : 'border-white/10 bg-transparent'}`}
              >
                <div className={`text-[12px] flex items-center justify-center gap-1 font-linear-emphasis ${dimensions.xAxis.length > 0 ? 'text-linear-brandAccent' : 'text-linear-quaternary group-hover:text-linear-brandAccent'}`}>
                  {activeDataset?.module === 'basic' && groupBuilderEnabled
                    ? '自动生成组合分组'
                    : dimensions.xAxis[0] || (activeDataset?.module === 'msa-linearity' ? '拖入参考值 (Reference)' : t('app.xAxis'))}
                </div>
              </Card>
            )}
            
            <Card 
              onDrop={(e) => onDrop(e, 'y')}
              onDragOver={onDragOver}
              className={`p-3 border-dashed hover:border-solid hover:border-linear-brand/50 cursor-pointer transition-all group shadow-none ${dimensions.yAxis ? 'border-linear-brand/30 bg-linear-brand/5' : 'border-white/10 bg-transparent'}`}
            >
              <div className={`text-[12px] flex items-center justify-center gap-1 font-linear-emphasis ${dimensions.yAxis ? 'text-linear-brandAccent' : 'text-linear-quaternary group-hover:text-linear-brandAccent'}`}>
                {dimensions.yAxis || (activeDataset?.module?.startsWith('msa') && activeDataset.module !== 'msa-linearity' ? '拖入测量值 (Response)' : activeDataset?.module === 'msa-linearity' ? '拖入测量值 (Measured)' : t('app.yAxis'))}
              </div>
            </Card>
          </div>
          {activeDataset?.module === 'basic' && (
            <div className="text-[10px] leading-relaxed text-linear-tertiary px-1 pt-1">
              现在可以直接在上方下拉选择字段，拖拽仅作为备用方式。
            </div>
          )}
        </div>

        {activeDataset?.module === 'basic' && (
          <div>
            <div className="text-[11px] font-linear-emphasis text-linear-quaternary tracking-wider uppercase mb-2 px-1">
              分组构造器 (Group Builder)
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-3">
              <label className="flex items-center justify-between gap-3 text-[12px] text-linear-secondary">
                <span>启用自定义组合分组</span>
                <input
                  type="checkbox"
                  checked={groupBuilderEnabled}
                  onChange={(e) => activeDataset && setGroupBuilder(activeDataset.id, { enabled: e.target.checked })}
                  className="w-4 h-4 rounded-sm border-white/20 bg-white/5 text-linear-brand focus:ring-0 cursor-pointer"
                />
              </label>

              {groupBuilderEnabled && (
                <div className="space-y-2">
                  {activeDataset.groupBuilder.fields.map((field, index) => (
                    <div key={index} className="rounded-lg border border-white/10 bg-black/30 p-2 space-y-2">
                      <div className="text-[11px] text-linear-secondary">分组字段 {index + 1}</div>
                      <select
                        value={field.column}
                        onChange={(e) => updateGroupField(index, { column: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white outline-none text-[12px]"
                      >
                        <option value="">不使用</option>
                        {columns.map((column) => <option key={column} value={column}>{column}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={field.transform}
                          onChange={(e) => updateGroupField(index, { transform: e.target.value as GroupTransform })}
                          className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white outline-none text-[12px]"
                        >
                          <option value="original">原值</option>
                          <option value="day">按日</option>
                          <option value="week">按周</option>
                          <option value="month">按月</option>
                        </select>
                        <input
                          type="text"
                          value={field.prefix}
                          onChange={(e) => updateGroupField(index, { prefix: e.target.value })}
                          placeholder="前缀，可选"
                          className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white outline-none text-[12px]"
                        />
                      </div>
                    </div>
                  ))}

                  <input
                    type="text"
                    value={activeDataset.groupBuilder.separator}
                    onChange={(e) => activeDataset && setGroupBuilder(activeDataset.id, { separator: e.target.value })}
                    placeholder="字段连接符，如 - / 空格"
                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white outline-none text-[12px]"
                  />

                  <div className="text-[10px] leading-relaxed text-linear-tertiary">
                    你可以自由组合 1 到 3 个分组字段，比如“日期按月 + 点位原值”或“规格原值 + 批次原值 + 点位原值”。
                  </div>
                  <div className="text-[10px] leading-relaxed text-linear-tertiary">
                    如果只是做最普通的分组比较，也可以直接在上方“快速选择字段”里选一个分组列，不用开启这里。
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeDataset?.module === 'capability' && (
          <div>
            <div className="text-[11px] font-linear-emphasis text-linear-quaternary tracking-wider uppercase mb-2 px-1">
              规范界限 (Spec Limits)
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-linear-secondary w-8 text-right">USL</span>
                <input 
                  type="number" 
                  value={activeDataset.capabilityConfig.usl ?? ''}
                  onChange={e => setCapabilityConfig({ usl: e.target.value ? Number(e.target.value) : null })}
                  className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[12px] text-linear-primary outline-none focus:border-linear-brand/50"
                  placeholder="上限"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-linear-secondary w-8 text-right">Target</span>
                <input 
                  type="number" 
                  value={activeDataset.capabilityConfig.target ?? ''}
                  onChange={e => setCapabilityConfig({ target: e.target.value ? Number(e.target.value) : null })}
                  className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[12px] text-linear-primary outline-none focus:border-linear-brand/50"
                  placeholder="目标值"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-linear-secondary w-8 text-right">LSL</span>
                <input 
                  type="number" 
                  value={activeDataset.capabilityConfig.lsl ?? ''}
                  onChange={e => setCapabilityConfig({ lsl: e.target.value ? Number(e.target.value) : null })}
                  className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[12px] text-linear-primary outline-none focus:border-linear-brand/50"
                  placeholder="下限"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-linear-borderSubtle shrink-0 flex flex-col gap-1">
        <div className="px-2 py-2 mb-1 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between">
          <span className="text-[10px] uppercase font-linear-emphasis text-linear-quaternary tracking-wide">{t('app.language')}</span>
          <div className="flex bg-black/40 p-0.5 rounded border border-white/5" role="group" aria-label={t('app.language')}>
            <button 
              onClick={() => setLanguage('zh')}
              className={`px-2 py-0.5 rounded text-[10px] font-linear-medium transition-all focus:outline-none focus:ring-1 focus:ring-linear-brand/50 ${language === 'zh' ? 'bg-linear-brand text-white shadow-sm' : 'text-linear-quaternary hover:text-linear-secondary'}`}
              aria-pressed={language === 'zh'}
              aria-label="中文"
            >ZH</button>
            <button 
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded text-[10px] font-linear-medium transition-all focus:outline-none focus:ring-1 focus:ring-linear-brand/50 ${language === 'en' ? 'bg-linear-brand text-white shadow-sm' : 'text-linear-quaternary hover:text-linear-secondary'}`}
              aria-pressed={language === 'en'}
              aria-label="English"
            >EN</button>
          </div>
        </div>

      </div>
    </aside>
  );
};
