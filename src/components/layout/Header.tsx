import React, { useRef, useEffect } from 'react';
import { Download, Play, CheckCircle2, Image, FileDown, FileText, BookOpen } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTranslation } from '../../hooks/useTranslation';
import { Dataset } from '../../store/useDataStore';

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
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu on outside click
  useEffect(() => {
    if (!exportMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [exportMenuOpen, setExportMenuOpen]);

  return (
    <header className="h-14 border-b border-linear-borderSubtle bg-linear-panel/80 flex items-center justify-between px-6 shrink-0 backdrop-blur-md z-10 sticky top-0">
      <div className="flex items-center gap-3">
        <Button variant="badge" className={`${activeDataset ? 'text-linear-brandAccent border-linear-brandAccent/20 bg-linear-brandAccent/10' : 'text-linear-quaternary border-linear-quaternary/20 bg-linear-quaternary/10'} flex items-center gap-1 px-2 py-0.5`} disabled>
          <CheckCircle2 size={10} />
          {activeDataset ? activeDataset.name : t('app.noData')}
        </Button>

        {showPlot && activeDataset?.module !== 'capability' && (
          <div className="flex items-center bg-white/5 rounded-md border border-white/10 p-0.5" role="group" aria-label={t('charts.typeSelect')}>
            <button
              onClick={() => setChartType('boxplot')}
              className={`px-3 py-1 rounded text-[12px] font-linear-emphasis transition-colors focus:outline-none focus:ring-1 focus:ring-linear-brand/50 ${chartType === 'boxplot' ? 'bg-linear-brand/20 text-linear-brandAccent' : 'text-linear-quaternary hover:text-white'}`}
              aria-pressed={chartType === 'boxplot'}
              aria-label={t('charts.boxplot')}
            >
              {t('charts.boxplot')}
            </button>
            <button
              onClick={() => setChartType('histogram')}
              className={`px-3 py-1 rounded text-[12px] font-linear-emphasis transition-colors focus:outline-none focus:ring-1 focus:ring-linear-brand/50 ${chartType === 'histogram' ? 'bg-linear-brand/20 text-linear-brandAccent' : 'text-linear-quaternary hover:text-white'}`}
              aria-pressed={chartType === 'histogram'}
              aria-label={t('charts.histogram')}
            >
              {t('charts.histogram')}
            </button>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <a
          href="/operation-manual.html"
          target="_blank"
          rel="noreferrer"
          className="focus:outline-none focus:ring-2 focus:ring-linear-brand/50 bg-white/5 border border-white/10 text-linear-primary hover:bg-white/10 transition-colors px-3 py-1.5 rounded-md text-[13px] font-linear-emphasis shadow-sm flex items-center gap-2 h-8"
          aria-label={t('app.manual')}
        >
          <BookOpen size={14} />
          {t('app.manual')}
        </a>

        <div className="relative" ref={exportMenuRef}>
          <Button 
            variant="ghost" 
            onClick={() => setExportMenuOpen(!exportMenuOpen)} 
            className="flex items-center gap-2 px-3 py-1.5 h-8"
            aria-expanded={exportMenuOpen}
            aria-haspopup="true"
            aria-label={t('app.export')}
          >
            <Download size={14} />
            {t('app.export')}
          </Button>
          {exportMenuOpen && (
            <div className="absolute right-0 top-10 w-52 bg-linear-panel border border-linear-border rounded-lg shadow-2xl z-50 overflow-hidden" role="menu">
              <button 
                onClick={onExportPNG} 
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-linear-secondary hover:bg-white/5 hover:text-white transition-colors focus:outline-none focus:bg-white/10"
                role="menuitem"
                aria-label={t('app.exportPNG')}
              >
                <Image size={14} />
                {t('app.exportPNG')}
              </button>
              <button 
                onClick={onExportPDF} 
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-linear-secondary hover:bg-white/5 hover:text-white transition-colors border-t border-linear-borderSubtle focus:outline-none focus:bg-white/10"
                role="menuitem"
                aria-label={t('app.exportPDF')}
              >
                <FileText size={14} />
                {t('app.exportPDF')}
              </button>
              <button 
                onClick={onExportCSV} 
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-linear-secondary hover:bg-white/5 hover:text-white transition-colors border-t border-linear-borderSubtle focus:outline-none focus:bg-white/10"
                role="menuitem"
                aria-label={t('app.exportCSV')}
              >
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
          aria-label={t('app.runAnalysis')}
        >
          <Play size={14} fill="currentColor" />
          {t('app.runAnalysis')}
        </Button>
      </div>
    </header>
  );
};
