import User from "../../models/userModel.js";
import Class from "../../models/classModel.js";
import TempGroup from "../../models/tempGroupModel.js";
import Group from "../../models/groupModel.js";
import Project from "../../models/projectModel.js";
import Matched from "../../models/matchedModel.js";
import ProjectCategory from "../../models/projectCategoryModel.js";
import Semester from "../../models/semesterModel.js";

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
    status: "Active",
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
          status: "Active",
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

const getUsersByClassIdAndEmptyGroupId = async (
  classId,
  skip = 0,
  limit = 10
) => {
  try {
    const tempGroups = await TempGroup.find({ classId })
      .select("userIds")
      .lean();
    const excludedUserIds = tempGroups.reduce(
      (acc, group) => acc.concat(group.userIds),
      []
    );

    const query = {
      classId: classId,
      $or: [{ groupId: { $exists: false } }, { groupId: null }],
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
// hàm này để tìm các dự án theo lớp đã được giáo viên duyệt
const findProjectsByTeacherAndClass = async (teacherId, classId) => {
  try {
    // Kiểm tra xem lớp học có tồn tại với giáo viên cụ thể không
    const classData = await Class.findOne({ _id: classId, teacherId });
    if (!classData) {
      throw new Error("Không tìm thấy lớp học với giáo viên này.");
    }

    // Tìm các nhóm trong lớp học đó và populate projectId với điều kiện project.status = "InProgress"
    const groups = await Group.find({ classId }).populate({
      path: "projectId",
      match: { status: "InProgress" },
    });

    const validGroups = groups.filter((group) => group.projectId != null);

    if (validGroups.length === 0) {
      return [];
    }

    const groupIds = validGroups.map((group) => group._id);

    const matchedDocs = await Matched.find({
      groupId: { $in: groupIds },
    })
      .select("groupId status")
      .lean();

    const matchedMap = new Map();
    matchedDocs.forEach((doc) => {
      matchedMap.set(doc.groupId.toString(), doc.status);
    });

    // Tìm các dự án và thêm thông tin về việc đã được matched hay chưa và trạng thái của việc matched
    const projects = await Promise.all(
      validGroups.map(async (group) => {
        // Tìm ProjectCategory tương ứng với projectId của nhóm
        const projectCategory = await ProjectCategory.findOne({
          projectId: group.projectId._id,
        })
          .populate([
            {
              path: "professionId",
              model: "Profession",
              select: "name",
            },
            {
              path: "specialtyIds",
              model: "Specialty",
              select: "name",
            },
          ])
          .lean();

        // Kiểm tra nếu group này đã matched
        const groupIdStr = group._id.toString();
        const isMatched = matchedMap.has(groupIdStr);
        const statusMatched = isMatched ? matchedMap.get(groupIdStr) : null;

        // Trả về thông tin project cùng với groupId, projectCategory, isMatched và status
        return {
          ...group.projectId.toObject(),
          groupId: group._id,
          projectCategory: projectCategory || null,
          isMatched,
          statusMatched,
        };
      })
    );

    return projects;
  } catch (error) {
    console.error("Error in findProjectsByTeacherAndClass:", error);
    throw error;
  }
};

const findTeacherClassSummary = async (teacherId) => {
  const classes = await Class.find({ teacherId });

  const classSummaries = await Promise.all(
    classes.map(async (classItem) => {
      const groups = await Group.find({ classId: classItem._id });

      if (groups.length === 0) {
        return {
          classId: classItem._id,
          className: classItem.className,
          matchedCount: 0,
          unmatchedCount: 0,
          isFullyMatched: false,
          groupDetails: [],
          isEmpty: true,
          groupsWithoutProject: [], // Đảm bảo luôn là mảng
        };
      }

      const matchedGroupData = await Matched.find({
        groupId: { $in: groups.map((group) => group._id) },
      });

      const matchedGroupIds = matchedGroupData.map((matched) =>
        matched.groupId.toString()
      );
      const matchedCount = groups.filter((group) =>
        matchedGroupIds.includes(group._id.toString())
      ).length;
      const unmatchedCount = groups.length - matchedCount;
      const isFullyMatched = unmatchedCount === 0;

      let groupsWithoutProject = [];

      const groupDetails = await Promise.all(
        groups.map(async (group) => {
          const isProjectUpdated = !!group.projectId;

          let projectDetails = null;
          if (isProjectUpdated) {
            const project = await Project.findById(group.projectId);
            if (project) {
              projectDetails = {
                projectId: project._id,
                projectName: project.name,
                projectStatus: project.status,
              };
            }
          } else {
            groupsWithoutProject.push({
              groupId: group._id,
              groupName: group.name,
            });
          }

          const matchedData = matchedGroupData.find(
            (matched) => matched.groupId.toString() === group._id.toString()
          );
          const isMatched = !!matchedData;
          const matchStatus = isMatched ? matchedData.status : null;

          return {
            groupId: group._id,
            groupName: group.name,
            isMatched,
            matchStatus, // Trạng thái của nhóm được ghép
            isProjectUpdated,
            projectDetails,
          };
        })
      );

      return {
        classId: classItem._id,
        className: classItem.className,
        matchedCount,
        unmatchedCount,
        isFullyMatched,
        groupDetails,
        isEmpty: false,
        groupsWithoutProject,
      };
    })
  );

  // Đảm bảo luôn trả về đối tượng có `classSummaries`
  return { classSummaries };
};

const getSemestersAndClassesByTeacherId = async (teacherId) => {
  try {
    // Lấy thông tin người dùng với teacherId và các semesterId
    const user = await User.findById(teacherId).select("semesterId");
    const semesterIds = user?.semesterId || [];

    // Tìm kiếm thông tin semester dựa trên semesterIds
    const semesters = await Semester.find({ _id: { $in: semesterIds } });

    // Tìm kiếm tất cả các lớp học mà teacherId là giáo viên
    const classes = await Class.find({ teacherId }).populate(
      "semesterId",
      "name status startDate endDate"
    );

    // Tính tổng số lớp và tổng số sinh viên
    let totalStudents = 0;

    const classesWithStudentCount = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = await User.countDocuments({ classId: cls._id });
        totalStudents += studentCount;
        return {
          ...cls.toObject(),
          totalStudentsInClass: studentCount,
        };
      })
    );

    const totalClasses = classes.length;

    return {
      semesters,
      classes: classesWithStudentCount,
      totalClasses,
      totalStudents,
    };
  } catch (error) {
    console.error(
      `Error in getSemestersAndClassesByTeacherId: ${error.message}`
    );
    throw new Error("Error fetching semesters and classes by teacherId");
  }
};

const getClassesInfoAndTaskByTeacherId = async (teacherId) => {
  try {
    const classes = await Class.find({ teacherId })
      .populate("teacherId", "username email")
      .populate("semesterId", "name status startDate endDate")
      .lean();

    const classesWithDetails = await Promise.all(
      classes.map(async (cls) => {
        const groups = await Group.find({ classId: cls._id }).select(
          "name description status"
        );
        const tempGroups = await TempGroup.find({ classId: cls._id }).select(
          "groupName status"
        );
        const totalStudentInClass = await User.countDocuments({
          classId: cls._id,
        });

        return {
          ...cls,
          groupId: groups,
          tempGroupId: tempGroups,
          totalStudentInClass,
        };
      })
    );

    return classesWithDetails;
  } catch (error) {
    console.error(
      `Error in getClassesInfoAndTaskByTeacherId: ${error.message}`
    );
    throw new Error("Error fetching class information and tasks.");
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
  findProjectsByTeacherAndClass,
  findTeacherClassSummary,
  getSemestersAndClassesByTeacherId,
  getClassesInfoAndTaskByTeacherId,
};
