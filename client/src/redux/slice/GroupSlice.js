import { createSlice } from "@reduxjs/toolkit";
const initialValue = {
  groups: [],
  selectedGroupId: null,
  group: {},
  allGroups: [],
  groupInClass: [],
  teacherInfor:[],
  projectStatus: [],
  outcomes: [],
  groupStatus: [],
  currentStage: 1,
};
const groupSlice = createSlice({
  name: "group",
  initialState: initialValue,
  reducers: {
    setGroups: (state, action) => {
      state.groups = action.payload;
    },
    setSelectedGroupId: (state, action) => {
      state.selectedGroupId = action.payload;
    },
    setGroup: (state, action) => {
      state.group = action.payload;
    },
    setAllGroup: (state, action) => {
      state.allGroups = action.payload;
    },
    updateGroupLeader(state, action) {
      const { groupId, userId } = action.payload;
      if (state.group && state.group._id === groupId) {
        state.group.members.forEach((member) => {
          member.isLeader = member._id === userId;
        });
      }
    },
    setAllGroupInClass: (state, action) => {
      state.groupInClass = action.payload;
    },
    setTeacherInfoInClass: (state, action) => {
      state.teacherInfor = action.payload;
    },
    setGroupStatus: (state, action) => {
      state.groupStatus = action.payload;
    },
    setProjectStatus: (state, action) => {
      state.projectStatus = action.payload;
    },
    setOutcomes: (state, action) => {
      state.outcomes = action.payload;
    },
    setCurrentStage: (state, action) => {
      state.currentStage = action.payload;
    },
    setAllGroupInClass: (state, action) => {
      state.groupInClass = action.payload;
    },
  },
});

const { reducer, actions } = groupSlice;
export const {
  setGroups,
  setSelectedGroupId,
  setGroup,
  setAllGroup,
  updateGroupLeader,
  setAllGroupInClass,
  setGroupStatus,
  setProjectStatus,
  setOutcomes,
  setCurrentStage,
  setTeacherInfoInClass,
} = actions;
export default reducer;
