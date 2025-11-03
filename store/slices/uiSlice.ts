import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UIState, Notification } from '@/types';

const initialState: UIState = {
  sidebarOpen: true,
  terminalOpen: true,
  previewOpen: false,
  copilotOpen: false,
  theme: 'dark',
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleTerminal: (state) => {
      state.terminalOpen = !state.terminalOpen;
    },
    setTerminalOpen: (state, action: PayloadAction<boolean>) => {
      state.terminalOpen = action.payload;
    },
    togglePreview: (state) => {
      state.previewOpen = !state.previewOpen;
    },
    setPreviewOpen: (state, action: PayloadAction<boolean>) => {
      state.previewOpen = action.payload;
    },
    toggleCopilot: (state) => {
      state.copilotOpen = !state.copilotOpen;
    },
    setCopilotOpen: (state, action: PayloadAction<boolean>) => {
      state.copilotOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: `notif-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        read: false,
      };
      state.notifications.unshift(notification);
      
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(n => n.read = true);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleTerminal,
  setTerminalOpen,
  togglePreview,
  setPreviewOpen,
  toggleCopilot,
  setCopilotOpen,
  setTheme,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;
