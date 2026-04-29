import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useAnalysis } from './useAnalysis';
import { FilterRule } from '../types';
import { Dataset } from '../store/useDataStore';

describe('useAnalysis Basic', () => {
  afterEach(() => {
    cleanup();
  });

  it('applies filters to the comparison dataset before building compare box plots', () => {
    const filters: FilterRule[] = [
      { id: 'keep-0402', column: 'batch', operator: 'in', value: ['0402'], enabled: true },
    ];

    const activeDataset: Dataset = {
      id: 'active',
      name: '0403',
      rawData: [
        { batch: '0403', value: 12 },
        { batch: '0403', value: 13 },
      ],
      dimensions: { xAxis: ['batch'], yAxis: 'value', color: null },
      module: 'basic',
      capabilityConfig: { usl: null, lsl: null, target: null, subgroupSize: 1 },
      filters: [],
      groupBuilder: { enabled: false, separator: '', fields: [
        { column: '', transform: 'original', prefix: '' },
        { column: '', transform: 'original', prefix: '' },
        { column: '', transform: 'original', prefix: '' },
      ] },
    };

    const compareDataset: Dataset = {
      id: 'compare',
      name: 'mixed',
      rawData: [
        { batch: '0402', value: 10 },
        { batch: '0402', value: 11 },
        { batch: '0403', value: 999 },
      ],
      dimensions: { xAxis: ['batch'], yAxis: 'value', color: null },
      module: 'basic',
      capabilityConfig: { usl: null, lsl: null, target: null, subgroupSize: 1 },
      filters,
      groupBuilder: { enabled: false, separator: '', fields: [
        { column: '', transform: 'original', prefix: '' },
        { column: '', transform: 'original', prefix: '' },
        { column: '', transform: 'original', prefix: '' },
      ] },
    };

    const { result } = renderHook(() =>
      useAnalysis({
        showPlot: true,
        activeDataset,
        compareDataset,
      })
    );

    expect(result.current.compareBoxPlotData).toHaveLength(1);
    expect(result.current.compareBoxPlotData?.[0].groupName).toBe('0402');
    expect(result.current.compareBoxPlotData?.[0].max).toBe(11);
  });
});
