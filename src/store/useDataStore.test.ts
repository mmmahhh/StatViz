import { describe, it, expect, beforeEach } from 'vitest';
import { useDataStore } from '../store/useDataStore';

describe('useDataStore (multi-dataset)', () => {
  beforeEach(() => {
    useDataStore.setState({ datasets: [], activeDatasetId: null });
  });

  it('starts with empty datasets', () => {
    const state = useDataStore.getState();
    expect(state.datasets).toEqual([]);
    expect(state.activeDatasetId).toBeNull();
  });

  it('addDataset creates and activates a new dataset', () => {
    useDataStore.getState().addDataset('Test', [{ a: 1 }]);
    const state = useDataStore.getState();
    expect(state.datasets).toHaveLength(1);
    expect(state.datasets[0].name).toBe('Test');
    expect(state.activeDatasetId).toBe(state.datasets[0].id);
  });

  it('supports multiple datasets', () => {
    useDataStore.getState().addDataset('A', [{ x: 1 }]);
    useDataStore.getState().addDataset('B', [{ y: 2 }]);
    const state = useDataStore.getState();
    expect(state.datasets).toHaveLength(2);
    // Active should be the last added
    expect(state.datasets.find((d) => d.id === state.activeDatasetId)?.name).toBe('B');
  });

  it('removeDataset removes and switches active', () => {
    useDataStore.getState().addDataset('A', [{ x: 1 }]);
    useDataStore.getState().addDataset('B', [{ y: 2 }]);
    const idB = useDataStore.getState().activeDatasetId!;
    useDataStore.getState().removeDataset(idB);
    const state = useDataStore.getState();
    expect(state.datasets).toHaveLength(1);
    expect(state.datasets[0].name).toBe('A');
    expect(state.activeDatasetId).toBe(state.datasets[0].id);
  });

  it('setDimensions updates the active dataset', () => {
    useDataStore.getState().addDataset('Test', [{ col: 1 }]);
    useDataStore.getState().setDimensions({ yAxis: 'col' });
    const ds = useDataStore.getState().datasets[0];
    expect(ds.dimensions.yAxis).toBe('col');
  });

  it('setGroupBuilder updates the active dataset grouping config', () => {
    useDataStore.getState().addDataset('Test', [{ 日期: '2026-03-01', 点位: 'D1', 数值: 1 }]);
    const activeId = useDataStore.getState().activeDatasetId!;
    useDataStore.getState().setGroupBuilder(activeId, {
      enabled: true,
      separator: '',
      fields: [
        { column: '日期', transform: 'month', prefix: '' },
        { column: '点位', transform: 'original', prefix: '外径' },
        { column: '', transform: 'original', prefix: '' },
      ],
    });
    const ds = useDataStore.getState().datasets[0];
    expect(ds.groupBuilder.enabled).toBe(true);
    expect(ds.groupBuilder.fields[0].column).toBe('日期');
    expect(ds.groupBuilder.fields[1].column).toBe('点位');
    expect(ds.groupBuilder.fields[1].prefix).toBe('外径');
  });
});
