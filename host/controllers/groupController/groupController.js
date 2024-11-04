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
export default {
  getProjectByGroupId,
};
