import createGroupSettingDAO from "../../repositories/CreateGroupSettingDAO/index.js";

const createCreateGroupSetting = async (req, res, next) => {
  try {
    const data = req.body;
    const newSetting = await createGroupSettingDAO.createGroupSetting(data);
    res.status(201).json(newSetting);
  } catch (error) {
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
    const updatedSetting = await createGroupSettingDAO.updateCreateGroupSetting(id, data);

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
    const deletedSetting = await createGroupSettingDAO.deleteCreateGroupSetting(id);

    if (!deletedSetting) {
      return res.status(404).json({ message: "CreateGroupSetting not found" });
    }

    res.status(200).json({ message: "CreateGroupSetting deleted successfully" });
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

export default {
  createCreateGroupSetting,
  getCreateGroupSettingById,
  updateCreateGroupSetting,
  deleteCreateGroupSetting,
  getAllCreateGroupSettings,
};
