import Group from "../../models/groupModel.js";
import User from "../../models/userModel.js";
import Project from "../../models/projectModel.js";
import Matched from "../../models/matchedModel.js";
import mongoose from "mongoose";
import ProjectCategory from "../../models/projectCategoryModel.js";
import Class from "../../models/classModel.js";
import Semester from "../../models/semesterModel.js";

const getGroupById = async (id) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return [];
    }

    const group = await Group.aggregate([
      // Tìm group theo ID
      { $match: { _id: new mongoose.Types.ObjectId(id) } },

      // Lấy thông tin dự án liên quan
      {
        $lookup: {
          from: "projects",
          localField: "projectId",
          foreignField: "_id",
          as: "project",
        },
      },
      { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },

      // Lấy các category của dự án từ projectcategories
      {
        $lookup: {
          from: "projectcategories",
          localField: "project._id",
          foreignField: "projectId",
          as: "projectCategories",
        },
      },

      // Lookup vào professions để lấy cả _id và name của profession
      {
        $lookup: {
          from: "professions",
          localField: "projectCategories.professionId",
          foreignField: "_id",
          as: "professionDetails",
        },
      },

      // Lookup vào specialties để lấy cả _id và name của specialty
      {
        $lookup: {
          from: "specialties",
          localField: "projectCategories.specialtyIds",
          foreignField: "_id",
          as: "specialtyDetails",
        },
      },

      // Lấy danh sách thành viên trong nhóm từ bảng users
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "groupId",
          as: "members",
        },
      },

      // Lấy thông tin mentor từ bảng matched
      {
        $lookup: {
          from: "matcheds",
          localField: "_id",
          foreignField: "groupId",
          as: "matched",
        },
      },

      // Lấy chi tiết của mentor từ bảng users
      {
        $lookup: {
          from: "users",
          localField: "matched.mentorId",
          foreignField: "_id",
          as: "mentors",
        },
      },

      // Lấy thông tin về chuyên ngành của mentor từ bảng mentorcategories
      {
        $lookup: {
          from: "mentorcategories",
          localField: "matched.mentorId",
          foreignField: "mentorId",
          as: "mentorCategories",
        },
      },

      // Lấy chi tiết của category trong mentorCategories từ bảng categories
      {
        $lookup: {
          from: "categories",
          localField: "mentorCategories.categoryId",
          foreignField: "_id",
          as: "mentorCategoryDetails",
        },
      },

      // Đếm số lượng thành viên trong nhóm
      {
        $addFields: {
          userCount: { $size: "$members" },
        },
      },

      // Chọn các trường cần thiết
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          status: 1,
          classId: 1,
          project: 1,
          projectCategories: 1,
          professionDetails: {
            $map: {
              input: "$professionDetails",
              as: "profession",
              in: { id: "$$profession._id", name: "$$profession.name" }, // Lấy cả id và name
            },
          },
          specialtyDetails: {
            $map: {
              input: "$specialtyDetails",
              as: "specialty",
              in: { id: "$$specialty._id", name: "$$specialty.name" }, // Lấy cả id và name
            },
          },
          members: 1,
          mentors: 1,
          matched: 1,
          mentorCategories: 1,
          mentorCategoryDetails: 1,
          userCount: 1,
        },
      },
    ]);

    return group;
  } catch (error) {
    throw new Error(error.message);
  }
};

