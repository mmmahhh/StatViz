import { create } from 'zustand';
import { RawDataRow, DimensionConfig } from '../types';

// ─── Dataset Model ───────────────────────────────────────────
export interface Dataset {
  id: string;
  name: string;
  rawData: RawDataRow[];
  dimensions: DimensionConfig;
}

const createEmptyDimensions = (): DimensionConfig => ({
  xAxis: [],
  yAxis: '',
  color: null,
});

const makeId = () => `ds-${Math.random().toString(36).substring(2, 9)}`;

// ─── Data Store ──────────────────────────────────────────────
interface DataState {
  datasets: Dataset[];
  activeDatasetId: string | null;
  language: 'en' | 'zh';

  // Convenience getters (computed via selectors below)

  // Actions
  addDataset: (name: string, data: RawDataRow[]) => void;
  removeDataset: (id: string) => void;
  setActiveDataset: (id: string) => void;
  setRawData: (data: RawDataRow[]) => void;
  setDimensions: (dims: Partial<DimensionConfig>) => void;
  setLanguage: (lang: 'en' | 'zh') => void;
  resetData: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  datasets: [],
  activeDatasetId: null,
  language: 'zh',

  addDataset: (name, data) => {
    const id = makeId();
    set((state) => ({
      datasets: [
        ...state.datasets,
        { id, name, rawData: data, dimensions: createEmptyDimensions() },
      ],
      activeDatasetId: id,
    }));
  },

  removeDataset: (id) =>
    set((state) => {
      const remaining = state.datasets.filter((d) => d.id !== id);
      return {
        datasets: remaining,
        activeDatasetId:
          state.activeDatasetId === id
            ? remaining[0]?.id ?? null
            : state.activeDatasetId,
      };
    }),

  setActiveDataset: (id) => set({ activeDatasetId: id }),

  // Legacy-compatible: updates the active dataset's rawData
  setRawData: (data) =>
    set((state) => {
      if (!state.activeDatasetId) {
        // First import → create a new dataset
        const id = makeId();
        return {
          datasets: [
            ...state.datasets,
            { id, name: 'Dataset 1', rawData: data, dimensions: createEmptyDimensions() },
          ],
          activeDatasetId: id,
        };
      }
      return {
        datasets: state.datasets.map((ds) =>
          ds.id === state.activeDatasetId ? { ...ds, rawData: data } : ds
        ),
      };
    }),

  setDimensions: (newDims) =>
    set((state) => ({
      datasets: state.datasets.map((ds) =>
        ds.id === state.activeDatasetId
          ? { ...ds, dimensions: { ...ds.dimensions, ...newDims } }
          : ds
      ),
    })),
  
  setLanguage: (lang) => set({ language: lang }),

  resetData: () => set({ datasets: [], activeDatasetId: null }),
}));

// ─── Selectors ───────────────────────────────────────────────
export const useActiveDataset = (): Dataset | undefined => {
  const datasets = useDataStore((s) => s.datasets);
  const activeId = useDataStore((s) => s.activeDatasetId);
  return datasets.find((d) => d.id === activeId);
};

// ─── Style Override Store (unchanged) ────────────────────────
interface StyleState {
  styleOverrides: Record<string, { color?: string }>;
  setStyleOverride: (id: string, style: { color?: string }) => void;
  clearStyleOverride: (id: string) => void;
  clearAllOverrides: () => void;
}

export const useStyleStore = create<StyleState>((set) => ({
  styleOverrides: {},
  setStyleOverride: (id, style) =>
    set((state) => ({
      styleOverrides: {
        ...state.styleOverrides,
        [id]: { ...state.styleOverrides[id], ...style },
      },
    })),
  clearStyleOverride: (id) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _, ...rest } = state.styleOverrides;
      return { styleOverrides: rest };
    }),
  clearAllOverrides: () => set({ styleOverrides: {} }),
}));
