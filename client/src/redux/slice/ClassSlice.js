import { createSlice } from "@reduxjs/toolkit";
const initialValue = {
  classes: {},
  classList: [],
  searchValue: "",
  sort: -1,
  deleteClass: {},
  editClass: {},
  pageNo: 0,
  class: {},
  classSummaries: [],
  selectedGroup: {
    groupId: null,
    groupName: "",
    classId: null,
    isProjectUpdated: "",
    isMatched: "",
    matchStatus: "",
  },
  counts: {},
  emptyClasses: [],
  matchedClasses: [],
  notMatchedClasses: [],
  classesWithUnupdatedProjects: [],
  loadingClasses: false,
  pendingGroups: [],
};
const classSlice = createSlice({
  name: "class",
  initialState: initialValue,
  reducers: {
    setclasses: (state, action) => {
      state.classes = action.payload;
    },
    setClassList: (state, action) => {
      state.classList = action.payload;
    },
    setSearchValue: (state, action) => {
      state.searchValue = action.payload;
    },
    setSort: (state, action) => {
      state.sort = action.payload;
    },
    setPageNo: (state, action) => {
      state.pageNo = action.payload;
    },
    setdeleteClass: (state, action) => {
      state.deleteClass = action.payload;
    },
    setEditClass: (state, action) => {
      state.editClass = action.payload;
    },
    setClass: (state, action) => {
      state.class = action.payload;
    },
    setClassSummaries: (state, action) => {
      if (
        JSON.stringify(state.classSummaries) !== JSON.stringify(action.payload)
      ) {
        state.classSummaries = action.payload;
      }
    },
    setSelectedGroup: (state, action) => {
      if (state.selectedGroup.groupId !== action.payload.groupId) {
        state.selectedGroup = action.payload;
      }
    },
    setCounts: (state, action) => {
      state.counts = action.payload;
    },
    setEmptyClasses: (state, action) => {
      state.emptyClasses = action.payload;
    },
    setMatchedClasses: (state, action) => {
      state.matchedClasses = action.payload;
    },
    setNotMatchedClasses: (state, action) => {
      state.notMatchedClasses = action.payload;
    },
    setClassesWithUnupdatedProjects: (state, action) => {
      state.classesWithUnupdatedProjects = action.payload;
    },
    setLoadingClasses(state, action) {
      state.loadingClasses = action.payload;
    },
    setPendingGroups(state, action) {
      state.pendingGroups = action.payload;
    },
  },
});

const { reducer, actions } = classSlice;
export const {
  setclasses,
  setSearchValue,
  setSort,
  setPageNo,
  setClassList,
  setdeleteClass,
  setEditClass,
  setClass,
  setClassSummaries,
  setSelectedGroup,
  setCounts,
  setMatchedClasses,
  setNotMatchedClasses,
  setEmptyClasses,
  setClassesWithUnupdatedProjects,
  setLoadingClasses,
  setPendingGroups,
} = actions;
export default reducer;
