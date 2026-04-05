import React, { useState } from 'react';
import { Download, Play, CheckCircle2, Image, FileDown, Settings, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTranslation } from '../../hooks/useTranslation';
import { Dataset } from '../../store/useDataStore';
import { SettingsModal } from '../settings/SettingsModal';

interface HeaderProps {
  activeDataset?: Dataset;
  showPlot: boolean;
  chartType: 'boxplot' | 'histogram';
  setChartType: (type: 'boxplot' | 'histogram') => void;
  onRunAnalysis: () => void;
  canRunAnalysis: boolean;
  exportMenuOpen: boolean;
  setExportMenuOpen: (open: boolean) => void;
  onExportPNG: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeDataset,
  showPlot,
  chartType,
  setChartType,
  onRunAnalysis,
  canRunAnalysis,
  exportMenuOpen,
  setExportMenuOpen,
  onExportPNG,
  onExportCSV,
  onExportPDF,
}) => {
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="h-14 border-b border-linear-borderSubtle bg-linear-panel/80 flex items-center justify-between px-6 shrink-0 backdrop-blur-md z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <Button variant="badge" className={`${activeDataset ? 'text-linear-brandAccent border-linear-brandAccent/20 bg-linear-brandAccent/10' : 'text-linear-quaternary border-linear-quaternary/20 bg-linear-quaternary/10'} flex items-center gap-1 px-2 py-0.5`} disabled>
            <CheckCircle2 size={10} />
            {activeDataset ? activeDataset.name : t('app.noData')}
          </Button>

          {showPlot && (
            <div className="flex items-center bg-white/5 rounded-md border border-white/10 p-0.5">
              <button
                onClick={() => setChartType('boxplot')}
                className={`px-3 py-1 rounded text-[12px] font-linear-emphasis transition-colors ${chartType === 'boxplot' ? 'bg-linear-brand/20 text-linear-brandAccent' : 'text-linear-quaternary hover:text-white'}`}
              >
                {t('charts.boxplot')}
              </button>
              <button
                onClick={() => setChartType('histogram')}
                className={`px-3 py-1 rounded text-[12px] font-linear-emphasis transition-colors ${chartType === 'histogram' ? 'bg-linear-brand/20 text-linear-brandAccent' : 'text-linear-quaternary hover:text-white'}`}
              >
                {t('charts.histogram')}
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setSettingsOpen(true)} className="flex items-center gap-2 px-3 py-1.5 h-8 text-linear-secondary hover:text-white" title="AI Settings">
            <Settings size={14} />
          </Button>

          <div className="relative">
            <Button variant="ghost" onClick={() => setExportMenuOpen(!exportMenuOpen)} className="flex items-center gap-2 px-3 py-1.5 h-8">
              <Download size={14} />
              {t('app.export')}
            </Button>
            {exportMenuOpen && (
              <div className="absolute right-0 top-10 w-52 bg-linear-panel border border-linear-border rounded-lg shadow-2xl z-50 overflow-hidden">
                <button onClick={onExportPNG} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-linear-secondary hover:bg-white/5 hover:text-white transition-colors">
                  <Image size={14} />
                  {t('app.exportPNG')}
                </button>
                <button onClick={onExportPDF} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-linear-secondary hover:bg-white/5 hover:text-white transition-colors border-t border-linear-borderSubtle">
                  <FileText size={14} />
                  {t('app.exportPDF')}
                </button>
                <button onClick={onExportCSV} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-linear-secondary hover:bg-white/5 hover:text-white transition-colors border-t border-linear-borderSubtle">
                  <FileDown size={14} />
                  {t('app.exportCSV')}
                </button>
              </div>
            )}
          </div>

          <Button 
            variant="primary" 
            className="flex items-center gap-2 px-4 py-1.5 h-8" 
            disabled={!canRunAnalysis}
            onClick={onRunAnalysis}
          >
            <Play size={14} fill="currentColor" />
            {t('app.runAnalysis')}
          </Button>
        </div>
      </header>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};
