import CreateGroupSetting from "../../models/CreateGroupSetting.js";


const createGroupSetting = async (data) => {
  const newSetting = new CreateGroupSetting(data);
  return await newSetting.save();
};


const getCreateGroupSettingById = async (id) => {
  return await CreateGroupSetting.findById(id)
    .populate("classId")
    .populate("ruleJoin.ruleJoinId")
    .populate("tempGroupId");
};


const updateCreateGroupSetting = async (id, data) => {
  return await CreateGroupSetting.findByIdAndUpdate(id, data, {
    new: true,
  });
};


const deleteCreateGroupSetting = async (id) => {
  return await CreateGroupSetting.findByIdAndDelete(id);
};


const getAllCreateGroupSettings = async () => {
  return await CreateGroupSetting.find({})
    .populate("classId")
    .populate("ruleJoin.ruleJoinId")
    .populate("tempGroupId");
};

export default {
  createGroupSetting,
  getCreateGroupSettingById,
  updateCreateGroupSetting,
  deleteCreateGroupSetting,
  getAllCreateGroupSettings,
};
