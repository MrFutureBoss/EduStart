import Group from "../../models/groupModel.js";
import User from "../../models/userModel.js";
import Project from "../../models/projectModel.js";
import mongoose from "mongoose";
import ProjectCategory from "../../models/projectCategoryModel.js";

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

      // Lookup vào professions để lấy tên profession
      {
        $lookup: {
          from: "professions",
          localField: "projectCategories.professionId",
          foreignField: "_id",
          as: "professionDetails",
        },
      },

      // Lookup vào specialties để lấy tên của specialty
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
          professionDetails: "$professionDetails.name",
          specialtyDetails: "$specialtyDetails.name",
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

const getGroupsByClassId = async (classId) => {
  try {
    if (!mongoose.isValidObjectId(classId)) {
      throw new Error("Invalid classId format");
    }

    const objectIdClassId = new mongoose.Types.ObjectId(classId);

    const groups = await Group.find({ classId: objectIdClassId })
      .populate("projectId")
      .populate("classId")
      .exec();

    return { message: "Groups fetched successfully", groups };
  } catch (error) {
    console.error("Error fetching groups by classId:", error);
    throw new Error(`Failed to fetch groups for classId: ${error.message}`);
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
        path: "groupId", // Populate group details if needed
        select: "name description status", // Choose the fields to include from the Group
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
};
