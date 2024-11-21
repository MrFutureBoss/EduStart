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

  classinfo: {
    semesters: [],
    classes: [],
    totalClasses: 0,
    totalStudents: 0,
  },

  classtask: {},
  studentsInClass: {},
  totalStudentInClass: 0,

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
    //Action to load class information
    setClassInfoData(state, action) {
      state.classinfo = action.payload;
    },
    setClassTaskData(state, action) {
      state.classtask = action.payload;
    },
    setStudentInClass(state, action) {
      state.studentsInClass = action.payload;
    },
    setTotalStudentInClass(state, action) {
      state.totalStudentInClass = action.payload;
    },
  },
});

const { reducer, actions } = classManagementSlice;
export const {
  setLoading,
  setTeacherData,
  setClassInfoData,
  setClassTaskData,
  setStudentInClass,
  setTotalStudentInClass,
} = actions;
export default reducer;
