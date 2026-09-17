import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Question, AppState, AppSettings, Achievement, Module } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/types';
import * as db from '@/lib/db';

interface AppContextValue {
  questions: Question[];
  modules: Module[];
  state: AppState | null;
  achievements: Achievement[];
  loading: boolean;
  settings: AppSettings;
  refresh: () => Promise<void>;
  updateSettings: (s: AppSettings) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [state, setState] = useState<AppState | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const refresh = useCallback(async () => {
    const [q, s, a, m] = await Promise.all([db.fetchQuestions(), db.fetchAppState(), db.fetchAchievements(), db.fetchModules().catch(() => [] as Module[])]);
    setQuestions(q);
    setModules(m);
    setState(s);
    setAchievements(a);
    setSettings(s.settings ?? DEFAULT_SETTINGS);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await refresh();
      } catch (e) {
        console.error('Failed to load app state:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [refresh]);

  const updateSettings = useCallback(async (s: AppSettings) => {
    setSettings(s);
    await db.updateSettings(s);
    await refresh();
  }, [refresh]);

  return (
    <AppContext.Provider value={{ questions, modules, state, achievements, loading, settings, refresh, updateSettings }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
