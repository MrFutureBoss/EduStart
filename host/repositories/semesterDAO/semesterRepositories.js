import moment from "moment";
import Class from "../../models/classModel.js";
import Matched from "../../models/matchedModel.js";
import MentorCategory from "../../models/mentorCategoryModel.js";
import Semester from "../../models/semesterModel.js";
import User from "../../models/userModel.js";
import mongoose from "mongoose";
import Profession from "../../models/professionModel.js";
import Specialty from "../../models/specialtyModel.js";

const createSemester = async (semesterData) => {
  const semester = new Semester(semesterData);
  return await semester.save();
};

const getAllSemesters = async () => {
  try {
    const semesters = await Semester.find();

    const semestersWithCounts = await Promise.all(
      semesters.map(async (semester) => {
        const studentCount = await User.countDocuments({
          semesterId: semester._id,
          role: 4,
        });
        const teacherCount = await User.countDocuments({
          semesterId: semester._id,
          role: 2,
        });
        const mentorCount = await User.countDocuments({
          semesterId: semester._id,
          role: 3,
        });
        const classCount = await Class.countDocuments({
          semesterId: semester._id,
        });

        return {
          ...semester.toObject(),
          studentCount,
          teacherCount,
          mentorCount,
          classCount,
        };
      })
    );

    return semestersWithCounts;
  } catch (error) {
    throw new Error(
      "Error in fetching semester data with counts: " + error.message
    );
  }
};

const getOverlappingSemester = async (startDate, endDate) => {
  return await Semester.find({
    $or: [
      { startDate: { $lte: endDate, $gte: startDate } },
      { endDate: { $lte: endDate, $gte: startDate } },
      { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
    ],
  });
};

const getSemesterByName = async (name) => {
  return await Semester.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") },
  });
};

const updateSemesterStatus = async (semesterId, status) => {
  return await Semester.findByIdAndUpdate(
    semesterId,
    { status },
    { new: true }
  );
};

const updateUserStatusBySemesterId = async (semesterId, status) => {
  return await User.updateMany({ semesterId }, { status });
};

const updateSemester = async (semesterId, updateData) => {
  return await Semester.findByIdAndUpdate(semesterId, updateData, {
    new: true,
  });
};

const getUsersBySemesterId = async (semesterId) => {
  try {
    const users = await User.find({ semesterId })
      .populate({
        path: "classId",
        select: "className",
      })
      .lean();

    const mentorIds = users
      .filter((user) => user.role === 3)
      .map((user) => user._id);

    const mentorCategories = await MentorCategory.find({
      mentorId: { $in: mentorIds },
    })
      .populate({
        path: "specialties.specialtyId",
        model: "Specialty",
        select: "name",
      })
      .populate({
        path: "professionIds",
        model: "Profession",
        select: "name",
      });

    const teacherIds = users
      .filter((user) => user.role === 2)
      .map((user) => user._id);

    const teacherClasses = await Class.find({ teacherId: { $in: teacherIds } });

    const usersWithAdditionalInfo = users.map((user) => {
      if (user.role === 3) {
        const mentorCategory = mentorCategories.find((mc) =>
          mc.mentorId.equals(user._id)
        );
        if (mentorCategory) {
          user.mentorCategoryInfo = {
            profession: mentorCategory.professionId?.name || "N/A",
            specialties: mentorCategory.specialties
              .map((spec) => spec.specialtyId?.name || "Unknown Specialty")
              .join(", "),
          };
        } else {
          user.mentorCategoryInfo = {};
        }
      } else if (user.role === 2) {
        user.classesTeaching = Array.isArray(teacherClasses)
          ? teacherClasses
              .filter((cls) => cls.teacherId.equals(user._id))
              .map((cls) => ({
                classId: cls._id,
                className: cls.className || cls.name || "Unknown Class Name",
              }))
          : [];
      }
      return user;
    });

    return usersWithAdditionalInfo;
  } catch (error) {
    console.error("Error in getUsersBySemesterId:", error);
    throw new Error("Lỗi khi lấy danh sách người dùng theo kỳ học.");
  }
};

