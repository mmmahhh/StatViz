import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useAnalysis } from './useAnalysis';
import { Dataset } from '../store/useDataStore';

describe('useAnalysis MSA', () => {
  afterEach(() => {
    cleanup();
  });

  it('reports categorical Kappa rows as valid instead of treating them as invalid numeric samples', () => {
    const activeDataset: Dataset = {
      id: 'kappa',
      name: 'kappa-dataset',
      rawData: [
        { crucible: 'A', operator: 'Op1', judgement: '优' },
        { crucible: 'A', operator: 'Op2', judgement: '优' },
        { crucible: 'B', operator: 'Op1', judgement: '劣' },
        { crucible: 'B', operator: 'Op2', judgement: '劣' },
        { crucible: 'C', operator: 'Op1', judgement: '优' },
        { crucible: 'C', operator: 'Op2', judgement: '劣' },
      ],
      dimensions: { xAxis: ['crucible', 'operator'], yAxis: 'judgement', color: null },
      module: 'msa-kappa',
      capabilityConfig: { usl: null, lsl: null, target: null, subgroupSize: 1 },
      filters: [],
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
      })
    );

    expect(result.current.kappaData).not.toBeNull();
    expect(result.current.analysisMetadata).toEqual({
      totalCount: 6,
      validCount: 6,
      invalidCount: 0,
    });
  });
});
