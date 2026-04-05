import React from 'react';
import { Plus, Folders, GripVertical, X, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useDataStore, useActiveDataset } from '../../store/useDataStore';
import { useTranslation } from '../../hooks/useTranslation';
import { DimensionConfig } from '../../types';

interface SidebarProps {
  onImportClick: () => void;
  onDragStart: (col: string) => void;
  onDrop: (e: React.DragEvent, target: 'x' | 'y') => void;
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
  const { datasets, setActiveDataset, removeDataset } = useDataStore();
  const activeDataset = useActiveDataset();

  return (
    <aside className="w-64 border-r border-linear-borderSubtle bg-linear-panel flex flex-col shrink-0 z-20 shadow-xl">
      <div className="h-14 border-b border-linear-borderSubtle flex items-center px-4 shrink-0">
        <div className="w-6 h-6 rounded-md bg-linear-brand flex items-center justify-center mr-2 shadow-sm">
          <div className="w-3 h-3 bg-white rounded-sm" />
        </div>
        <span className="font-linear-semibold text-[14px]">{t('app.title')}</span>
      </div>
      
      <div className="p-3 flex-1 overflow-y-auto space-y-6">
        <div>
          <div className="text-[11px] font-linear-emphasis text-linear-quaternary tracking-wider uppercase mb-2 px-1 flex justify-between items-center">
            <span>{t('app.datasets')}</span>
            <Button variant="icon" onClick={onImportClick} className="!w-5 !h-5 !rounded">
              <Plus size={12} />
            </Button>
          </div>

          {datasets.length === 0 ? (
            <Button variant="ghost" onClick={onImportClick} className="w-full justify-start text-linear-secondary hover:text-white pb-2 flex gap-2 items-center text-left">
              <Folders size={14} />
              <span>{t('app.import')}</span>
            </Button>
          ) : (
            <div className="space-y-1">
              {datasets.map((ds) => (
                <div
                  key={ds.id}
                  onClick={() => setActiveDataset(ds.id)}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-md text-[13px] cursor-pointer transition-all border ${
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
                    className="text-linear-quaternary hover:text-red-400 transition-colors"
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

        <div>
          <div className="text-[11px] font-linear-emphasis text-linear-quaternary tracking-wider uppercase mb-2 px-1">
            {t('app.dimensions')}
          </div>
          <div className="space-y-2">
            <Card 
              onDrop={(e) => onDrop(e, 'x')}
              onDragOver={onDragOver}
              className={`p-3 border-dashed hover:border-solid hover:border-linear-brand/50 cursor-pointer transition-all group shadow-none ${dimensions.xAxis.length > 0 ? 'border-linear-brand/30 bg-linear-brand/5' : 'border-white/10 bg-transparent'}`}
            >
              <div className={`text-[12px] flex items-center justify-center gap-1 font-linear-emphasis ${dimensions.xAxis.length > 0 ? 'text-linear-brandAccent' : 'text-linear-quaternary group-hover:text-linear-brandAccent'}`}>
                {dimensions.xAxis[0] || t('app.xAxis')}
              </div>
            </Card>
            
            <Card 
              onDrop={(e) => onDrop(e, 'y')}
              onDragOver={onDragOver}
              className={`p-3 border-dashed hover:border-solid hover:border-linear-brand/50 cursor-pointer transition-all group shadow-none ${dimensions.yAxis ? 'border-linear-brand/30 bg-linear-brand/5' : 'border-white/10 bg-transparent'}`}
            >
              <div className={`text-[12px] flex items-center justify-center gap-1 font-linear-emphasis ${dimensions.yAxis ? 'text-linear-brandAccent' : 'text-linear-quaternary group-hover:text-linear-brandAccent'}`}>
                {dimensions.yAxis || t('app.yAxis')}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-linear-borderSubtle shrink-0 flex flex-col gap-1">
        <div className="px-2 py-2 mb-1 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between">
          <span className="text-[10px] uppercase font-linear-emphasis text-linear-quaternary tracking-wide">{t('app.language')}</span>
          <div className="flex bg-black/40 p-0.5 rounded border border-white/5">
            <button 
              onClick={() => setLanguage('zh')}
              className={`px-2 py-0.5 rounded text-[10px] font-linear-medium transition-all ${language === 'zh' ? 'bg-linear-brand text-white shadow-sm' : 'text-linear-quaternary hover:text-linear-secondary'}`}
            >ZH</button>
            <button 
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded text-[10px] font-linear-medium transition-all ${language === 'en' ? 'bg-linear-brand text-white shadow-sm' : 'text-linear-quaternary hover:text-linear-secondary'}`}
            >EN</button>
          </div>
        </div>

        <Button variant="ghost" className="w-full flex justify-between items-center text-linear-tertiary hover:text-white h-9">
          <div className="flex items-center gap-2">
            <Settings size={14} />
            <span>{t('app.settings')}</span>
          </div>
          <div className="w-5 h-5 rounded shadow-linear-level2 flex items-center justify-center text-[10px] bg-white/5 border border-white/10 text-linear-quaternary">⌘</div>
        </Button>
      </div>
    </aside>
  );
};
