import User from "../../models/userModel.js";
import Class from "../../models/classModel.js";
import TempGroup from "../../models/tempGroupModel.js";
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
const getClassesByUserId = async (userId) => {
  try {
    return await Class.find({ teacherId: userId });
  } catch (error) {
    throw new Error(error.message);
  }
};

const createClass = async ({
  className,
  limitStudent,
  teacherId,
  semesterId,
  status,
}) => {
  const newClass = new Class({
    className,
    limitStudent,
    teacherId,
    semesterId,
    status,
  });

  // Save the new class
  return await newClass.save();
};

const isClassNameExist = async (className) => {
  try {
    const existingClass = await Class.findOne({ className });

    return existingClass !== null;
  } catch (error) {
    console.error(`Error checking class name existence: ${error.message}`);
    throw new Error(error.message);
  }
};

const getFullClasses = async (semesterId) => {
  try {
    const fullClasses = await Class.find({
      semesterId: semesterId,
      status: "Active",
    }).populate("teacherId", "username email");
    const classesWithStudents = await Promise.all(
      fullClasses.map(async (cls) => {
        const studentCount = await User.countDocuments({
          classId: cls._id,
          role: 4,
        });
        return {
          ...cls.toObject(),
          studentCount,
          isFull: studentCount >= cls.limitStudent,
        };
      })
    );

    // Lọc ra các lớp đã đầy
    const fullClassesFiltered = classesWithStudents.filter((cls) => cls.isFull);

    return fullClassesFiltered;
  } catch (error) {
    throw new Error("Error fetching full classes: " + error.message);
  }
};

const getTeachersWithClassCount = async () => {
  try {
    // Tìm tất cả giáo viên (role = 2)
    const teachers = await User.find({ role: 2 }).select("username email");

    // Đếm số lớp đã dạy cho mỗi giáo viên
    const teachersWithClassCount = await Promise.all(
      teachers.map(async (teacher) => {
        const classCount = await Class.countDocuments({
          teacherId: teacher._id,
          status: "Active", // Giả định rằng chỉ các lớp Active được tính
        });
        return {
          ...teacher.toObject(),
          classCount,
        };
      })
    );

    return teachersWithClassCount;
  } catch (error) {
    throw new Error("Error fetching teachers: " + error.message);
  }
};

const getClassIdByClassName = async (className) => {
  try {
    const classData = await Class.findOne({
      className: { $regex: className, $options: "i" },
    }).exec();
    if (!classData) {
      return null;
    }
    return classData._id;
  } catch (error) {
    throw new Error(error.message || "Error while fetching class by className");
  }
};

const getUsersByClassIdAndEmptyGroupId = async (classId, skip = 0, limit = 10) => {
  try {
    const tempGroups = await TempGroup.find({ classId }).select("userIds").lean();
    const excludedUserIds = tempGroups.reduce((acc, group) => acc.concat(group.userIds), []);

    const query = {
      classId: classId,
      $or: [
        { groupId: { $exists: false } },
        { groupId: null },
      ],
      _id: { $nin: excludedUserIds },
    };

    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .select("username email rollNumber memberCode")
      .skip(skip)
      .limit(limit)
      .lean();

    return { data: users, total };
  } catch (error) {
    throw new Error(error.message);
  }
};

export default {
  getStudentCountByClassId,
  getClassById,
  getAvailableClasses,
  getClassesByUserId,
  createClass,
  isClassNameExist,
  getFullClasses,
  getTeachersWithClassCount,
  getClassIdByClassName,
  getUsersByClassIdAndEmptyGroupId,
};
