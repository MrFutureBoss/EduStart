import groupDAO from "../../repositories/groupDAO/index.js";

const getProjectByGroupId = async (req, res) => {
  const { groupId } = req.params;
  console.log(groupId);

  try {
    const project = await groupDAO.getProjectByGroupId(groupId);
    if (!project) {
      return res.status(404).json({ message: error.message });
    }
    res.status(200).json(project);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin dự án:", error);
    res.status(500).json({ message: error.message });
  }
};

const getInforGroupById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const groupInfo = await groupDAO.getGroupById(id);
    res.send(groupInfo);
  } catch (error) {
    console.error("Error fetching group info:", error);
    next(error);
  }
};

const getGroupsByClassId = async (req, res, next) => {
  try {
    const { classId, semesterId } = req.params;

    const result = await groupDAO.getGroupsByClassId(classId, semesterId);

    if (result.groups.length === 0) {
      return res
        .status(404)
        .json({ message: "No groups found for this classId" });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching groups by classId:", error);
    res.status(500).json({ message: error.message });
  }
};

const getGroupsByClassIds = async (req, res, next) => {
  try {
    const { classIds } = req.body;

    if (!Array.isArray(classIds) || !classIds.length) {
      return res
        .status(400)
        .json({ message: "classIds should be a non-empty array" });
    }

    const groups = await groupDAO.getGroupsByClassIds(classIds);

    if (!groups.length) {
      return res
        .status(404)
        .json({ message: "No groups found for these classIds" });
    }

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error fetching groups by classIds:", error);
    next(error);
  }
};

const getAllUserByClassId = async (req, res) => {
  try {
    const { classId } = req.params;

    const result = await groupDAO.getAllUserByClassId(classId);

    if (result.students.length === 0) {
      return res
        .status(404)
        .json({ message: "No users found for this classId" });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching users by classId:", error);
    res.status(500).json({ message: error.message });
  }
};

const patchGroup = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No update data provided" });
    }

    const updatedGroup = await groupDAO.updateGroupById(id, updateData);

    res.status(200).json({
      message: "Group updated successfully",
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Error in patchGroup:", error.message);
    if (error.message === "Group not found") {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
};

export default {
  getProjectByGroupId,
  getInforGroupById,
  getGroupsByClassId,
  getGroupsByClassIds,
  getAllUserByClassId,
  patchGroup,
};
