import { create } from 'zustand';
import { apiRequest } from '@/lib/api';

export interface GlobalSettings {
  id: number;
  mock_timer_mins: number;
  mock_q_count: number;
  revision_pass_percent: number;
  revision_deadline_days: number;
  daily_main_topics_count: number;
  gemini_api_key_masked?: string;
  gemini_api_key_configured?: boolean;
  youtube_api_key_masked?: string;
  youtube_api_key_configured?: boolean;
  maintenance_mode?: boolean;
  allow_registrations?: boolean;
}

interface SettingsState {
  settings: GlobalSettings;
  loading: boolean;
  error: string | null;
  fetchSettings: () => Promise<GlobalSettings>;
  updateSettings: (newSettings: Partial<GlobalSettings> & { gemini_api_key?: string; youtube_api_key?: string }) => Promise<GlobalSettings>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {
    id: 1,
    mock_timer_mins: 15,
    mock_q_count: 25,
    revision_pass_percent: 80,
    revision_deadline_days: 2,
    daily_main_topics_count: 2,
    maintenance_mode: false,
    allow_registrations: true,
  },
  loading: false,
  error: null,

  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest<GlobalSettings>('/settings');
      set({ settings: data, loading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch global settings', loading: false });
      throw err;
    }
  },

  updateSettings: async (newSettings) => {
    set({ loading: true, error: null });
    try {
      const data = await apiRequest<GlobalSettings>('/settings', {
        method: 'PUT',
        body: JSON.stringify(newSettings),
      });
      set({ settings: data, loading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Failed to update settings', loading: false });
      throw err;
    }
  },
}));