const findSemesterFinished = async (semesterIds) => {
  try {
    const finishedSemesters = await Semester.find({
      _id: { $in: semesterIds },
      status: "Finished",
    }).exec();
    return finishedSemesters;
  } catch (error) {
    console.error(`Error in findSemesterFinished: ${error.message}`);
    throw new Error(error.message); // Thay vì throw, nên chuyển lỗi tới middleware
  }
};
const getCurrentSemester = async () => {
  const currentDate = new Date();

  // Tính toán ngày bắt đầu hiệu chỉnh (startDate - 15 ngày)
  const adjustedDate = new Date(currentDate);
  adjustedDate.setDate(currentDate.getDate() + 15);

  // Tìm kỳ học hiện tại
  const semester = await Semester.findOne({
    startDate: { $lte: adjustedDate }, // startDate <= currentDate + 15
    endDate: { $gte: currentDate }, // endDate >= currentDate
  });

  if (!semester) {
    return null; // Không tìm thấy kỳ học
  }

  return semester; // Trả về kỳ học hiện tại
};

const getCountsForSemester = async (semesterId) => {
  // Đếm số lượng sinh viên, giáo viên và mentor
  const studentCount = await User.countDocuments({ semesterId, role: 4 });
  const teacherCount = await User.countDocuments({ semesterId, role: 2 });
  const mentorCount = await User.countDocuments({ semesterId, role: 3 });
  const classCount = await Class.countDocuments({ semesterId });

  // Đếm số lượng học sinh đã có lớp và học sinh chưa có lớp
  const studentsWithClass = await User.countDocuments({
    semesterId,
    role: 4,
    classId: { $ne: null },
  });
  const studentsWithoutClass = studentCount - studentsWithClass;

  // Đếm số lượng giáo viên có lớp và giáo viên chưa có lớp
  const teachersWithClass = await Class.distinct("teacherId", { semesterId });
  const teachersWithClassCount = await User.countDocuments({
    _id: { $in: teachersWithClass },
    role: 2,
  });
  const teachersWithoutClassCount = teacherCount - teachersWithClassCount;

  // Lấy danh sách giáo viên có lớp và chưa có lớp
  const teachersWithClasses = await User.find({
    _id: { $in: teachersWithClass },
    role: 2,
  });
  const teachersWithoutClasses = await User.find({
    _id: { $nin: teachersWithClass },
    role: 2,
    semesterId,
  });

  // Đếm và lấy danh sách lớp có học sinh và lớp chưa có học sinh
  const classesWithStudents = await Class.aggregate([
    { $match: { semesterId: new mongoose.Types.ObjectId(semesterId) } },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "classId",
        as: "students",
      },
    },
    {
      $project: {
        className: 1,
        studentCount: { $size: "$students" },
      },
    },
  ]);

  const classesWithStudentsList = classesWithStudents.filter(
    (cls) => cls.studentCount > 0
  );
  const classesWithoutStudentsList = classesWithStudents.filter(
    (cls) => cls.studentCount === 0
  );

  const classesWithStudentsCount = classesWithStudentsList.length;
  const classesWithoutStudentsCount = classCount - classesWithStudentsCount;

  // Lấy danh sách mentor đã matched và chưa matched
  const matchedMentorIds = await Matched.distinct("mentorId", {
    semesterId,
  });

  const mentorsWithMatch = await User.find({
    _id: { $in: matchedMentorIds },
    role: 3,
    semesterId,
  });

  const mentorsWithoutMatch = await User.find({
    _id: { $nin: matchedMentorIds },
    role: 3,
    semesterId,
  });

  return {
    studentCount,
    teacherCount,
    mentorCount,
    classCount,
    studentsWithClass,
    studentsWithoutClass,
    teachersWithClassCount,
    teachersWithoutClassCount,
    classesWithStudentsCount,
    classesWithoutStudentsCount,
    classesWithStudentsList, // Danh sách lớp có học sinh
    classesWithoutStudentsList, // Danh sách lớp chưa có học sinh
    teachersWithClasses, // Danh sách giáo viên có lớp
    teachersWithoutClasses, // Danh sách giáo viên chưa có lớp
    mentorsWithMatch, // Danh sách mentor đã matched
    mentorsWithoutMatch, // Danh sách mentor chưa matched
  };
};

const findUpcomingSemesterWithinDays = async (days) => {
  const today = moment().startOf("day").toDate();
  const futureDate = moment().add(days, "days").endOf("day").toDate();
  return Semester.findOne({
    startDate: { $gte: today, $lte: futureDate },
  }).sort({ startDate: 1 });
};

const findTeachersInSemester = async (semesterId) => {
  return User.find({
    role: 2,
    semesterId: semesterId,
  });
};
const findMentorsInSemester = async (semesterId) => {
  return User.find({
    role: 3,
    semesterId: semesterId,
  });
};
const findStudentsInSemester = async (semesterId) => {
  return User.find({
    role: 4,
    semesterId: semesterId,
  });
};
const findStudentsInSemesterStatus = async (semesterId) => {
  return User.find({
    role: 4,
    semesterId: semesterId,
    $or: [
      { classId: { $exists: false } }, // classId không tồn tại
      { classId: null }, // hoặc classId là null
    ],
  }).populate("semesterId"); // Populates semester details
};

