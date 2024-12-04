import { createSlice } from "@reduxjs/toolkit";

const initialValue = {
  projects: {
    data: [],
    total: 0,
  },
  selectedProject: {
    projectId: null,
    projectName: "",
  },
  declineMessage: "",
  selectedProjectToTop: null,
};

const projectSlice = createSlice({
  name: "project",
  initialState: initialValue,
  reducers: {
    setProjects: (state, action) => {
      state.projects.data = action.payload;
      state.projects.total = action.payload.length; // Tính tổng số dự án từ độ dài mảng
    },
    setSelectedProject: (state, action) => {
      state.selectedProject = action.payload;
    },
    setDeclineMessage: (state, action) => {
      state.declineMessage = action.payload;
    },
    removeProject: (state, action) => {
      // Xóa dự án khỏi danh sách khi được duyệt hoặc từ chối
      state.projects.data = state.projects.data.filter(
        (project) => project.projectId !== action.payload
      );
      state.projects.total -= 1; // Giảm tổng số dự án
    },
    setSelectedProjectToTop: (state, action) => {
      state.selectedProjectToTop = action.payload;
    },
    clearSelectedProjectToTop: (state) => {
      state.selectedProjectToTop = null;
    },
  },
});

export const {
  setProjects,
  setSelectedProject,
  setDeclineMessage,
  removeProject,
  setSelectedProjectToTop,
  clearSelectedProjectToTop,
} = projectSlice.actions;
export default projectSlice.reducer;
