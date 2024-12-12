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
  pendingAcceptedGroups: [],
  declinedGroups: [],
  matchedGroups: [],
  classMentorsData: {},
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
    setPendingAcceptedGroups(state, action) {
      state.pendingAcceptedGroups = action.payload;
    },
    setMatchedGroups(state, action) {
      state.matchedGroups = action.payload;
    },
    setDeclinedGroups(state, action) {
      state.declinedGroups = action.payload;
    },
    updateAssignedMentorsMap(state, action) {
      const { projectId, mentors } = action.payload;
      state.assignedMentorsMap[projectId] = mentors;
    },
    setClassMentorsData(state, action) {
      // Add or update mentors data for a specific class
      const { classId, mentorsData, assignedMentorsMap, showSuggestions } =
        action.payload;
      state.classMentorsData[classId] = {
        mentorsData,
        assignedMentorsMap,
        showSuggestions,
      };
    },
    restoreClassMentorsData(state, action) {
      // Restore mentors data for a specific class
      const classId = action.payload;
      const savedData = state.classMentorsData[classId];
      if (savedData) {
        state.mentorsData = savedData.mentorsData;
        state.assignedMentorsMap = savedData.assignedMentorsMap;
        state.showSuggestions = savedData.showSuggestions;
      } else {
        // Clear data if no saved data for the class
        state.mentorsData = {};
        state.assignedMentorsMap = {};
        state.showSuggestions = false;
      }
    },
    removeMentorFromProject(state, action) {
      const { projectId } = action.payload;
      delete state.assignedMentorsMap[projectId];

      // Cập nhật projectData để đặt lại isMatched cho dự án này
      const projectIndex = state.projectData.findIndex(
        (project) => project._id === projectId
      );
      if (projectIndex !== -1) {
        state.projectData[projectIndex].isMatched = false;
      }

      // Loại bỏ nhóm khỏi pendingAcceptedGroups và declinedGroups nếu có
      state.pendingAcceptedGroups = state.pendingAcceptedGroups.filter(
        ({ group }) => group.projectId._id !== projectId
      );
      state.declinedGroups = state.declinedGroups.filter(
        ({ group }) => group.projectId._id !== projectId
      );

      // Cập nhật classMentorsData
      const classId = state.selectedClassId;
      if (state.classMentorsData[classId]) {
        const { mentorsData, assignedMentorsMap, showSuggestions } =
          state.classMentorsData[classId];
        delete assignedMentorsMap[projectId];
        state.classMentorsData[classId] = {
          mentorsData,
          assignedMentorsMap,
          showSuggestions,
        };
      }
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
  setPendingAcceptedGroups,
  setDeclinedGroups,
  setMatchedGroups,
  setClassMentorsData,
  removeMentorFromProject,
} = matchingSlice.actions;

export default matchingSlice.reducer;
