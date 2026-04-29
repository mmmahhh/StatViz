import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { RawDataRow, DimensionConfig, AnalysisModule, CapabilityConfig, FilterRule, GroupBuilderConfig, GroupBuilderField } from '../types';

// ─── Dataset Model ───────────────────────────────────────────
export interface Dataset {
  id: string;
  name: string;
  rawData: RawDataRow[];
  dimensions: DimensionConfig;
  module: AnalysisModule;
  capabilityConfig: CapabilityConfig;
  filters: FilterRule[];
  groupBuilder: GroupBuilderConfig;
}

const createEmptyDimensions = (): DimensionConfig => ({
  xAxis: [],
  yAxis: '',
  color: null,
});

const defaultCapabilityConfig: CapabilityConfig = {
  usl: null,
  lsl: null,
  target: null,
  subgroupSize: 1,
};

const createEmptyGroupField = (): GroupBuilderField => ({
  column: '',
  transform: 'original',
  prefix: '',
});

const defaultGroupBuilder: GroupBuilderConfig = {
  enabled: false,
  separator: '',
  fields: [createEmptyGroupField(), createEmptyGroupField(), createEmptyGroupField()],
};

const makeId = () => `ds-${crypto.randomUUID().slice(0, 8)}`;

// ─── Data Store ──────────────────────────────────────────────
interface DataState {
  datasets: Dataset[];
  activeDatasetId: string | null;
  language: 'en' | 'zh';

  // Actions
  addDataset: (name: string, data: RawDataRow[]) => void;
  removeDataset: (id: string) => void;
  setActiveDataset: (id: string) => void;
  updateCell: (datasetId: string, rowIndex: number, column: string, value: string | number | null) => void;
  setRawData: (data: RawDataRow[]) => void;
  setDimensions: (dims: Partial<DimensionConfig>) => void;
  setModule: (module: AnalysisModule) => void;
  setCapabilityConfig: (config: Partial<CapabilityConfig>) => void;
  setGroupBuilder: (datasetId: string, config: Partial<GroupBuilderConfig>) => void;
  addFilter: (datasetId: string, filter: FilterRule) => void;
  updateFilter: (datasetId: string, filterId: string, filter: Partial<FilterRule>) => void;
  removeFilter: (datasetId: string, filterId: string) => void;
  clearFilters: (datasetId: string) => void;
  setLanguage: (lang: 'en' | 'zh') => void;
  resetData: () => void;
}

export const useDataStore = create<DataState>()(
  immer((set) => ({
    datasets: [],
    activeDatasetId: null,
    language: 'zh',

    addDataset: (name, data) => {
      const id = makeId();
      set((state) => {
        state.datasets.push({
          id,
          name,
          rawData: data,
          dimensions: createEmptyDimensions(),
          module: 'basic',
          capabilityConfig: { ...defaultCapabilityConfig },
          filters: [],
          groupBuilder: {
            ...defaultGroupBuilder,
            fields: defaultGroupBuilder.fields.map((field) => ({ ...field })),
          },
        });
        state.activeDatasetId = id;
      });
    },

    removeDataset: (id) =>
      set((state) => {
        state.datasets = state.datasets.filter((d) => d.id !== id);
        if (state.activeDatasetId === id) {
          state.activeDatasetId = state.datasets[0]?.id ?? null;
        }
      }),

    setActiveDataset: (id) => set({ activeDatasetId: id }),

    updateCell: (datasetId, rowIndex, column, value) =>
      set((state) => {
        const ds = state.datasets.find((d) => d.id === datasetId);
        if (ds && ds.rawData[rowIndex]) {
          ds.rawData[rowIndex][column] = value;
        }
      }),

    setRawData: (data) =>
      set((state) => {
        if (!state.activeDatasetId) {
          const id = makeId();
          state.datasets.push({
            id,
            name: 'Dataset 1',
            rawData: data,
            dimensions: createEmptyDimensions(),
            module: 'basic',
            capabilityConfig: { ...defaultCapabilityConfig },
            filters: [],
            groupBuilder: {
              ...defaultGroupBuilder,
              fields: defaultGroupBuilder.fields.map((field) => ({ ...field })),
            },
          });
          state.activeDatasetId = id;
        } else {
          const ds = state.datasets.find((d) => d.id === state.activeDatasetId);
          if (ds) ds.rawData = data;
        }
      }),

    setDimensions: (newDims) =>
      set((state) => {
        const ds = state.datasets.find((d) => d.id === state.activeDatasetId);
        if (ds) {
          ds.dimensions = { ...ds.dimensions, ...newDims };
        }
      }),

    setModule: (module) =>
      set((state) => {
        const ds = state.datasets.find((d) => d.id === state.activeDatasetId);
        if (ds) ds.module = module;
      }),

    setCapabilityConfig: (config) =>
      set((state) => {
        const ds = state.datasets.find((d) => d.id === state.activeDatasetId);
        if (ds) {
          ds.capabilityConfig = { ...ds.capabilityConfig, ...config };
        }
      }),

    setGroupBuilder: (datasetId, config) =>
      set((state) => {
        const ds = state.datasets.find((d) => d.id === datasetId);
        if (ds) {
          ds.groupBuilder = {
            ...ds.groupBuilder,
            ...config,
            fields: config.fields ?? ds.groupBuilder.fields,
          };
        }
      }),

    addFilter: (datasetId, filter) =>
      set((state) => {
        const ds = state.datasets.find((d) => d.id === datasetId);
        if (ds) ds.filters.push(filter);
      }),

    updateFilter: (datasetId, filterId, filter) =>
      set((state) => {
        const ds = state.datasets.find((d) => d.id === datasetId);
        if (ds) {
          const f = ds.filters.find((item) => item.id === filterId);
          if (f) Object.assign(f, filter);
        }
      }),

    removeFilter: (datasetId, filterId) =>
      set((state) => {
        const ds = state.datasets.find((d) => d.id === datasetId);
        if (ds) {
          ds.filters = ds.filters.filter((f) => f.id !== filterId);
        }
      }),

    clearFilters: (datasetId) =>
      set((state) => {
        const ds = state.datasets.find((d) => d.id === datasetId);
        if (ds) ds.filters = [];
      }),

    setLanguage: (lang) => set({ language: lang }),

    resetData: () => set({ datasets: [], activeDatasetId: null }),
  }))
);

// ─── Selectors ───────────────────────────────────────────────
export const useActiveDataset = (): Dataset | undefined => {
  const datasets = useDataStore((s) => s.datasets);
  const activeId = useDataStore((s) => s.activeDatasetId);
  return datasets.find((d) => d.id === activeId);
};
