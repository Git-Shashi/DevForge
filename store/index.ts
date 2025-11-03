import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import projectsReducer from './slices/projectsSlice';
import fileSystemReducer from './slices/fileSystemSlice';
import editorReducer from './slices/editorSlice';
import terminalReducer from './slices/terminalSlice';
import dockerReducer from './slices/dockerSlice';
import uiReducer from './slices/uiSlice';
import { autoSaveMiddleware } from './middleware/autoSaveMiddleware';
import { loggerMiddleware } from './middleware/loggerMiddleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
    fileSystem: fileSystemReducer,
    editor: editorReducer,
    terminal: terminalReducer,
    docker: dockerReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the state for serializable check
        ignoredActions: ['fileSystem/updateFileContent'],
        ignoredPaths: ['fileSystem.fileContents'],
      },
    }).concat(autoSaveMiddleware, loggerMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
