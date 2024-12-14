import User from "../../models/userModel.js";
import Class from "../../models/classModel.js";
import TempGroup from "../../models/tempGroupModel.js";
import Group from "../../models/groupModel.js";
import Project from "../../models/projectModel.js";
import Matched from "../../models/matchedModel.js";
import ProjectCategory from "../../models/projectCategoryModel.js";
import Semester from "../../models/semesterModel.js";
import CreateGroupSetting from "../../models/CreateGroupSettingModel.js";
import classDAO from "./classRepositories.js";
import notificationDAO from "../mentorDAO/notificationDAO/index.js";
import mongoose from "mongoose";
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
  req,
}) => {
  const newClass = new Class({
    className,
    limitStudent,
    teacherId,
    semesterId,
    status: "Active",
  });
  //kết nối socket
  const recipients = [teacherId];
  const notificationMessage = `Bạn đã được phân công lớp ${className}`;
  await notificationDAO.createNotifications({
    message: notificationMessage,
    type: "classAssignment",
    recipients,
    audience: "Teacher",
    io: req.io,
  });
  // Save the new class
  return await newClass.save();
};

const isClassNameExist = async (className, semesterId) => {
  try {
    const existingClass = await Class.findOne({ className, semesterId });

    return existingClass !== null;
  } catch (error) {
    console.error(
      `Lỗi khi kiểm tra sự tồn tại của tên lớp học: ${error.message}`
    );
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

const getTeachersWithClassCount = async (semesterId) => {
  try {
    const teachers = await User.find({
      role: 2,
      semesterId,
    }).select("username email");

    const teachersWithClassCount = await Promise.all(
      teachers.map(async (teacher) => {
        const classCount = await Class.countDocuments({
          teacherId: teacher._id,
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
      .select("username email rollNumber memberCode major")
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
    const groups = await Group.find({ classId })
      .populate({
        path: "projectId",
        match: { status: "InProgress" },
        select: "name description status",
      })
      .populate({
        path: "classId",
        model: "Class",
        select: "className status",
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
          groupName: group.name, // Thêm tên nhóm
          className: group.classId?.className || null, // Thêm tên lớp
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

const findTeacherClassSummary = async (teacherId, semesterId) => {
  try {
    // Find classes by teacherId and semesterId
    const classes = await Class.find({ teacherId, semesterId });

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
            groupsWithoutProject: [], // Always ensure it's an array
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
              matchStatus, // Group match status
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

    // Ensure the result always includes `classSummaries`
    return { classSummaries };
  } catch (error) {
    console.error("Error fetching teacher class summary:", error);
    throw new Error(`Failed to fetch class summary: ${error.message}`);
  }
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

const checkAndFillExpiredGroups = async () => {
  try {
    // Get all CreateGroupSetting documents with deadlines on or before the current date and autoFinish is true
    const expiredSettings = await CreateGroupSetting.find({
      deadline: { $lte: new Date() },
      autoFinish: true, // Only select documents with autoFinish set to true
    }).populate("classId");

    if (expiredSettings.length === 0) {
      console.log("No expired or due deadlines with autoFinish enabled found.");
      return;
    }

    const excessStudentsLog = []; // To track students who could not be assigned

    for (const setting of expiredSettings) {
      const { classId } = setting;

      // Get users in the class without group assignment
      const { data: ungroupedUsers } =
        await classDAO.getUsersByClassIdAndEmptyGroupId(classId._id);

      if (!ungroupedUsers || ungroupedUsers.length === 0) continue;

      // Fetch TempGroups for the class with unfilled slots
      const tempGroups = await TempGroup.find({
        classId: classId._id,
        status: false,
      });

      for (const tempGroup of tempGroups) {
        const remainingSlots = tempGroup.maxStudent - tempGroup.userIds.length;

        if (remainingSlots <= 0) {
          // Update tempGroup status if filled
          tempGroup.status = true;
          await tempGroup.save();
          continue;
        }

        // Assign users to this group until maxStudent is reached
        const usersToAssign = ungroupedUsers.splice(0, remainingSlots);
        tempGroup.userIds.push(...usersToAssign.map((user) => user._id));
        tempGroup.status = tempGroup.userIds.length === tempGroup.maxStudent;

        await tempGroup.save();
      }

      // If any users remain unassigned, add them to the log
      if (ungroupedUsers.length > 0) {
        excessStudentsLog.push({
          classId: classId._id,
          className: classId.className,
          unassignedStudents: ungroupedUsers,
        });
      }
    }

    // Log results
    console.log("Auto-filled groups after deadline:");
    excessStudentsLog.forEach((log) => {
      console.log(`Class: ${log.className} (ID: ${log.classId})`);
      console.log("Unassigned Students:");
      log.unassignedStudents.forEach((student) =>
        console.log(`- ${student.username} (ID: ${student._id})`)
      );
    });

    return {
      message: "Auto-filling complete.",
      unassignedGroups: excessStudentsLog,
    };
  } catch (error) {
    console.error("Error in checkAndFillExpiredGroups:", error.message);
    throw new Error("Error checking and filling expired groups.");
  }
};

const unGroupUser = async (classId) => {
  try {
    // Fetch all TempGroups in the specified class and gather userIds already assigned to groups
    const tempGroups = await TempGroup.find({ classId })
      .select("userIds")
      .lean();

    const excludedUserIds = tempGroups.reduce(
      (acc, group) => acc.concat(group.userIds),
      []
    );

    // Query to find ungrouped users who are not in any TempGroup
    const query = {
      classId: classId,
      $or: [{ groupId: { $exists: false } }, { groupId: null }],
      _id: { $nin: excludedUserIds },
    };

    // Retrieve all ungrouped users without skip or limit
    const users = await User.find(query)
      .select("username email rollNumber memberCode major")
      .lean();

    // Count the total number of users matching the query
    const total = users.length;

    return { data: users, total };
  } catch (error) {
    throw new Error(error.message);
  }
};

const getClassDetailsBySemesterId = async (semesterId) => {
  try {
    // Ensure semester exists
    const semesterExists = await Semester.findById(semesterId);
    if (!semesterExists) {
      throw new Error("Semester not found");
    }

    // Fetch all classes for the given semester
    const classes = await Class.find({ semesterId })
      .populate("teacherId", "username email") // Get teacher's name and email
      .exec();

    // Add student count to each class
    const detailedClasses = await Promise.all(
      classes.map(async (classObj) => {
        const studentCount = await User.countDocuments({
          classId: classObj._id,
        });
        return {
          ...classObj._doc,
          teacherName: classObj.teacherId?.username || "N/A",
          studentCount,
        };
      })
    );

    return detailedClasses;
  } catch (error) {
    throw error;
  }
};

const findClassById = async (id) => {
  try {
    // Fetch class details and teacher information
    const classData = await Class.findById(id).populate(
      "teacherId",
      "username email"
    );

    if (!classData) {
      throw new Error("Class not found");
    }

    // Fetch all users with this classId
    const students = await User.find({ classId: id }).select(
      "username email rollNumber major status classId"
    );

    // Tạo danh sách các `classId` cần lấy thông tin
    const classIds = students
      .map((student) => student.classId)
      .filter((classId) => classId); // Lọc bỏ các giá trị null hoặc undefined

    // Truy vấn thông tin từ bảng Class cho các classId duy nhất
    const classInfoMap = await Class.find({ _id: { $in: classIds } })
      .select("className")
      .then((classes) =>
        classes.reduce((acc, cls) => {
          acc[cls._id] = { _id: cls._id, className: cls.className }; // Tạo object với className và _id
          return acc;
        }, {})
      );

    // Map classId thành object { className, _id }
    const studentsWithClassInfo = students.map((student) => ({
      ...student.toObject(),
      classId: student.classId
        ? classInfoMap[student.classId] // Gắn object classId
        : null,
    }));

    return { ...classData.toObject(), students: studentsWithClassInfo }; // Combine class and student data
  } catch (error) {
    throw new Error(`Error fetching class details: ${error.message}`);
  }
};

const updateClassDetails = async (id, updateData) => {
  try {
    const { className, teacherId } = updateData;

    // Validate teacherId if provided
    if (teacherId) {
      const teacherExists = await User.findById(teacherId);
      if (!teacherExists) {
        throw new Error("Teacher not found");
      }
    }

    // Update class details
    const updatedClass = await Class.findByIdAndUpdate(
      id,
      { className, teacherId },
      { new: true }
    ).populate("teacherId", "username email");

    if (!updatedClass) {
      throw new Error("Class not found or failed to update");
    }

    return updatedClass;
  } catch (error) {
    throw new Error(`Error updating class details: ${error.message}`);
  }
};
const isClassNameDuplicate = async (className, semesterId, excludeId) => {
  const duplicateClass = await Class.findOne({
    className,
    semesterId,
    _id: { $ne: excludeId }, // Loại trừ lớp hiện tại
  });
  return !!duplicateClass;
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
  checkAndFillExpiredGroups,
  unGroupUser,
  getClassDetailsBySemesterId,
  findClassById,
  updateClassDetails,
  isClassNameDuplicate,
};
