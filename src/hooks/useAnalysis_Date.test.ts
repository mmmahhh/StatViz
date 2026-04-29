import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useAnalysis } from './useAnalysis';
import { Dataset } from '../store/useDataStore';

describe('useAnalysis Date Grouping', () => {
  afterEach(() => {
    cleanup();
  });

  it('builds derived monthly groups from multiple configured fields without a manual X field', () => {
    const activeDataset: Dataset = {
      id: 'date-grouped',
      name: 'date-grouped',
      rawData: [
        { 日期: '2026-03-01', 点位: 'D1', 数值: 708.1 },
        { 日期: '2026-03-15', 点位: 'D1', 数值: 708.9 },
        { 日期: '2026-04-02', 点位: 'D1', 数值: 709.1 },
        { 日期: '2026-04-10', 点位: 'D2', 数值: 709.4 },
      ],
      dimensions: { xAxis: [], yAxis: '数值', color: null },
      module: 'basic',
      capabilityConfig: { usl: null, lsl: null, target: null, subgroupSize: 1 },
      filters: [],
      groupBuilder: {
        enabled: true,
        separator: '',
        fields: [
          { column: '日期', transform: 'month', prefix: '' },
          { column: '点位', transform: 'original', prefix: '外径' },
          { column: '', transform: 'original', prefix: '' },
        ],
      },
    };

    const { result } = renderHook(() =>
      useAnalysis({
        showPlot: true,
        activeDataset,
      })
    );

    expect(result.current.canRunAnalysis).toBe(true);
    expect(result.current.effectiveXAxisLabel).toContain('组合分组');
    expect(result.current.boxPlotData.map((item) => item.groupName)).toEqual(['3月外径D1', '4月外径D1', '4月外径D2']);
  });

  it('sorts monthly group labels by actual month order and disambiguates across years', () => {
    const activeDataset: Dataset = {
      id: 'cross-year',
      name: 'cross-year',
      rawData: [
        { 日期: '2026-10-01', 点位: 'D1', 数值: 710.1 },
        { 日期: '2025-03-15', 点位: 'D1', 数值: 708.1 },
        { 日期: '2026-02-10', 点位: 'D1', 数值: 707.9 },
      ],
      dimensions: { xAxis: [], yAxis: '数值', color: null },
      module: 'basic',
      capabilityConfig: { usl: null, lsl: null, target: null, subgroupSize: 1 },
      filters: [],
      groupBuilder: {
        enabled: true,
        separator: '',
        fields: [
          { column: '日期', transform: 'month', prefix: '' },
          { column: '点位', transform: 'original', prefix: '外径' },
          { column: '', transform: 'original', prefix: '' },
        ],
      },
    };

    const { result } = renderHook(() =>
      useAnalysis({
        showPlot: true,
        activeDataset,
      })
    );

    expect(result.current.boxPlotData.map((item) => item.groupName)).toEqual([
      '2025年3月外径D1',
      '2026年2月外径D1',
      '2026年10月外径D1',
    ]);
  });

  it('parses numeric YYYYMMDD dates correctly for monthly grouping', () => {
    const activeDataset: Dataset = {
      id: 'numeric-date',
      name: 'numeric-date',
      rawData: [
        { 日期: 20260301, 点位: 'D1', 数值: 708.1 },
        { 日期: 20260401, 点位: 'D1', 数值: 709.1 },
      ],
      dimensions: { xAxis: [], yAxis: '数值', color: null },
      module: 'basic',
      capabilityConfig: { usl: null, lsl: null, target: null, subgroupSize: 1 },
      filters: [],
      groupBuilder: {
        enabled: true,
        separator: '',
        fields: [
          { column: '日期', transform: 'month', prefix: '' },
          { column: '点位', transform: 'original', prefix: '外径' },
          { column: '', transform: 'original', prefix: '' },
        ],
      },
    };

    const { result } = renderHook(() =>
      useAnalysis({
        showPlot: true,
        activeDataset,
      })
    );

    expect(result.current.boxPlotData.map((item) => item.groupName)).toEqual(['3月外径D1', '4月外径D1']);
  });

  it('parses compact string YYYYMMDD dates correctly for monthly grouping', () => {
    const activeDataset: Dataset = {
      id: 'compact-string-date',
      name: 'compact-string-date',
      rawData: [
        { 日期: '20260301', 点位: 'D1', 数值: 708.1 },
        { 日期: '20260401', 点位: 'D1', 数值: 709.1 },
      ],
      dimensions: { xAxis: [], yAxis: '数值', color: null },
      module: 'basic',
      capabilityConfig: { usl: null, lsl: null, target: null, subgroupSize: 1 },
      filters: [],
      groupBuilder: {
        enabled: true,
        separator: '',
        fields: [
          { column: '日期', transform: 'month', prefix: '' },
          { column: '点位', transform: 'original', prefix: '外径' },
          { column: '', transform: 'original', prefix: '' },
        ],
      },
    };

    const { result } = renderHook(() =>
      useAnalysis({
        showPlot: true,
        activeDataset,
      })
    );

    expect(result.current.boxPlotData.map((item) => item.groupName)).toEqual(['3月外径D1', '4月外径D1']);
  });

  it('ignores Y column in group builder and downgrades non-date month transforms to original', () => {
    const activeDataset: Dataset = {
      id: 'guarded-builder',
      name: 'guarded-builder',
      rawData: [
        { 日期: '2026-03-01', 点位: 'D1', 数值: 708.2 },
        { 日期: '2026-04-01', 点位: 'D1', 数值: 708.8 },
      ],
      dimensions: { xAxis: [], yAxis: '数值', color: null },
      module: 'basic',
      capabilityConfig: { usl: null, lsl: null, target: null, subgroupSize: 1 },
      filters: [],
      groupBuilder: {
        enabled: true,
        separator: '',
        fields: [
          { column: '日期', transform: 'month', prefix: '' },
          { column: '点位', transform: 'month', prefix: '' },
          { column: '数值', transform: 'month', prefix: '' },
        ],
      },
    };

    const { result } = renderHook(() =>
      useAnalysis({
        showPlot: true,
        activeDataset,
      })
    );

    expect(result.current.boxPlotData.map((item) => item.groupName)).toEqual(['3月D1', '4月D1']);
    expect(result.current.effectiveXAxisLabel).toContain('点位');
    expect(result.current.effectiveXAxisLabel).not.toContain('数值');
  });
});
