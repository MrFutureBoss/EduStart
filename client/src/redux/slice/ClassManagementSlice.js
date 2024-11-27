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
  classes: [],
  unassignedStudents: [],
  teachersList: [],
  selectedDropdown: null,
  swappedStudents: [],
  loading: false,
  error: null,
  filter: "all",
  searchValue: "",
  currentClassPage: 1,
  currentStudentPage: 1,
  isModalVisible: false,
  suggestionTriggered: false,
};

const classManagementSlice = createSlice({
  name: "classManagement",
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
    setClasses: (state, action) => {
      state.classes = action.payload;
    },
    setUnassignedStudents: (state, action) => {
      state.unassignedStudents = action.payload;
    },
    setTeachersList: (state, action) => {
      state.teachersList = action.payload;
    },
    setSelectedDropdown: (state, action) => {
      state.selectedDropdown = action.payload;
    },
    setSwappedStudents: (state, action) => {
      state.swappedStudents = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    setSearchValue: (state, action) => {
      state.searchValue = action.payload;
    },
    setCurrentClassPage: (state, action) => {
      state.currentClassPage = action.payload;
    },
    setCurrentStudentPage: (state, action) => {
      state.currentStudentPage = action.payload;
    },
    setIsModalVisible: (state, action) => {
      state.isModalVisible = action.payload;
    },
    setSuggestionTriggered: (state, action) => {
      state.suggestionTriggered = action.payload;
    },
    updateClass: (state, action) => {
      const updatedClass = action.payload;
      state.classes = state.classes.map((classItem) =>
        classItem._id === updatedClass._id ? updatedClass : classItem
      );
    },
    addClass: (state, action) => {
      state.classes.push(action.payload);
    },
    removeClass: (state, action) => {
      state.classes = state.classes.filter(
        (classItem) => classItem._id !== action.payload
      );
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
  setClasses,
  setUnassignedStudents,
  setTeachersList,
  setSelectedDropdown,
  setSwappedStudents,
  setError,
  setFilter,
  setSearchValue,
  setCurrentClassPage,
  setCurrentStudentPage,
  setIsModalVisible,
  setSuggestionTriggered,
  updateClass,
  addClass,
  removeClass,
} = actions;
export default reducer;
