import React, { useRef, useMemo, useState, useCallback } from 'react';
import { useDataStore, useActiveDataset } from './store/useDataStore';
import { parseFile } from './utils/fileParser';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ChartView } from './components/analysis/ChartView';
import { useAnalysis } from './hooks/useAnalysis';
import { StatsOverlayOptions } from './components/charts/BoxPlot';
import { useTranslation } from './hooks/useTranslation';
import { AlertCircle, BarChart2 } from 'lucide-react';
import { Button } from './components/ui/Button';

const defaultOverlayOptions: StatsOverlayOptions = {
  showMean: true,
  showMedian: true,
  showMin: true,
  showMax: true,
  showQ1Q3: true,
  showOutliers: true,
};

type ChartType = 'boxplot' | 'histogram';

function App() {
  const { t } = useTranslation();
  const { datasets, addDataset, setDimensions } = useDataStore();
  const activeDataset = useActiveDataset();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  const [showPlot, setShowPlot] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('boxplot');
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [compareDatasetId, setCompareDatasetId] = useState<string | null>(null);
  const [overlayOptions, setOverlayOptions] = useState<StatsOverlayOptions>(defaultOverlayOptions);

  const compareDataset = useMemo(() => datasets.find(d => d.id === compareDatasetId), [datasets, compareDatasetId]);

  const {
    rawData,
    dimensions,
    columns,
    boxPlotData,
    analysisMetadata,
    compareBoxPlotData,
    histogramValues,
    descriptiveStats,
    canRunAnalysis
  } = useAnalysis({
    showPlot,
    chartType,
    activeDataset,
    compareDataset
  });

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedData = await parseFile(file);
      let name = file.name.replace(/\.[^/.]+$/, '');
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

  const handleDrop = (e: React.DragEvent, target: 'x' | 'y') => {
    e.preventDefault();
    if (!draggedColumn) return;
    if (target === 'x') setDimensions({ xAxis: [draggedColumn] });
    else setDimensions({ yAxis: draggedColumn });
    setDraggedColumn(null);
  };

  const exportAsPNG = useCallback(async () => {
    const svgEl = chartContainerRef.current?.querySelector('svg');
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svgEl.clientWidth * 2;
      canvas.height = svgEl.clientHeight * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#131316';
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
      
      <Sidebar 
        onImportClick={handleImportClick}
        onDragStart={setDraggedColumn}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        columns={columns}
        dimensions={dimensions}
        setDraggedColumn={setDraggedColumn}
      />

      <main className="flex-1 flex flex-col relative bg-linear-bg overflow-hidden min-w-0">
        <Header 
          activeDataset={activeDataset || undefined}
          showPlot={showPlot}
          chartType={chartType}
          setChartType={setChartType}
          onRunAnalysis={() => setShowPlot(true)}
          canRunAnalysis={canRunAnalysis}
          exportMenuOpen={exportMenuOpen}
          setExportMenuOpen={setExportMenuOpen}
          onExportPNG={exportAsPNG}
          onExportCSV={exportAsCSV}
        />

        <div className="flex-1 px-8 py-6 flex flex-col overflow-y-auto relative">
          {rawData.length === 0 ? (
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
          ) : (
            <div className="flex flex-col gap-6 h-full pb-10">
              {showPlot && (
                <div className="flex-none min-h-[650px] flex flex-col">
                  <ChartView 
                    chartType={chartType}
                    activeDataset={activeDataset || undefined}
                    compareDatasetId={compareDatasetId}
                    setCompareDatasetId={setCompareDatasetId}
                    datasets={datasets}
                    overlayOptions={overlayOptions}
                    setOverlayOptions={setOverlayOptions}
                    boxPlotData={boxPlotData}
                    compareBoxPlotData={compareBoxPlotData}
                    metadata={analysisMetadata}
                    histogramValues={histogramValues}
                    descriptiveStats={descriptiveStats}
                    dimensions={dimensions}
                    chartContainerRef={chartContainerRef}
                  />
                </div>
              )}
              
              <div className="flex-none rounded-2xl bg-linear-surface border border-linear-border shadow-linear-level2 p-8 flex flex-col relative overflow-hidden">
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
