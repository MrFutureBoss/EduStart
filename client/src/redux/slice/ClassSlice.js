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
} = actions;
export default reducer;
