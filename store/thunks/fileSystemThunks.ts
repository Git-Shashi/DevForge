import { createAsyncThunk } from '@reduxjs/toolkit';
import type { FileNode } from '@/types';

export const loadFileTree = createAsyncThunk(
  'fileSystem/loadFileTree',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/files/tree?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to load file tree');
      }
      const data = await response.json();
      return data.tree as FileNode[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const readFile = createAsyncThunk(
  'fileSystem/readFile',
  async ({ projectId, path }: { projectId: string; path: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/files/read?projectId=${projectId}&path=${encodeURIComponent(path)}`);
      if (!response.ok) {
        throw new Error('Failed to read file');
      }
      const data = await response.json();
      return { path, content: data.content };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const saveFile = createAsyncThunk(
  'fileSystem/saveFile',
  async ({ projectId, path, content }: { projectId: string; path: string; content: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/files/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, path, content }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save file');
      }
      
      return path;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Alias for writeFile (used by auto-save)
export const writeFile = saveFile;

export const createFile = createAsyncThunk(
  'fileSystem/createFile',
  async ({ projectId, path, content = '' }: { projectId: string; path: string; content?: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/files/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, path, content, type: 'file' }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create file');
      }
      
      const data = await response.json();
      return data.node as FileNode;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createFolder = createAsyncThunk(
  'fileSystem/createFolder',
  async ({ projectId, path }: { projectId: string; path: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/files/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, path, type: 'folder' }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create folder');
      }
      
      const data = await response.json();
      return data.node as FileNode;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteFile = createAsyncThunk(
  'fileSystem/deleteFile',
  async ({ projectId, path }: { projectId: string; path: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/files/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, path }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete file');
      }
      
      return path;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
