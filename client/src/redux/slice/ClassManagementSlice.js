import { createSlice } from "@reduxjs/toolkit";

// Define the initial state based on the API response structure
const initialState = {
  teacher: {
    _id: "",
    username: "",
    email: "",
    password: "",
    role: null,
    phoneNumber: "",
    semesterId: [],
    status: "",
    rollNumber: "",
    memberCode: "",
    createdAt: "",
    updatedAt: "",
    groupId: [],
    project: [],
    matched: [],
    mentor: [],
    classList: [],
  },
  loading: false,
  error: null,
};

const classManagementSlice = createSlice({
  name: "classmanagement",
  initialState,
  reducers: {
    // Action to start loading data
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    // Action to load the teacher and class data
    setTeacherData(state, action) {
      state.teacher = action.payload;
    },
  },
});

const { reducer, actions } = classManagementSlice;
export const {
  setLoading,
  setTeacherData,
} = actions;
export default reducer;