const getClassCapacityStatus = async (semesterId) => {
  try {
    const classes = await Class.find({
      semesterId,
    }).lean();

    const classesStatus = await Promise.all(
      classes.map(async (classItem) => {
        const studentCount = await User.countDocuments({
          classId: classItem._id,
        });

        const status = studentCount < 20 ? "chưa đủ" : "đã đủ";

        return {
          ...classItem,
          studentCount,
          status,
        };
      })
    );

    return classesStatus;
  } catch (error) {
    console.error("Lỗi khi kiểm tra tình trạng lớp học:", error);
    throw error;
  }
};

const findTeachersWithoutClass = async (semesterId) => {
  try {
    const teachersInCurrentSemester = await User.find({
      role: "2",
      semesterId,
    })
      .select("_id username")
      .lean();

    const teachersWithClasses = (
      await Class.distinct("teacherId", {
        semesterId: semesterId,
      })
    ).map((id) => id.toString());

    const teachersWithoutClass = teachersInCurrentSemester.filter(
      (teacher) => !teachersWithClasses.includes(teacher._id.toString())
    );

    return teachersWithoutClass;
  } catch (error) {
    console.error(
      "Lỗi khi tìm giáo viên chưa có lớp trong kỳ học hiện tại:",
      error
    );
    throw error;
  }
};

const getTeachersInCurrentSemester = async (semesterId) => {
  try {
    const teachers = await User.find({ role: 2, semesterId })
      .select("_id username email")
      .lean();
    return teachers;
  } catch (error) {
    console.error("Error fetching teachers in current semester:", error);
    throw error;
  }
};
const getSemesterByStatus = async (status) => {
  try {
    return await Semester.findOne({ status });
  } catch (error) {
    throw new Error("Error fetching semester by status");
  }
};
const getSemesterById = async (semesterId) => {
  try {
    const semester = await Semester.findOne({ _id: semesterId });
    if (!semester) {
      throw new Error("Kỳ học không tồn tại.");
    }
    return semester;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin kỳ học:", error);
    throw new Error(error.message || "Không thể lấy thông tin kỳ học.");
  }
};

const updateClassStatusBySemesterId = async (semesterId, status) => {
  try {
    const result = await Class.updateMany(
      { semesterId }, // Điều kiện: Các lớp thuộc kỳ học
      { $set: { status } } // Cập nhật trạng thái
    );
    return result; // Trả về kết quả cập nhật
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái lớp học:", error);
    throw new Error("Lỗi khi cập nhật trạng thái lớp học.");
  }
};

const checkDataExistence = async () => {
  try {
    const results = {};

    // Kiểm tra ngành nghề (ProfessionModel)
    const professionCount = await Profession.countDocuments();
    if (professionCount === 0) {
      results.profession =
        "Không có lĩnh vực nào được tìm thấy trong hệ thống.";
    } else {
      results.profession = `${professionCount} lĩnh vực được tìm thấy trong hệ thống.`;
    }

    // Kiểm tra chuyên môn (SpecialtyModel)
    const specialtyCount = await Specialty.countDocuments();
    if (specialtyCount === 0) {
      results.specialty =
        "Không có chuyên môn nào được tìm thấy trong hệ thống.";
    } else {
      results.specialty = `${specialtyCount} chuyên môn được tìm thấy trong hệ thống.`;
    }

    // Trả về kết quả kiểm tra
    return results;
  } catch (error) {
    throw new Error(`Error checking data existence: ${error.message}`);
  }
};

export default {
  createSemester,
  getAllSemesters,
  getOverlappingSemester,
  updateSemesterStatus,
  updateUserStatusBySemesterId,
  getSemesterByName,
  updateSemester,
  getUsersBySemesterId,
  findSemesterFinished,
  getCurrentSemester,
  getCountsForSemester,
  findUpcomingSemesterWithinDays,
  findTeachersInSemester,
  findMentorsInSemester,
  findStudentsInSemester,
  findStudentsInSemesterStatus,
  getClassCapacityStatus,
  findTeachersWithoutClass,
  getTeachersInCurrentSemester,
  getSemesterByStatus,
  updateClassStatusBySemesterId,
  getSemesterById,
  checkDataExistence,
};
