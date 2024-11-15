import createGroupSettingDAO from "../../repositories/CreateGroupSettingDAO/index.js";

const createCreateGroupSettingWithTempGroup = async (req, res, next) => {
  try {
    // Log the raw request body to see what is being received
    console.log("Raw request body:", req.body);

    const data = req.body.createGroupSettingData; // Expected structure for createGroupSettingData
    const tempGroupsData = req.body.tempGroupsData; // Expected structure for tempGroupsData

    // Check if data or tempGroupsData are undefined
    if (!data) {
      console.error("Data (createGroupSettingData) is undefined");
      return res
        .status(400)
        .json({ success: false, message: "createGroupSettingData is missing" });
    }
    if (!tempGroupsData) {
      console.error("TempGroupsData is undefined");
      return res
        .status(400)
        .json({ success: false, message: "tempGroupsData is missing" });
    }

    console.log("Extracted createGroupSettingData:", data);
    console.log("Extracted tempGroupsData:", tempGroupsData);

    const result = await createGroupSettingDAO.createGroupSettingWithTempGroup(
      data,
      tempGroupsData
    );

    res.status(201).json(result);
  } catch (error) {
    console.error("Error in createCreateGroupSettingWithTempGroups:", error);
    next(error);
  }
};

const getCreateGroupSettingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const setting = await createGroupSettingDAO.getCreateGroupSettingById(id);

    if (!setting) {
      return res.status(404).json({ message: "CreateGroupSetting not found" });
    }

    res.status(200).json(setting);
  } catch (error) {
    next(error);
  }
};

const updateCreateGroupSetting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updatedSetting = await createGroupSettingDAO.updateCreateGroupSetting(
      id,
      data
    );

    if (!updatedSetting) {
      return res.status(404).json({ message: "CreateGroupSetting not found" });
    }

    res.status(200).json(updatedSetting);
  } catch (error) {
    next(error);
  }
};

const deleteCreateGroupSetting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedSetting = await createGroupSettingDAO.deleteCreateGroupSetting(
      id
    );

    if (!deletedSetting) {
      return res.status(404).json({ message: "CreateGroupSetting not found" });
    }

    res
      .status(200)
      .json({ message: "CreateGroupSetting deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const getAllCreateGroupSettings = async (req, res, next) => {
  try {
    const settings = await createGroupSettingDAO.getAllCreateGroupSettings();
    res.status(200).json(settings);
  } catch (error) {
    next(error);
  }
};

const getCreateGroupSettingByClassId = async (req, res, next) => {
  try {
    const { classId } = req.params; // Lấy classId từ URL params
    const settings = await createGroupSettingDAO.getCreateGroupSettingByClassId(
      classId
    );

    if (!settings || settings.length === 0) {
      return res.status(404).json({ message: "CreateGroupSetting not found" });
    }

    res.status(200).json(settings);
  } catch (error) {
    next(error);
  }
};

export default {
  createCreateGroupSettingWithTempGroup,
  getCreateGroupSettingById,
  updateCreateGroupSetting,
  deleteCreateGroupSetting,
  getAllCreateGroupSettings,
  getCreateGroupSettingByClassId,
};
