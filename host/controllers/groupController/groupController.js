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

export default {
  getProjectByGroupId,
  getInforGroupById,
};
