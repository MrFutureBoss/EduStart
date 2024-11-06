import { createSlice } from "@reduxjs/toolkit";
const initialValue = {
  groups: [],
  selectedGroupId: null,
  group: {},
  allGroups: [],
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
  },
});

const { reducer, actions } = groupSlice;
export const {
  setGroups,
  setSelectedGroupId,
  setGroup,
  setAllGroup,
  updateGroupLeader,
} = actions;
export default reducer;
