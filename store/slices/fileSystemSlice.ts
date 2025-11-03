import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FileSystemState, FileNode, OpenFile } from '@/types';
import { loadFileTree, readFile, saveFile, createFile, createFolder, deleteFile } from '@/store/thunks/fileSystemThunks';

const initialState: FileSystemState = {
  fileTree: [],
  openFiles: [],
  activeFileId: null,
  fileContents: {},
  unsavedChanges: {},
  loading: false,
  error: null,
};

const fileSystemSlice = createSlice({
  name: 'fileSystem',
  initialState,
  reducers: {
    setFileTree: (state, action: PayloadAction<FileNode[]>) => {
      state.fileTree = action.payload;
      state.loading = false;
      state.error = null;
    },
    addFileNode: (state, action: PayloadAction<{ parentPath: string; node: FileNode }>) => {
      // Recursive function to add node to tree
      const addToTree = (nodes: FileNode[]): boolean => {
        for (const node of nodes) {
          if (node.path === action.payload.parentPath && node.type === 'folder') {
            if (!node.children) node.children = [];
            node.children.push(action.payload.node);
            return true;
          }
          if (node.children && addToTree(node.children)) {
            return true;
          }
        }
        return false;
      };
      addToTree(state.fileTree);
    },
    removeFileNode: (state, action: PayloadAction<string>) => {
      const removePath = action.payload;
      const removeFromTree = (nodes: FileNode[]): FileNode[] => {
        return nodes.filter(node => {
          if (node.path === removePath) return false;
          if (node.children) {
            node.children = removeFromTree(node.children);
          }
          return true;
        });
      };
      state.fileTree = removeFromTree(state.fileTree);
      
      // Remove from open files and contents
      state.openFiles = state.openFiles.filter(f => f.path !== removePath);
      delete state.fileContents[removePath];
      delete state.unsavedChanges[removePath];
      if (state.activeFileId === removePath) {
        state.activeFileId = state.openFiles[0]?.id || null;
      }
    },
    openFile: (state, action: PayloadAction<OpenFile>) => {
      const existingFile = state.openFiles.find(f => f.path === action.payload.path);
      if (!existingFile) {
        state.openFiles.push(action.payload);
      }
      state.activeFileId = action.payload.id;
      state.fileContents[action.payload.path] = action.payload.content;
    },
    closeFile: (state, action: PayloadAction<string>) => {
      const filePath = action.payload;
      state.openFiles = state.openFiles.filter(f => f.path !== filePath);
      delete state.unsavedChanges[filePath];
      
      if (state.activeFileId === filePath) {
        state.activeFileId = state.openFiles[0]?.id || null;
      }
    },
    setActiveFile: (state, action: PayloadAction<string | null>) => {
      state.activeFileId = action.payload;
    },
    updateFileContent: (state, action: PayloadAction<{ path: string; content: string }>) => {
      const { path, content } = action.payload;
      state.fileContents[path] = content;
      state.unsavedChanges[path] = true;
      
      // Update open file content
      const openFile = state.openFiles.find(f => f.path === path);
      if (openFile) {
        openFile.content = content;
        openFile.isDirty = true;
      }
    },
    markFileSaved: (state, action: PayloadAction<string>) => {
      const path = action.payload;
      state.unsavedChanges[path] = false;
      
      const openFile = state.openFiles.find(f => f.path === path);
      if (openFile) {
        openFile.isDirty = false;
      }
    },
    setFileSystemLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setFileSystemError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearFileSystem: (state) => {
      state.fileTree = [];
      state.openFiles = [];
      state.activeFileId = null;
      state.fileContents = {};
      state.unsavedChanges = {};
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Load file tree
    builder.addCase(loadFileTree.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadFileTree.fulfilled, (state, action) => {
      state.fileTree = action.payload;
      state.loading = false;
      state.error = null;
    });
    builder.addCase(loadFileTree.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Read file
    builder.addCase(readFile.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(readFile.fulfilled, (state, action) => {
      state.fileContents[action.payload.path] = action.payload.content;
      state.loading = false;
    });
    builder.addCase(readFile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Save file
    builder.addCase(saveFile.fulfilled, (state, action) => {
      state.unsavedChanges[action.payload] = false;
      const openFile = state.openFiles.find(f => f.path === action.payload);
      if (openFile) {
        openFile.isDirty = false;
      }
    });

    // Create file
    builder.addCase(createFile.fulfilled, (state, action) => {
      // File tree will be refreshed by auto-refresh
    });

    // Create folder
    builder.addCase(createFolder.fulfilled, (state, action) => {
      // File tree will be refreshed by auto-refresh
    });

    // Delete file
    builder.addCase(deleteFile.fulfilled, (state, action) => {
      const removePath = action.payload;
      state.openFiles = state.openFiles.filter(f => f.path !== removePath);
      delete state.fileContents[removePath];
      delete state.unsavedChanges[removePath];
      if (state.activeFileId === removePath) {
        state.activeFileId = state.openFiles[0]?.id || null;
      }
    });
  },
});

export const {
  setFileTree,
  addFileNode,
  removeFileNode,
  openFile,
  closeFile,
  setActiveFile,
  updateFileContent,
  markFileSaved,
  setFileSystemLoading,
  setFileSystemError,
  clearFileSystem,
} = fileSystemSlice.actions;

export default fileSystemSlice.reducer;
