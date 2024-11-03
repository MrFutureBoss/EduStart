import { createSlice } from "@reduxjs/toolkit";
const initialValue = {
  rulejoins: [],
  settingcreategroups: [],
};

const settingCreateGroupSlice = createSlice({
  name: "settingcreategroup",
  initialState: initialValue,
  reducers: {
    setRuleToJoin: (state, action) => {
      state.rulejoins = action.payload;
    },
    setSettingCreateGroupData: (state, action) => {
      state.settingcreategroups = action.payload;
    },
  },
});

export const { setRuleToJoin, setSettingCreateGroupData } =
  settingCreateGroupSlice.actions;
export default settingCreateGroupSlice.reducer;
