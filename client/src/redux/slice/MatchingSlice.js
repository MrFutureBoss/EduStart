// src/redux/slice/MatchingSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedClassId: null,
  projectData: [],
  mentorsData: {},
  assignedMentorsMap: {},
  loadingProjects: false,
  loadingMentors: false,
  showSuggestions: false,
  activeId: null,
};

const matchingSlice = createSlice({
  name: "matching",
  initialState,
  reducers: {
    setSelectedClassId(state, action) {
      state.selectedClassId = action.payload;
    },
    setProjectData(state, action) {
      state.projectData = action.payload;
    },
    setMentorsData(state, action) {
      state.mentorsData = action.payload;
    },
    setAssignedMentorsMap(state, action) {
      state.assignedMentorsMap = action.payload;
    },
    setLoadingProjects(state, action) {
      state.loadingProjects = action.payload;
    },
    setLoadingMentors(state, action) {
      state.loadingMentors = action.payload;
    },
    setShowSuggestions(state, action) {
      state.showSuggestions = action.payload;
    },
    setActiveId(state, action) {
      state.activeId = action.payload;
    },
    updateAssignedMentorsMap(state, action) {
      const { projectId, mentors } = action.payload;
      state.assignedMentorsMap[projectId] = mentors;
    },
  },
});

export const {
  setSelectedClassId,
  setProjectData,
  setMentorsData,
  setAssignedMentorsMap,
  setLoadingProjects,
  setLoadingMentors,
  setShowSuggestions,
  setActiveId,
  updateAssignedMentorsMap,
} = matchingSlice.actions;

export default matchingSlice.reducer;
