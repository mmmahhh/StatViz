import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useAnalysis } from './useAnalysis';
import { Dataset, useDataStore } from '../store/useDataStore';

describe('useAnalysis Bug Fixes', () => {
  afterEach(() => {
    cleanup();
  });

  it('BUG-01: prioritizes compareDataset own X-axis if different from active dataset', () => {
    const activeDataset: Dataset = {
      id: 'ds-active',
      name: 'Active',
      rawData: [{ machine: 'M1', value: 10 }],
      dimensions: { xAxis: ['machine'], yAxis: 'value', color: null },
      module: 'basic',
      capabilityConfig: { usl: null, lsl: null, target: null, subgroupSize: 1 },
      filters: [],
      groupBuilder: { enabled: false, separator: '', fields: [] },
    };

    const compareDataset: Dataset = {
      id: 'ds-compare',
      name: 'Compare',
      rawData: [{ operator: 'Op1', value: 12 }],
      dimensions: { xAxis: ['operator'], yAxis: 'value', color: null },
      module: 'basic',
      capabilityConfig: { usl: null, lsl: null, target: null, subgroupSize: 1 },
      filters: [],
      groupBuilder: { enabled: false, separator: '', fields: [] },
    };

    const { result } = renderHook(() =>
      useAnalysis({
        showPlot: true,
        activeDataset,
        compareDataset,
      })
    );

    expect(result.current.compareBoxPlotData).toBeDefined();
    expect(result.current.compareBoxPlotData?.[0].groupName).toBe('Op1');
  });

  it('BUG-02: ensures setGroupBuilder is called with the correct datasetId', async () => {
    const spy = vi.fn();
    const originalSetGroupBuilder = useDataStore.getState().setGroupBuilder;
    useDataStore.getState().setGroupBuilder = spy;
    
    const activeDataset: Dataset = {
      id: 'ds-123',
      name: 'Test DS',
      rawData: [{ col1: 'A', col2: 10, col3: 20 }],
      dimensions: { xAxis: ['col1'], yAxis: 'col2', color: null },
      module: 'basic',
      capabilityConfig: { usl: null, lsl: null, target: null, subgroupSize: 1 },
      filters: [],
      groupBuilder: { enabled: true, separator: '', fields: [
        { column: 'col3', transform: 'original', prefix: '' } 
      ] },
    };

    const { rerender } = renderHook(({ ds }) => useAnalysis({ showPlot: true, activeDataset: ds }), {
      initialProps: { ds: activeDataset }
    });

    const updatedDataset = {
      ...activeDataset,
      dimensions: { ...activeDataset.dimensions, yAxis: 'col3' }
    };

    rerender({ ds: updatedDataset });

    expect(spy).toHaveBeenCalledWith('ds-123', expect.objectContaining({
      fields: expect.arrayContaining([
        expect.objectContaining({ column: '' })
      ])
    }));

    useDataStore.getState().setGroupBuilder = originalSetGroupBuilder;
  });
});
