import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  vendor: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  setSettings: (settings: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      vendor: 'openai',
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-3.5-turbo',
      setSettings: (settings) => set((state) => ({ ...state, ...settings })),
    }),
    {
      name: 'statviz-ai-settings', // localStorage key
    }
  )
);
