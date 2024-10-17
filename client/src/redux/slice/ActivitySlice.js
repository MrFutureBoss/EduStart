import { createSlice } from "@reduxjs/toolkit";

const initialValue = {
  activities: [],
  activityList: [],
  searchValue: "",
  sort: -1,
  deleteActivity: {},
  editActivity: {},
  pageNo: 0,
  activity: {},
  loading: false,
  error: null,
  materials: [],
  isModalVisible: false,
  fileToUpload: null,
  title: "",
  description: "",
  uploading: false,
  uploadPercent: 0,
  selectedClassId: null,
  selectedClassName: "",
  fileList: [],
};

const activitySlice = createSlice({
  name: "activities",
  initialState: initialValue,
  reducers: {
    setActivities: (state, action) => {
      state.activities = action.payload;
    },
    setActivityList: (state, action) => {
      state.activityList = action.payload;
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
    setDeleteActivity: (state, action) => {
      state.deleteActivity = action.payload;
    },
    setEditActivity: (state, action) => {
      state.editActivity = action.payload;
    },
    setActivity: (state, action) => {
      state.activity = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    addActivity: (state, action) => {
      state.activities.push(action.payload);
    },
    deleteActivityById: (state, action) => {
      state.activities = state.activities.filter(
        (activity) => activity._id !== action.payload
      );
    },
    setMaterials: (state, action) => {
      state.materials = action.payload;
    },
    setIsModalVisible: (state, action) => {
      state.isModalVisible = action.payload;
    },
    setFileToUpload: (state, action) => {
      state.fileToUpload = action.payload;
    },
    setTitle: (state, action) => {
      state.title = action.payload;
    },
    setDescription: (state, action) => {
      state.description = action.payload;
    },
    setUploading: (state, action) => {
      state.uploading = action.payload;
    },
    setUploadPercent: (state, action) => {
      state.uploadPercent = action.payload;
    },
    setSelectedClassId: (state, action) => {
      state.selectedClassId = action.payload;
    },
    setSelectedClassName: (state, action) => {
      state.selectedClassName = action.payload;
    },
    setFileList: (state, action) => {
      state.fileList = action.payload;
    },
  },
});

export const {
  setActivities,
  setActivityList,
  setSearchValue,
  setSort,
  setPageNo,
  setDeleteActivity,
  setEditActivity,
  setActivity,
  setLoading,
  setError,
  addActivity,
  deleteActivityById,
  setMaterials,
  setIsModalVisible,
  setFileToUpload,
  setTitle,
  setDescription,
  setUploading,
  setUploadPercent,
  setSelectedClassId,
  setSelectedClassName,
  setFileList,
} = activitySlice.actions;

export default activitySlice.reducer;
