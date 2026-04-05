import React, { useRef, useMemo, useState, useCallback } from 'react';
import { Settings, Download, LayoutDashboard, Folders, Play, CheckCircle2, GripVertical, AlertCircle, BarChart2, Plus, X, Image, FileDown, SlidersHorizontal } from 'lucide-react';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { useDataStore, useActiveDataset } from './store/useDataStore';
import { parseFile } from './utils/fileParser';
import { calculateBoxPlotStats } from './utils/stats';
import { computeDescriptiveStats, extractNumericColumn } from './utils/descriptiveStats';
import { BoxPlot, StatsOverlayOptions } from './components/charts/BoxPlot';

const defaultOverlayOptions: StatsOverlayOptions = {
  showMean: true,
  showMedian: true,
  showMin: true,
  showMax: true,
  showQ1Q3: true,
  showOutliers: true,
};
import { Histogram } from './components/charts/Histogram';
import { StatsSummaryPanel } from './components/analysis/StatsSummaryPanel';
import { useTranslation } from './hooks/useTranslation';

type ChartType = 'boxplot' | 'histogram';

function App() {
  const { t, language, setLanguage } = useTranslation();
  const { datasets, addDataset, setActiveDataset, removeDataset, setDimensions } = useDataStore();
  const activeDataset = useActiveDataset();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [showPlot, setShowPlot] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('boxplot');
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  
  // New State for comparison and overlay options
  const [compareDatasetId, setCompareDatasetId] = useState<string | null>(null);
  const [overlayOptions, setOverlayOptions] = useState<StatsOverlayOptions>(defaultOverlayOptions);

  const rawData = useMemo(() => activeDataset?.rawData ?? [], [activeDataset]);
  const dimensions = useMemo(() => activeDataset?.dimensions ?? { xAxis: [] as string[], yAxis: '', color: null }, [activeDataset]);

  const columns = useMemo(() => {
    if (rawData.length > 0) return Object.keys(rawData[0]);
    return [];
  }, [rawData]);

  const boxPlotData = useMemo(() => {
    if (showPlot && chartType === 'boxplot' && dimensions.yAxis && rawData.length > 0) {
      return calculateBoxPlotStats(rawData, dimensions.xAxis[0] || '', dimensions.yAxis);
    }
    return [];
  }, [showPlot, chartType, dimensions, rawData]);

  const compareDataset = useMemo(() => datasets.find(d => d.id === compareDatasetId), [datasets, compareDatasetId]);
  
  const compareBoxPlotData = useMemo(() => {
    try {
      if (showPlot && chartType === 'boxplot' && dimensions.yAxis && compareDataset && compareDataset.rawData.length > 0) {
        console.log(`App: Calculating comparison stats for ${compareDataset.name} using Y-axis ${dimensions.yAxis}`);
        const stats = calculateBoxPlotStats(compareDataset.rawData, dimensions.xAxis[0] || '', dimensions.yAxis);
        console.log(`App: Comparison stats ready (${stats.length} groups)`);
        return stats;
      }
    } catch (err) {
      console.error("App: Failed to calculate compare data stats", err);
    }
    return undefined;
  }, [showPlot, chartType, dimensions, compareDataset]);

  const histogramValues = useMemo(() => {
    if (showPlot && chartType === 'histogram' && dimensions.yAxis && rawData.length > 0) {
      return extractNumericColumn(rawData, dimensions.yAxis);
    }
    return [];
  }, [showPlot, chartType, dimensions.yAxis, rawData]);

  const descriptiveStats = useMemo(() => {
    if (showPlot && dimensions.yAxis && rawData.length > 0) {
      const nums = extractNumericColumn(rawData, dimensions.yAxis);
      return computeDescriptiveStats(nums);
    }
    return null;
  }, [showPlot, dimensions.yAxis, rawData]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedData = await parseFile(file);
      let name = file.name.replace(/\.[^/.]+$/, ''); // strip extension
      
      // Basic dedup for names
      if (datasets.some(d => d.name === name)) {
        name = `${name} (${datasets.length + 1})`;
      }

      addDataset(name, parsedData);
      setShowPlot(false);
      setCompareDatasetId(null);
    } catch (error) {
      console.error("Error parsing file:", error);
      alert(t('app.errorParsing'));
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and Drop
  const handleDragStart = (col: string) => setDraggedColumn(col);

  const handleDrop = (e: React.DragEvent, target: 'x' | 'y') => {
    e.preventDefault();
    if (!draggedColumn) return;
    if (target === 'x') setDimensions({ xAxis: [draggedColumn] });
    else setDimensions({ yAxis: draggedColumn });
    setDraggedColumn(null);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const canRunAnalysis = rawData.length > 0 && !!dimensions.yAxis;

  // ─── Export handlers ─────────────────────────────────────
  const exportAsPNG = useCallback(async () => {
    const svgEl = chartContainerRef.current?.querySelector('svg');
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svgEl.clientWidth * 2; // 2x for retina
      canvas.height = svgEl.clientHeight * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#131316'; // match dark bg
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const link = document.createElement('a');
      link.download = `chart-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
    setExportMenuOpen(false);
  }, []);

  const exportAsCSV = useCallback(() => {
    if (!descriptiveStats || !dimensions.yAxis) return;
    const s = descriptiveStats;
    const csv = [
      'Statistic,Value',
      `N,${s.n}`,
      `Mean,${s.mean}`,
      `StDev,${s.stdev}`,
      `SE Mean,${s.seMean}`,
      `Min,${s.min}`,
      `Q1,${s.q1}`,
      `Median,${s.median}`,
      `Q3,${s.q3}`,
      `Max,${s.max}`,
      `Skewness,${s.skewness}`,
      `Kurtosis,${s.kurtosis}`,
      `95% CI Lower,${s.ciLower}`,
      `95% CI Upper,${s.ciUpper}`,
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.download = `stats-${dimensions.yAxis}-${Date.now()}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
    setExportMenuOpen(false);
  }, [descriptiveStats, dimensions.yAxis]);

  return (
    <div className="flex h-screen w-full bg-linear-bg text-linear-primary overflow-hidden">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".csv,.xlsx,.xls" 
        className="hidden" 
      />
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-linear-borderSubtle bg-linear-panel flex flex-col shrink-0 z-20 shadow-xl">
        {/* Header */}
        <div className="h-14 border-b border-linear-borderSubtle flex items-center px-4 shrink-0">
          <div className="w-6 h-6 rounded-md bg-linear-brand flex items-center justify-center mr-2 shadow-sm">
            <LayoutDashboard size={14} className="text-white" />
          </div>
          <span className="font-linear-semibold text-[14px]">{t('app.title')}</span>
        </div>
        
        {/* Nav */}
        <div className="p-3 flex-1 overflow-y-auto space-y-6">
          {/* ── Data Sources (multi-dataset) ── */}
          <div>
            <div className="text-[11px] font-linear-emphasis text-linear-quaternary tracking-wider uppercase mb-2 px-1 flex justify-between items-center">
              <span>{t('app.datasets')}</span>
              <Button variant="icon" onClick={handleImportClick} className="!w-5 !h-5 !rounded">
                <Plus size={12} />
              </Button>
            </div>

            {datasets.length === 0 ? (
              <Button variant="ghost" onClick={handleImportClick} className="w-full justify-start text-linear-secondary hover:text-white pb-2 flex gap-2 items-center text-left">
                <Folders size={14} />
                <span>{t('app.import')}</span>
              </Button>
            ) : (
              <div className="space-y-1">
                {datasets.map((ds) => (
                  <div
                    key={ds.id}
                    onClick={() => { setActiveDataset(ds.id); setShowPlot(false); }}
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
                        if (compareDatasetId === ds.id) setCompareDatasetId(null);
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

          {/* ── Columns ── */}
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
                    onDragStart={() => handleDragStart(col)}
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

          {/* ── Dimensions ── */}
          <div>
            <div className="text-[11px] font-linear-emphasis text-linear-quaternary tracking-wider uppercase mb-2 px-1">
              {t('app.dimensions')}
            </div>
            <div className="space-y-2">
              <Card 
                onDrop={(e) => handleDrop(e, 'x')}
                onDragOver={handleDragOver}
                className={`p-3 border-dashed hover:border-solid hover:border-linear-brand/50 cursor-pointer transition-all group shadow-none ${dimensions.xAxis.length > 0 ? 'border-linear-brand/30 bg-linear-brand/5' : 'border-white/10 bg-transparent'}`}
              >
                <div className={`text-[12px] flex items-center justify-center gap-1 font-linear-emphasis ${dimensions.xAxis.length > 0 ? 'text-linear-brandAccent' : 'text-linear-quaternary group-hover:text-linear-brandAccent'}`}>
                  {dimensions.xAxis[0] || t('app.xAxis')}
                </div>
              </Card>
              
              <Card 
                onDrop={(e) => handleDrop(e, 'y')}
                onDragOver={handleDragOver}
                className={`p-3 border-dashed hover:border-solid hover:border-linear-brand/50 cursor-pointer transition-all group shadow-none ${dimensions.yAxis ? 'border-linear-brand/30 bg-linear-brand/5' : 'border-white/10 bg-transparent'}`}
              >
                <div className={`text-[12px] flex items-center justify-center gap-1 font-linear-emphasis ${dimensions.yAxis ? 'text-linear-brandAccent' : 'text-linear-quaternary group-hover:text-linear-brandAccent'}`}>
                  {dimensions.yAxis || t('app.yAxis')}
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="p-3 border-t border-linear-borderSubtle shrink-0 flex flex-col gap-1">
          {/* Language Switcher */}
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

      {/* Main */}
      <main className="flex-1 flex flex-col relative bg-linear-bg overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-linear-borderSubtle bg-linear-panel/80 flex items-center justify-between px-6 shrink-0 backdrop-blur-md z-10 sticky top-0 relative">
          <div className="flex items-center gap-3">
            <Button variant="badge" className={`${rawData.length > 0 ? 'text-linear-brandAccent border-linear-brandAccent/20 bg-linear-brandAccent/10' : 'text-linear-quaternary border-linear-quaternary/20 bg-linear-quaternary/10'} flex items-center gap-1 px-2 py-0.5`} disabled>
              <CheckCircle2 size={10} />
              {rawData.length > 0 ? `${activeDataset?.name}` : t('app.noData')}
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
            {/* Export dropdown */}
            <div className="relative">
              <Button variant="ghost" onClick={() => setExportMenuOpen(!exportMenuOpen)} className="flex items-center gap-2 px-3 py-1.5 h-8">
                <Download size={14} />
                {t('app.export')}
              </Button>
              {exportMenuOpen && (
                <div className="absolute right-0 top-10 w-48 bg-linear-panel border border-linear-border rounded-lg shadow-2xl z-50 overflow-hidden">
                  <button onClick={exportAsPNG} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-linear-secondary hover:bg-white/5 hover:text-white transition-colors">
                    <Image size={14} />
                    {t('app.exportPNG')}
                  </button>
                  <button onClick={exportAsCSV} className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-linear-secondary hover:bg-white/5 hover:text-white transition-colors border-t border-linear-borderSubtle">
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
              onClick={() => setShowPlot(true)}
            >
              <Play size={14} fill="currentColor" />
              {t('app.runAnalysis')}
            </Button>
          </div>
        </header>

        {/* Canvas */}
        <div className="flex-1 px-8 py-6 flex flex-col overflow-y-auto relative">
          {rawData.length === 0 ? (
            /* ── Empty State ── */
            <div className="flex-1 rounded-2xl bg-linear-surface border border-linear-border shadow-linear-level2 flex items-center justify-center relative overflow-hidden">
              <div 
                className="absolute inset-0 opacity-40 mix-blend-screen" 
                style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
              />
              <div className="relative text-center space-y-5 max-w-md p-8">
                <h2 className="text-[32px] font-linear-semibold tracking-[-0.704px] text-white leading-none">{t('app.emptyTitle')}</h2>
                <p className="text-[15px] font-linear-normal text-linear-tertiary leading-relaxed tracking-tight">
                  {t('app.emptyDesc')}
                </p>
                <div className="pt-2">
                  <Button variant="primary" onClick={handleImportClick} className="shadow-lg shadow-linear-brand/20 text-[14px]">
                    {t('app.importButton')}
                  </Button>
                </div>
              </div>
            </div>
          ) : showPlot ? (
            /* ── Chart View ── */
            <div className="flex-1 rounded-2xl bg-linear-surface border border-linear-border shadow-linear-level2 flex flex-col overflow-hidden">
              
              {/* Context bar inside Chart View for BoxPlot overlays & comparisons */}
              {chartType === 'boxplot' && (
                <div className="h-12 border-b border-linear-borderSubtle bg-white/[0.02] flex items-center justify-between px-6 shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-linear-emphasis text-linear-quaternary flex items-center gap-2">
                      <SlidersHorizontal size={12} />
                      {t('charts.compareWith')}
                    </span>
                    <select 
                      className="bg-black/20 border border-white/10 rounded px-2 py-1 text-[12px] text-linear-primary font-linear-medium outline-none focus:border-linear-brand/50 transition-colors"
                      value={compareDatasetId || ''}
                      onChange={e => setCompareDatasetId(e.target.value || null)}
                    >
                      <option value="">{t('charts.none')}</option>
                      {datasets.filter(d => d.id !== activeDataset?.id).map(ds => (
                        <option key={ds.id} value={ds.id}>{ds.name} ({ds.rawData.length} {t('app.rows')})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-4 text-[12px] text-linear-secondary font-linear-medium">
                    {Object.entries(overlayOptions).map(([key, val]) => {
                      const labelKey = `charts.${key}` as any;
                      return (
                        <label key={key} className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors group">
                          <input 
                            type="checkbox" 
                            checked={val as boolean} 
                            onChange={e => setOverlayOptions({...overlayOptions, [key]: e.target.checked})}
                            className="w-3 h-3 rounded-sm border-white/20 bg-white/5 text-linear-brand focus:ring-1 focus:ring-linear-brand focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer"
                          />
                          <span className={val ? 'text-linear-primary' : 'text-linear-quaternary group-hover:text-linear-secondary'}>{t(labelKey)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div ref={chartContainerRef} className="flex-1 flex items-center justify-center p-2">
                {chartType === 'boxplot' ? (
                  <BoxPlot 
                    key={`boxplot-${activeDataset?.id}-${compareDatasetId}`}
                    data={boxPlotData} 
                    compareData={compareBoxPlotData}
                    primaryLabel={activeDataset?.name}
                    compareLabel={compareDataset?.name}
                    xAxisLabel={dimensions.xAxis[0] || ''} 
                    yAxisLabel={dimensions.yAxis} 
                    overlayOptions={overlayOptions}
                  />
                ) : chartType === 'histogram' ? (
                  <Histogram values={histogramValues} label={dimensions.yAxis} />
                ) : (
                  <p className="text-linear-quaternary text-[14px]">Drag a field to X-Axis and Y-Axis, then click Run Analysis.</p>
                )}
              </div>
              
              {descriptiveStats && (
                <div className="p-6 border-t border-linear-borderSubtle bg-white/[0.01]">
                  <StatsSummaryPanel stats={descriptiveStats} columnName={dimensions.yAxis} />
                </div>
              )}
            </div>
          ) : (
            /* ── Data Preview ── */
            <div className="flex-1 rounded-2xl bg-linear-surface border border-linear-border shadow-linear-level2 p-8 flex flex-col relative overflow-hidden">
              <div 
                className="absolute top-0 right-0 p-32 opacity-20 pointer-events-none" 
                style={{ background: 'radial-gradient(circle, var(--linear-brand) 0%, transparent 70%)', filter: 'blur(100px)' }}
              />
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-3 bg-white/5 rounded-lg border border-white/10 shadow-sm">
                  <BarChart2 size={24} className="text-linear-primary" />
                </div>
                <div>
                  <h2 className="text-[20px] font-linear-semibold text-white tracking-tight">{activeDataset?.name ?? 'Dataset'}</h2>
                  <p className="text-[14px] text-linear-tertiary">
                    {t('app.datasetDetails', { r: rawData.length, c: columns.length })}
                  </p>
                </div>
              </div>

              <div className="flex-1 bg-[#0a0a0b] rounded-lg border border-linear-borderSubtle overflow-hidden flex flex-col relative z-10 shadow-linear-level1">
                <div className="overflow-x-auto relative">
                  <table className="w-full text-left text-[13px] text-linear-secondary whitespace-nowrap">
                    <thead className="bg-[#121314] text-linear-quaternary font-linear-emphasis uppercase tracking-wider text-[11px] sticky top-0 border-b border-linear-borderSubtle z-20">
                      <tr>
                        <th className="px-4 py-3 font-medium w-16 text-center border-r border-linear-borderSubtle/50">{t('app.row')}</th>
                        {columns.map(col => (
                          <th key={col} className="px-4 py-3 font-medium border-x border-linear-borderSubtle/20">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-linear-borderSubtle/20">
                      {rawData.slice(0, 15).map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors cursor-default">
                          <td className="px-4 py-2 text-center text-linear-quaternary font-mono text-[12px] border-r border-linear-borderSubtle/50">{idx + 1}</td>
                          {columns.map(col => (
                            <td key={col} className="px-4 py-2 truncate max-w-[200px] border-x border-linear-borderSubtle/20">{String(row[col] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rawData.length > 15 && (
                    <div className="p-3 text-center border-t border-linear-borderSubtle text-[12px] text-linear-tertiary flex items-center justify-center gap-2 bg-[#0a0a0b] sticky bottom-0">
                      <AlertCircle size={14} className="opacity-70" />
                      {t('app.showingRows', { n: 15, total: rawData.length })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
