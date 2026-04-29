import { create } from 'zustand';

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
