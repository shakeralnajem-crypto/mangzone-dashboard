import { create } from 'zustand';

export type HistoryAction = {
  id: string;
  timestamp: number;
  description: string;
  description_ar: string;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
};

interface HistoryState {
  past: HistoryAction[];
  future: HistoryAction[];
  isProcessing: boolean;
  pushAction: (action: HistoryAction) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  isProcessing: false,

  pushAction: (action) => set(state => ({
    past: [...state.past.slice(-49), action],
    future: [],
  })),

  undo: async () => {
    const { past, future, isProcessing } = get();
    if (past.length === 0 || isProcessing) return;
    const last = past[past.length - 1];
    set({ isProcessing: true });
    try {
      await last.undo();
      set({ past: past.slice(0, -1), future: [last, ...future], isProcessing: false });
    } catch {
      set({ isProcessing: false });
    }
  },

  redo: async () => {
    const { past, future, isProcessing } = get();
    if (future.length === 0 || isProcessing) return;
    const next = future[0];
    set({ isProcessing: true });
    try {
      await next.redo();
      set({ past: [...past, next], future: future.slice(1), isProcessing: false });
    } catch {
      set({ isProcessing: false });
    }
  },

  clear: () => set({ past: [], future: [] }),
}));
