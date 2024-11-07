import CreateGroupSetting from "../../models/CreateGroupSettingModel.js";
import TempGroup from "../../models/tempGroupModel.js";

const createGroupSettingWithTempGroup = async (data, tempGroupsData) => {
  try {
    data.tempGroupId = [];

    const tempGroupPromises = tempGroupsData.map((tempGroupData) => {
      const tempGroup = new TempGroup(tempGroupData);
      return tempGroup.save();
    });

    const savedTempGroups = await Promise.all(tempGroupPromises);
    const tempGroupIds = savedTempGroups.map((group) => group._id);

    data.tempGroupId = tempGroupIds;
    const newSetting = new CreateGroupSetting(data);
    const savedSetting = await newSetting.save();

    return { savedSetting, savedTempGroups };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
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

const getCreateGroupSettingByClassId = async (classId) => {
  return await CreateGroupSetting.find({ classId })
    .populate("classId")
    .populate("ruleJoin")
    .populate("tempGroupId");
};

export default {
  createGroupSettingWithTempGroup,
  getCreateGroupSettingById,
  updateCreateGroupSetting,
  deleteCreateGroupSetting,
  getAllCreateGroupSettings,
  getCreateGroupSettingByClassId
};
