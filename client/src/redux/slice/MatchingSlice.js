// src/redux/slice/MatchingSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedClassId: null,
  loadingProjects: false,
  loadingMentors: false,
  activeId: null,
  classData: {},
  isAssig: false,
  reloadRequired: {},
};

const matchingSlice = createSlice({
  name: "matching",
  initialState,
  reducers: {
    setSelectedClassId(state, action) {
      state.selectedClassId = action.payload;
    },
    setReloadRequired(state, action) {
      const { classId, required } = action.payload;
      state.reloadRequired[classId] = required;
    },
    clearReloadRequired(state, action) {
      const classId = action.payload;
      delete state.reloadRequired[classId];
    },
    setLoadingProjects(state, action) {
      state.loadingProjects = action.payload;
    },
    setLoadingMentors(state, action) {
      state.loadingMentors = action.payload;
    },
    setActiveId(state, action) {
      state.activeId = action.payload;
    },
    setIsAssig(state, action) {
      state.isAssig = action.payload;
    },
    // Project Data
    setProjectData(state, action) {
      const { classId, projectData } = action.payload;
      if (!state.classData[classId]) {
        state.classData[classId] = {};
      }
      state.classData[classId].projectData = projectData;
    },
    // Mentors Data
    setMentorsData(state, action) {
      const { classId, mentorsData } = action.payload;
      if (!state.classData[classId]) {
        state.classData[classId] = {};
      }
      state.classData[classId].mentorsData = mentorsData;
    },
    // Assigned Mentors Map
    setAssignedMentorsMap(state, action) {
      const { classId, assignedMentorsMap } = action.payload;
      if (!state.classData[classId]) {
        state.classData[classId] = {};
      }
      state.classData[classId].assignedMentorsMap = assignedMentorsMap;
    },
    // Show Suggestions
    setShowSuggestions(state, action) {
      const { classId, showSuggestions } = action.payload;
      if (!state.classData[classId]) {
        state.classData[classId] = {};
      }
      state.classData[classId].showSuggestions = showSuggestions;
    },
    // Pending Accepted Groups
    setPendingAcceptedGroups(state, action) {
      const { classId, pendingAcceptedGroups } = action.payload;
      if (!state.classData[classId]) {
        state.classData[classId] = {};
      }
      state.classData[classId].pendingAcceptedGroups = pendingAcceptedGroups;
    },
    // Declined Groups
    setDeclinedGroups(state, action) {
      const { classId, declinedGroups } = action.payload;
      if (!state.classData[classId]) {
        state.classData[classId] = {};
      }
      state.classData[classId].declinedGroups = declinedGroups;
    },
    // Matched Groups
    setMatchedGroups(state, action) {
      const { classId, matchedGroups } = action.payload;
      if (!state.classData[classId]) {
        state.classData[classId] = {};
      }
      state.classData[classId].matchedGroups = matchedGroups;
    },
    // Update Assigned Mentors Map for a Specific Project
    updateAssignedMentorsMap(state, action) {
      const { classId, projectId, mentors } = action.payload;
      if (!state.classData[classId]) {
        state.classData[classId] = {};
      }
      state.classData[classId].assignedMentorsMap[projectId] = mentors;
    },
    // Remove Mentor from Project
    removeMentorFromProject(state, action) {
      const { classId, projectId } = action.payload;
      if (
        state.classData[classId] &&
        state.classData[classId].assignedMentorsMap
      ) {
        delete state.classData[classId].assignedMentorsMap[projectId];
      }

      // Update projectData to reset isMatched for this project
      if (state.classData[classId] && state.classData[classId].projectData) {
        const project = state.classData[classId].projectData.find(
          (proj) => proj._id === projectId
        );
        if (project) {
          project.isMatched = false;
        }
      }

      // Remove the group from pendingAcceptedGroups and declinedGroups if present
      if (
        state.classData[classId] &&
        state.classData[classId].pendingAcceptedGroups
      ) {
        state.classData[classId].pendingAcceptedGroups = state.classData[
          classId
        ].pendingAcceptedGroups.filter(
          ({ group }) => group.projectId._id !== projectId
        );
      }

      if (state.classData[classId] && state.classData[classId].declinedGroups) {
        state.classData[classId].declinedGroups = state.classData[
          classId
        ].declinedGroups.filter(
          ({ group }) => group.projectId._id !== projectId
        );
      }
    },
    // Set All Class Mentors Data at Once (for initial fetching)
    setClassMentorsData(state, action) {
      const {
        classId,
        projectData,
        mentorsData,
        assignedMentorsMap,
        showSuggestions,
        pendingAcceptedGroups,
        declinedGroups,
        matchedGroups,
      } = action.payload;

      state.classData[classId] = {
        projectData,
        mentorsData,
        assignedMentorsMap,
        showSuggestions,
        pendingAcceptedGroups,
        declinedGroups,
        matchedGroups,
      };
    },
    resetClassData(state) {
      state.classData = {};
      state.selectedClassId = null;
      state.loadingProjects = false;
      state.activeId = null;
      state.isAssig = false;
    },
  },
});

export const {
  setSelectedClassId,
  setLoadingProjects,
  setLoadingMentors,
  setActiveId,
  setProjectData,
  setMentorsData,
  setAssignedMentorsMap,
  setShowSuggestions,
  setPendingAcceptedGroups,
  setDeclinedGroups,
  setMatchedGroups,
  updateAssignedMentorsMap,
  removeMentorFromProject,
  setClassMentorsData,
  setReloadRequired,
  clearReloadRequired,
  setIsAssig,
  resetClassData,
} = matchingSlice.actions;
export default matchingSlice.reducer;
