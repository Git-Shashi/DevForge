import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ProjectsState, Project } from '@/types';
import { fetchProjects, createProject, loadProject, deleteProject } from '../thunks/projectThunks';

const initialState: ProjectsState = {
  list: [],
  activeProject: null,
  loading: false,
  error: null,
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.list = action.payload;
      state.loading = false;
      state.error = null;
    },
    addProject: (state, action: PayloadAction<Project>) => {
      state.list.push(action.payload);
      state.error = null;
    },
    updateProject: (state, action: PayloadAction<Project>) => {
      const index = state.list.findIndex(p => p._id === action.payload._id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
      if (state.activeProject?._id === action.payload._id) {
        state.activeProject = action.payload;
      }
    },
    removeProject: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(p => p._id.toString() !== action.payload);
      if (state.activeProject?._id.toString() === action.payload) {
        state.activeProject = null;
      }
    },
    setActiveProject: (state, action: PayloadAction<Project | null>) => {
      state.activeProject = action.payload;
      state.error = null;
    },
    setProjectsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setProjectsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    updateProjectStatus: (state, action: PayloadAction<{ projectId: string; status: 'running' | 'error' | 'stopped' }>) => {
      const project = state.list.find(p => p._id.toString() === action.payload.projectId);
      if (project) {
        project.docker.status = action.payload.status;
      }
      if (state.activeProject?._id.toString() === action.payload.projectId) {
        state.activeProject.docker.status = action.payload.status;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch projects
    builder.addCase(fetchProjects.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProjects.fulfilled, (state, action) => {
      state.loading = false;
      state.list = action.payload;
    });
    builder.addCase(fetchProjects.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create project
    builder.addCase(createProject.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createProject.fulfilled, (state, action) => {
      state.loading = false;
      state.list.push(action.payload);
    });
    builder.addCase(createProject.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Load project
    builder.addCase(loadProject.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loadProject.fulfilled, (state, action) => {
      state.loading = false;
      state.activeProject = action.payload;
    });
    builder.addCase(loadProject.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete project
    builder.addCase(deleteProject.fulfilled, (state, action) => {
      state.list = state.list.filter(p => p._id.toString() !== action.payload);
      if (state.activeProject?._id.toString() === action.payload) {
        state.activeProject = null;
      }
    });
  },
});

export const {
  setProjects,
  addProject,
  updateProject,
  removeProject,
  setActiveProject,
  setProjectsLoading,
  setProjectsError,
  updateProjectStatus,
} = projectsSlice.actions;

export default projectsSlice.reducer;
