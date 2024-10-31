import User from "../../models/userModel.js";
import Class from "../../models/classModel.js";
import TempGroup from "../../models/tempGroupModel.js";
import Group from "../../models/groupModel.js";
import Project from "../../models/projectModel.js";
import Matched from "../../models/matchedModel.js";
import ProjectCategory from "../../models/projectCategoryModel.js";
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
  // Kiểm tra xem lớp học có tồn tại với giáo viên cụ thể không
  console.log(teacherId, classId);

  const classData = await Class.findOne({ _id: classId, teacherId });
  if (!classData) {
    throw new Error("Không tìm thấy lớp học với giáo viên này.");
  }

  // Tìm các nhóm trong lớp học đó và populate projectId
  const groups = await Group.find({ classId }).populate({
    path: "projectId",
    match: { status: "InProgress" },
  });

  // Lấy danh sách các groupId đã matched
  const matchedGroupIds = await Matched.find({
    groupId: { $in: groups.map((group) => group._id) },
  }).distinct("groupId");

  // Lặp qua các nhóm để lấy thông tin dự án và danh mục
  const projects = await Promise.all(
    groups
      .filter((group) => group.projectId != null) // Chỉ lấy các nhóm có projectId
      .map(async (group) => {
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
        const isMatched = matchedGroupIds.includes(group._id.toString());

        // Trả về thông tin project cùng với groupId và projectCategory
        return {
          ...group.projectId.toObject(),
          groupId: group._id, // Thêm groupId vào kết quả
          projectCategory: projectCategory || null,
          isMatched,
        };
      })
  );

  return projects;
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
          groupsWithoutProject: [], // Đảm bảo luôn có giá trị mảng
        };
      }

      const matchedGroupIds = await Matched.find({
        groupId: { $in: groups.map((group) => group._id) },
      }).distinct("groupId");

      const matchedCount = groups.filter((group) =>
        matchedGroupIds.includes(group._id.toString())
      ).length;
      const unmatchedCount = groups.length - matchedCount;
      const isFullyMatched = unmatchedCount === 0;

      let groupsWithoutProject = []; // Danh sách các nhóm chưa cập nhật dự án cho lớp này

      const groupDetails = await Promise.all(
        groups.map(async (group) => {
          // Kiểm tra projectId của nhóm
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

          return {
            groupId: group._id,
            groupName: group.name,
            isMatched: matchedGroupIds.includes(group._id.toString()),
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
        groupsWithoutProject, // Luôn là mảng, ngay cả khi không có nhóm nào chưa cập nhật dự án
      };
    })
  );

  const emptyClasses = classSummaries
    .filter((classItem) => classItem.isEmpty)
    .map((classItem) => ({
      classId: classItem.classId,
      className: classItem.className,
    }));

  const nonEmptyClasses = classSummaries.filter(
    (classItem) => !classItem.isEmpty
  );
  const totalFullyMatchedClasses = nonEmptyClasses.filter(
    (classItem) => classItem.isFullyMatched
  ).length;

  // Các lớp chưa ghép mentor đầy đủ, bao gồm chi tiết các nhóm chưa được ghép
  const notMatchedClasses = nonEmptyClasses
    .filter((classItem) => !classItem.isFullyMatched)
    .map((classItem) => ({
      classId: classItem.classId,
      className: classItem.className,
      unmatchedGroups: classItem.groupDetails
        .filter((group) => !group.isMatched) // Lọc ra các nhóm chưa được ghép
        .map((group) => ({
          groupId: group.groupId,
          groupName: group.groupName,
        })),
    }));

  // Tính tổng số nhóm chưa cập nhật dự án và danh sách các lớp có nhóm chưa cập nhật dự án
  const classesWithUnupdatedProjects = classSummaries
    .filter((classItem) => (classItem.groupsWithoutProject || []).length > 0)
    .map((classItem) => ({
      classId: classItem.classId,
      className: classItem.className,
      groupsWithoutProject: classItem.groupsWithoutProject,
    }));

  const totalUnupdatedProjects = classesWithUnupdatedProjects.reduce(
    (total, classItem) => total + (classItem.groupsWithoutProject || []).length,
    0
  );

  return {
    classSummaries: nonEmptyClasses,
    counts: {
      totalClasses: classes.length,
      totalFullyMatchedClasses,
      totalNotFullyMatchedClasses: notMatchedClasses.length,
      totalUnupdatedProjects, // Tổng số nhóm chưa cập nhật dự án
    },
    matchedClasses: nonEmptyClasses
      .filter((classItem) => classItem.isFullyMatched)
      .map((classItem) => ({
        classId: classItem.classId,
        className: classItem.className,
      })),
    notMatchedClasses, // Bao gồm các lớp và các nhóm chưa được ghép trong từng lớp
    emptyClasses,
    classesWithUnupdatedProjects, // Danh sách các lớp có nhóm chưa cập nhật dự án và chi tiết nhóm
  };
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
};
