import groupDAO from "../../repositories/groupDAO/index.js";
const getGroupsByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const groups = await groupDAO.getAllGroupsByTeacherId(teacherId);

    if (!groups || groups.length === 0) {
      throw new Error("Không có nhóm nào cho giáo viên này.");
    }

    return res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export default { getGroupsByTeacher };