const getGroupMembers = async (groupId) => {
  try {
    const members = await User.find({ groupId: groupId }).exec();
    return members;
  } catch (error) {
    throw new Error(error.message);
  }
};
const checkGroupsExist = async (classId) => {
  const groups = await Group.find({ classId: classId });
  return groups.length > 0;
};
const addUserToGroup = async (userId, groupId, isLeader = false) => {
  try {
    const user = await User.findById(userId);
    user.groupId = groupId;
    user.isLeader = isLeader;
    await user.save();
    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};
const createGroup = async (groupData) => {
  try {
    const group = new Group(groupData);
    await group.save();
    return group;
  } catch (error) {
    throw new Error(error.message);
  }
};
const createEmptyProject = async (index) => {
  try {
    const project = new Project({
      name: `Nhóm ${index}`,
      description: "",
    });
    await project.save();
    return project;
  } catch (error) {
    throw new Error(error.message);
  }
};
const getMatchedByGroupId = async (groupId) => {
  return await Matched.findOne({ groupId }).populate("mentorId").exec();
};

const getAllGroupsByTeacherId = async (teacherId) => {
  try {
    const groups = await Group.find()
      .populate({
        path: "classId",
        match: { teacherId: teacherId },
      })
      .populate("projectId");

    const filteredGroups = groups.filter((group) => group.classId !== null);

    if (!filteredGroups || filteredGroups.length === 0) {
      throw new Error("Không có nhóm nào cho giáo viên này.");
    }

    return filteredGroups;
  } catch (error) {
    console.error("Error in getAllGroupsByTeacherId:", error);
    throw new Error(error.message);
  }
};

const getProjectByGroupId = async (groupId) => {
  try {
    // Tìm nhóm theo groupId để lấy projectId
    const group = await Group.findById(groupId);
    if (!group || !group.projectId) {
      throw new Error("Không tìm thấy dự án liên quan đến nhóm này.");
    }

    // Tìm thông tin dự án bằng projectId từ nhóm
    const project = await Project.findById(group.projectId);
    if (!project) {
      throw new Error("Dự án không tồn tại.");
    }

    // Tìm thêm thông tin ProjectCategory dựa vào projectId
    const projectCategory = await ProjectCategory.findOne({
      projectId: group.projectId,
    })
      .populate({ path: "professionId", model: "Profession", select: "name" })
      .populate({ path: "specialtyIds", model: "Specialty", select: "name" });

    // Kết hợp thông tin project và projectCategory
    return {
      ...project.toObject(),
      projectCategory: projectCategory ? projectCategory.toObject() : null,
    };
  } catch (error) {
    throw new Error("Lỗi khi lấy thông tin dự án từ database.");
  }
};

const getGroupsByClassId = async (classId, semesterId) => {
  try {
    const objectIdClassId = new mongoose.Types.ObjectId(classId);
    const objectIdSemesterId = new mongoose.Types.ObjectId(semesterId);

    // Fetch semester details
    const semester = await Semester.findById(objectIdSemesterId);
    if (!semester) {
      throw new Error("Semester not found");
    }

    const { startDate, endDate } = semester;

    // Fetch class details
    const classData = await Class.findById(objectIdClassId).populate({
      path: "teacherId",
      model: "User",
      select: "username email phoneNumber degree status role",
    });

    if (!classData) {
      throw new Error("Class not found");
    }

    const teacher = classData.teacherId;

    // Fetch groups for the class
    const groups = await Group.find({ classId: objectIdClassId })
      .populate({
        path: "projectId",
        model: "Project",
        select: "name description status",
      })
      .populate({
        path: "classId",
        model: "Class",
        select: "className status",
      })
      .exec();

    if (!groups || groups.length === 0) {
      throw new Error("No groups found for the provided classId");
    }

    const populatedGroups = await Promise.all(
      groups.map(async (group) => {
        // Fetch users for the group
        const users = await User.find({
          classId: objectIdClassId,
          groupId: group._id,
          status: "Active",
        }).select("-password");

        // Fetch mentor match details within the semester period
        const matched = await Matched.findOne({
          groupId: group._id,
          updatedAt: { $gte: startDate, $lte: endDate },
        })
          .populate({
            path: "mentorId",
            model: "User",
            select: "username email degree phoneNumber status",
          })
          .exec();

        const mentor = matched ? matched.mentorId : null;

        return {
          ...group._doc,
          users,
          mentor,
        };
      })
    );

    return {
      message:
        "Groups with project, user, and mentor details fetched successfully",
      groups: populatedGroups,
      teacher,
    };
  } catch (error) {
    console.error(
      "Error fetching detailed groups by classId and semesterId:",
      error
    );
    throw new Error(`Failed to fetch groups: ${error.message}`);
  }
};

const getGroupsByClassIds = async (classIds) => {
  try {
    return await Group.find({ classId: { $in: classIds } });
  } catch (error) {
    console.error("Error fetching groups by classIds:", error);
    throw error;
  }
};

const getAllUserByClassId = async (classId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw new Error("Invalid classId format");
    }

    // Find all users with the specified classId and include groupId details
    const students = await User.find({
      classId: new mongoose.Types.ObjectId(classId),
    })
      .populate({
        path: "groupId",
        select: "name description status",
      })
      .exec();

    const total = students.length;

    return {
      message: "Users fetched successfully",
      students,
      total,
    };
  } catch (error) {
    console.error("Error fetching users by classId:", error);
    throw new Error(`Failed to fetch users for classId: ${error.message}`);
  }
};

const updateGroupById = async (groupId, updateData) => {
  try {
    if (!mongoose.isValidObjectId(groupId)) {
      throw new Error("Invalid group ID format");
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedGroup) {
      throw new Error("Group not found");
    }

    return updatedGroup;
  } catch (error) {
    console.error("Error updating group:", error.message);
    throw new Error(error.message);
  }
};

const getGroupByProjectId = async (projectId) => {
  try {
    const group = await Group.findOne({ projectId }).populate(
      "projectId classId"
    );
    if (!group) {
      throw new Error("Group not found for the given project ID");
    }
    return group;
  } catch (error) {
    throw new Error(`Error fetching group: ${error.message}`);
  }
};
export default {
  checkGroupsExist,
  addUserToGroup,
  createGroup,
  createEmptyProject,
  getMatchedByGroupId,
  getAllGroupsByTeacherId,
  getGroupMembers,
  getGroupById,
  getProjectByGroupId,
  getGroupsByClassId,
  getGroupsByClassIds,
  getAllUserByClassId,
  updateGroupById,
  getGroupByProjectId,
};
