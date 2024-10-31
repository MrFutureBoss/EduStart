import groupDAO from "../../repositories/groupDAO/index.js";
import teacherDAO from "../../repositories/teacherDAO/index.js";
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
const saveTeacherSelection = async (req, res) => {
  try {
    const { teacherId, professionId, specialtyId, selectedMentors } = req.body;

    // Gọi trực tiếp hàm saveSelection từ teacherDAO
    const result = await teacherDAO.saveSelection({
      teacherId,
      professionId,
      specialtyId,
      selectedMentors, // Danh sách mentor với thứ tự ưu tiên
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message, error });
  }
};

const getTeacherSelection = async (req, res) => {
  try {
    const { teacherId, professionId, specialtyId } = req.query;

    // Tìm tất cả lựa chọn của giáo viên dựa trên professionId và specialtyId
    const selection = await teacherDAO.getSelection({
      teacherId,
      professionId,
      specialtyId,
    });

    if (!selection) {
      return res.status(404).json({ message: "Không tìm thấy lựa chọn" });
    }

    res.json(selection);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

export default {
  getGroupsByTeacher,
  saveTeacherSelection,
  getTeacherSelection,
};
