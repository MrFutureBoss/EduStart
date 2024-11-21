import { createSlice } from "@reduxjs/toolkit";

const matchedGroupSlice = createSlice({
  name: "matchedGroup",
  initialState: {
    data: [],
    total: 0,
  },
  reducers: {
    setMatchedGroups: (state, action) => {
      state.data = action.payload;
    },
    setTotalMatchedGroups: (state, action) => {
      state.total = action.payload;
    },
  },
});

export const { setMatchedGroups, setTotalMatchedGroups } =
  matchedGroupSlice.actions;

export default matchedGroupSlice.reducer;
