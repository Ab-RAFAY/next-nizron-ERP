'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface StatsDrawerContextType {
  open: boolean;
  toggleStats: () => void;
  closeStats: () => void;
}

const StatsDrawerContext = createContext<StatsDrawerContextType>({
  open: false,
  toggleStats: () => {},
  closeStats: () => {},
});

export function StatsDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const toggleStats = useCallback(() => setOpen(v => !v), []);
  const closeStats = useCallback(() => setOpen(false), []);

  return (
    <StatsDrawerContext.Provider value={{ open, toggleStats, closeStats }}>
      {children}
    </StatsDrawerContext.Provider>
  );
}

export function useStatsDrawer() {
  return useContext(StatsDrawerContext);
}
