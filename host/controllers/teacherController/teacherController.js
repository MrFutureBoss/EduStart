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

// update phone number teacher 

const updateTeacherPhoneNumber = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại không được để trống",
      });
    }

    const updatedTeacher = await teacherDAO.updatePhoneNumberTeacher(teacherId, phoneNumber);

    if (!updatedTeacher) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giáo viên",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật số điện thoại thành công",
      data: updatedTeacher,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};




export default {
  getGroupsByTeacher,
  saveTeacherSelection,
  getTeacherSelection,
  updateTeacherPhoneNumber
};
