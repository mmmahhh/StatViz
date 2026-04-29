import React, { useRef, useMemo, useState, useCallback } from 'react';
import { useDataStore, useActiveDataset } from './store/useDataStore';
import { parseFile } from './utils/fileParser';
import { FileParsingError, FileTooLargeError } from './utils/fileParsingErrors';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ChartView } from './components/analysis/ChartView';
import { ReportSummaryPanel } from './components/analysis/ReportSummaryPanel';
import { useAnalysis } from './hooks/useAnalysis';
import { StatsOverlayOptions } from './components/charts/BoxPlot';
import { useTranslation } from './hooks/useTranslation';
import { BarChart2 } from 'lucide-react';
import { Button } from './components/ui/Button';
import { VirtualTable } from './components/ui/VirtualTable';
import { exportElementToPDF } from './utils/pdfGenerator';

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
  const [isExporting, setIsExporting] = useState(false);

  const mainScrollRef = useRef<HTMLDivElement>(null);
  const reportContainerRef = useRef<HTMLDivElement>(null);
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
    capabilityStats,
    capabilityConfig,
    regressionData,
    hypothesisData,
    msaData,
    kappaData,
    linearityData,
    module,
    effectiveXAxisLabel,
    canRunAnalysis
  } = useAnalysis({
    showPlot,
    activeDataset,
    compareDataset
  });

  const handleRunAnalysis = useCallback(() => {
    setShowPlot(true);
    if (mainScrollRef.current) {
      try {
        mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        mainScrollRef.current.scrollTop = 0;
      }
    }
  }, []);

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
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error("Error parsing file:", error);
      }
      
      // Show user-friendly error message based on error type
      if (error instanceof FileTooLargeError) {
        alert(error.message);
      } else if (error instanceof FileParsingError) {
        alert(error.message);
      } else {
        alert(t('app.errorParsing'));
      }
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent, target: 'x' | 'y' | 'x2') => {
    e.preventDefault();
    if (!draggedColumn) return;
    if (target === 'x') {
      const currentX = [...dimensions.xAxis];
      currentX[0] = draggedColumn;
      setDimensions({ xAxis: currentX });
    } else if (target === 'x2') {
      const currentX = [...dimensions.xAxis];
      currentX[1] = draggedColumn;
      setDimensions({ xAxis: currentX });
    } else {
      setDimensions({ yAxis: draggedColumn });
    }
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
    img.onerror = () => {
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
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `stats-${dimensions.yAxis}-${Date.now()}.csv`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  }, [descriptiveStats, dimensions.yAxis]);

  const exportAsPDF = useCallback(async () => {
    if (!reportContainerRef.current) return;
    setExportMenuOpen(false);
    setIsExporting(true);

    const reportName = activeDataset?.name 
      ? activeDataset.name.replace(/[^\w\u4e00-\u9fa5-]+/g, '_') 
      : 'statviz';

    // Wait two animation frames for React to flush state + DOM to paint fully
    requestAnimationFrame(() => {
      requestAnimationFrame(async () => {
        try {
          await exportElementToPDF(reportContainerRef.current!, {
            filename: `${reportName}-${module}-report`,
            backgroundColor: '#131316',
            scale: 2
          });
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          alert(`PDF export failed: ${message}`);
        } finally {
          setIsExporting(false);
        }
      });
    });
  }, [activeDataset?.name, module]);

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
          onRunAnalysis={handleRunAnalysis}
          canRunAnalysis={canRunAnalysis}
          exportMenuOpen={exportMenuOpen}
          setExportMenuOpen={setExportMenuOpen}
          onExportPNG={exportAsPNG}
          onExportCSV={exportAsCSV}
          onExportPDF={exportAsPDF}
        />

        <div className="flex-1 px-8 py-6 flex flex-col overflow-y-auto relative" ref={mainScrollRef}>
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
            <div className="flex flex-col gap-6 min-h-full pb-10" ref={reportContainerRef}>
              {showPlot && (
                <div className="flex-none min-h-[650px] flex flex-col animate-in fade-in slide-in-from-top-4 duration-500">
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
                    histogramValues={histogramValues}
                    descriptiveStats={descriptiveStats}
                    capabilityStats={capabilityStats}
                    capabilityConfig={capabilityConfig}
                    regressionData={regressionData}
                    hypothesisData={hypothesisData}
                    msaData={msaData}
                    kappaData={kappaData}
                    linearityData={linearityData}
                    module={module}
                    dimensions={dimensions}
                    xAxisLabel={effectiveXAxisLabel}
                    chartContainerRef={chartContainerRef}
                  />
                </div>
              )}

              {showPlot && (
                <ReportSummaryPanel
                  activeDataset={activeDataset || undefined}
                  module={module}
                  xAxisLabel={effectiveXAxisLabel}
                  yAxisLabel={dimensions.yAxis}
                  boxPlotData={boxPlotData}
                  descriptiveStats={descriptiveStats}
                  capabilityStats={capabilityStats}
                  regressionData={regressionData}
                  hypothesisData={hypothesisData}
                  msaData={msaData}
                  kappaData={kappaData}
                  linearityData={linearityData}
                  metadata={analysisMetadata}
                />
              )}
              
              <div className="space-y-6">
                {datasets.map((ds) => {
                  const dsColumns = ds.rawData.length > 0 ? Object.keys(ds.rawData[0]) : [];
                  return (
                    <div key={ds.id} className="flex-none rounded-2xl bg-linear-surface border border-linear-border shadow-linear-level2 p-8 flex flex-col relative overflow-hidden h-[600px]">
                      <div className="flex items-center gap-3 mb-6 relative z-10 shrink-0">
                        <div className="p-3 bg-white/5 rounded-lg border border-white/10 shadow-sm">
                          <BarChart2 size={24} className="text-linear-primary" />
                        </div>
                        <div>
                          <h2 className="text-[20px] font-linear-semibold text-white tracking-tight">{ds.name}</h2>
                          <p className="text-[14px] text-linear-tertiary">
                            {t('app.datasetDetails', { r: ds.rawData.length, c: dsColumns.length })}
                          </p>
                        </div>
                      </div>

                      <div className="flex-1 bg-[#0a0a0b] rounded-lg border border-linear-borderSubtle overflow-hidden flex flex-col relative z-10 shadow-linear-level1 min-h-0">
                        <VirtualTable 
                          data={ds.rawData}
                          columns={dsColumns}
                          datasetId={ds.id}
                          onUpdateCell={(id, row, col, val) => useDataStore.getState().updateCell(id, row, col, val)}
                          isExporting={isExporting}
                          height={400}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
