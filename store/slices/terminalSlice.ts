import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { TerminalState, LogEntry } from '@/types';

const initialState: TerminalState = {
  logs: [],
  isConnected: false,
  containerStatus: 'stopped',
};

const terminalSlice = createSlice({
  name: 'terminal',
  initialState,
  reducers: {
    addLog: (state, action: PayloadAction<LogEntry>) => {
      state.logs.push(action.payload);
      
      // Keep only last 1000 logs to prevent memory issues
      if (state.logs.length > 1000) {
        state.logs = state.logs.slice(-1000);
      }
    },
    addLogs: (state, action: PayloadAction<LogEntry[]>) => {
      state.logs.push(...action.payload);
      
      if (state.logs.length > 1000) {
        state.logs = state.logs.slice(-1000);
      }
    },
    clearLogs: (state) => {
      state.logs = [];
    },
    setTerminalConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setContainerStatus: (state, action: PayloadAction<'running' | 'error' | 'stopped'>) => {
      state.containerStatus = action.payload;
    },
    removeLog: (state, action: PayloadAction<string>) => {
      state.logs = state.logs.filter(log => log.id !== action.payload);
    },
  },
});

export const {
  addLog,
  addLogs,
  clearLogs,
  setTerminalConnected,
  setContainerStatus,
  removeLog,
} = terminalSlice.actions;

export default terminalSlice.reducer;
