import { createSlice } from "@reduxjs/toolkit";
const initialValue = {
  users: {},
  userProfile: {},
  userRegister: {},
  userLogin: {},
  filterRole: 0,
  searchValue: "",
  sort: -1,
  pageNo: 0,
  userWithoutSemester: {
    data: [],
    count: 0,
  },
  selectUser: [],
  pmtUser: {
    usersByMonth: [],
    countStudent: 0,
    countMentor: 0,
    countAdmin: 0,
    countTeacher: 0,
  },
  selectAll: {
    type: 0,
    payload: false,
  },
  defaultMentor: "",
  role: 4,
  user: {},
  delUser: {},
  groupsMatched: {},
  forgotPassword: {
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
    step: 1,
  },
  recentlyUpdatedUsers: [],
  selectedRole: null,
};
const usersSlice = createSlice({
  name: "user",
  initialState: initialValue,
  reducers: {
    setUserLogin: (state, action) => {
      state.userLogin = action.payload;
    },
    setUsers: (state, action) => {
      state.users = action.payload;
    },
    setFilterRole: (state, action) => {
      state.filterRole = action.payload;
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
    setUserWithoutSemester: (state, action) => {
      state.userWithoutSemester = action.payload;
    },
    setSelectUser: (state, action) => {
      state.selectUser = action.payload;
    },
    setPmtUser: (state, action) => {
      state.pmtUser = action.payload;
    },
    setSelectAll: (state, action) => {
      state.selectAll = action.payload;
    },
    setDefaultMentor: (state, action) => {
      state.defaultMentor = action.payload;
    },
    setRole: (state, action) => {
      state.role = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setUserProfile: (state, action) => {
      state.userProfile = action.payload;
    },
    setDelUser: (state, action) => {
      state.delUser = action.payload;
    },
    setGroupsMatched: (state, action) => {
      state.groupsMatched = action.payload;
    },
    setRecentlyUpdatedUsers: (state, action) => {
      state.recentlyUpdatedUsers = action.payload;
    },
    setForgotPassword: (state, action) => {
      state.forgotPassword = {
        ...state.forgotPassword,
        ...action.payload,
      };
    },
    setRoleSelect: (state, action) => {
      state.selectedRole = action.payload;
    },
    clearRoleSelect: (state) => {
      state.selectedRole = null;
    },
  },
});

const { reducer, actions } = usersSlice;
export const {
  setUserLogin,
  setUsers,
  setFilterRole,
  setSearchValue,
  setSort,
  setPageNo,
  setUserWithoutSemester,
  setSelectUser,
  setPmtUser,
  setSelectAll,
  setDefaultMentor,
  setRole,
  setUser,
  setDelUser,
  setUserProfile,
  setGroupsMatched,
  setForgotPassword,
  setRecentlyUpdatedUsers,
  setRoleSelect,
  clearRoleSelect,
} = actions;
export default reducer;
