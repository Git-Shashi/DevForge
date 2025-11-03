import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { DockerState, ContainerInfo, ResourceUsage } from '@/types';

const initialState: DockerState = {
  containerInfo: null,
  buildLogs: [],
  resourceUsage: null,
  loading: false,
  error: null,
};

const dockerSlice = createSlice({
  name: 'docker',
  initialState,
  reducers: {
    setContainerInfo: (state, action: PayloadAction<ContainerInfo>) => {
      state.containerInfo = action.payload;
      state.error = null;
    },
    updateContainerStatus: (state, action: PayloadAction<string>) => {
      if (state.containerInfo) {
        state.containerInfo.status = action.payload;
      }
    },
    addBuildLog: (state, action: PayloadAction<string>) => {
      state.buildLogs.push(action.payload);
      
      // Keep only last 500 build logs
      if (state.buildLogs.length > 500) {
        state.buildLogs = state.buildLogs.slice(-500);
      }
    },
    clearBuildLogs: (state) => {
      state.buildLogs = [];
    },
    setResourceUsage: (state, action: PayloadAction<ResourceUsage>) => {
      state.resourceUsage = action.payload;
    },
    setDockerLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setDockerError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearDockerState: (state) => {
      state.containerInfo = null;
      state.buildLogs = [];
      state.resourceUsage = null;
      state.error = null;
    },
  },
});

export const {
  setContainerInfo,
  updateContainerStatus,
  addBuildLog,
  clearBuildLogs,
  setResourceUsage,
  setDockerLoading,
  setDockerError,
  clearDockerState,
} = dockerSlice.actions;

export default dockerSlice.reducer;
