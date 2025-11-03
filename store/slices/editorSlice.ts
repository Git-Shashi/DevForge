import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { EditorState, Tab, EditorConfig, CursorPosition } from '@/types';

const initialState: EditorState = {
  activeTabs: [],
  activeTabId: null,
  editorSettings: {
    fontSize: 14,
    fontFamily: 'Fira Code, Consolas, monospace',
    theme: 'vs-dark',
    tabSize: 2,
    wordWrap: 'off',
    minimap: true,
    lineNumbers: 'on',
  },
  cursorPosition: {
    line: 1,
    column: 1,
  },
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    addTab: (state, action: PayloadAction<Tab>) => {
      const existingTab = state.activeTabs.find(t => t.path === action.payload.path);
      if (!existingTab) {
        state.activeTabs.push(action.payload);
      }
      state.activeTabId = action.payload.id;
    },
    removeTab: (state, action: PayloadAction<string>) => {
      const tabId = action.payload;
      const index = state.activeTabs.findIndex(t => t.id === tabId);
      
      if (index !== -1) {
        state.activeTabs.splice(index, 1);
        
        // Set new active tab
        if (state.activeTabId === tabId) {
          if (state.activeTabs.length > 0) {
            // Try to activate the tab to the right, otherwise the one to the left
            const newIndex = Math.min(index, state.activeTabs.length - 1);
            state.activeTabId = state.activeTabs[newIndex]?.id || null;
          } else {
            state.activeTabId = null;
          }
        }
      }
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTabId = action.payload;
    },
    updateTabDirty: (state, action: PayloadAction<{ tabId: string; isDirty: boolean }>) => {
      const tab = state.activeTabs.find(t => t.id === action.payload.tabId);
      if (tab) {
        tab.isDirty = action.payload.isDirty;
      }
    },
    reorderTabs: (state, action: PayloadAction<Tab[]>) => {
      state.activeTabs = action.payload;
    },
    updateEditorSettings: (state, action: PayloadAction<Partial<EditorConfig>>) => {
      state.editorSettings = {
        ...state.editorSettings,
        ...action.payload,
      };
    },
    setCursorPosition: (state, action: PayloadAction<CursorPosition>) => {
      state.cursorPosition = action.payload;
    },
    clearTabs: (state) => {
      state.activeTabs = [];
      state.activeTabId = null;
    },
  },
});

export const {
  addTab,
  removeTab,
  setActiveTab,
  updateTabDirty,
  reorderTabs,
  updateEditorSettings,
  setCursorPosition,
  clearTabs,
} = editorSlice.actions;

export default editorSlice.reducer;
