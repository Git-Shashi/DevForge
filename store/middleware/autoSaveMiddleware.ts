import { Middleware } from '@reduxjs/toolkit';
import { updateFileContent } from '../slices/fileSystemSlice';
import { saveFile } from '../thunks/fileSystemThunks';

// Debounce map to track file save timers
const debounceTimers: Map<string, NodeJS.Timeout> = new Map();

export const autoSaveMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);

  // Only handle file content updates
  if (updateFileContent.match(action)) {
    const { path } = action.payload;
    
    // Clear existing timer for this file
    const existingTimer = debounceTimers.get(path);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer for auto-save (2 seconds debounce)
    const timer = setTimeout(() => {
      const state = store.getState();
      const content = state.fileSystem.fileContents[path];
      const projectId = state.projects.activeProject?._id?.toString();

      if (content !== undefined && projectId) {
        // Dispatch save action
        store.dispatch(saveFile({ projectId, path, content }) as any);
      }

      debounceTimers.delete(path);
    }, 2000);

    debounceTimers.set(path, timer);
  }

  return result;
};
