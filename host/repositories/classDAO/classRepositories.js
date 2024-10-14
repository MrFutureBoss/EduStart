import User from "../../models/userModel.js";
import Class from "../../models/classModel.js";

const getStudentCountByClassId = async (classId, semesterId) => {
  try {
    const count = await User.countDocuments({
      classId: classId,
      semesterId: semesterId,
    });
    return count;
  } catch (error) {
    console.error(`Error getting student count by class ID: ${error.message}`);
    throw new Error(error.message);
  }
};

const getClassById = async (classId) => {
  try {
    const classData = await Class.findById(classId);
    return classData;
  } catch (error) {
    console.error(`Error in getClassById: ${error.message}`);
    throw new Error("Lỗi khi lấy thông tin lớp.");
  }
};

const getAvailableClasses = async (semesterId) => {
  try {
    const classes = await Class.find({ semesterId }).lean();
    const availableClasses = [];

    for (const cls of classes) {
      const studentCount = await User.countDocuments({ classId: cls._id });

      const remainingSlots = cls.limitStudent - studentCount;

      if (remainingSlots > 0) {
        availableClasses.push({
          ...cls,
          remainingSlots,
        });
      }
    }

    return availableClasses;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách lớp chưa đầy:", error);
    throw new Error("Lỗi khi lấy danh sách lớp chưa đầy.");
  }
};

export default {
  getStudentCountByClassId,
  getClassById,
  getAvailableClasses,
};

