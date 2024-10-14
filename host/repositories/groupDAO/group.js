import Group from "../../models/groupModel.js";
import User from "../../models/userModel.js";
import Project from "../../models/projectModel.js";
import mongoose from "mongoose";

const getGroupById = async (id) => {
  try {
    const group = await Group.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: "projects",
          localField: "projectId",
          foreignField: "_id",
          as: "project",
        },
      },
      {
        $lookup: {
          from: "projectcategories",
          localField: "project._id",
          foreignField: "projectId",
          as: "projectcategories",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "projectcategories.categoryId",
          foreignField: "_id",
          as: "projectcategories",
        },
      },
      { $unwind: "$project" },
      { $project: { projectId: 0 } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "groupId",
          as: "members",
        },
      },
      {
        $lookup: {
          from: "matcheds",
          localField: "_id",
          foreignField: "groupId",
          as: "matched",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "matched.mentorId",
          foreignField: "_id",
          as: "mentor",
        },
      },
      {
        $lookup: {
          from: "mentorcategories",
          localField: "matched.mentorId",
          foreignField: "userId",
          as: "mentorcategories",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "mentorcategories.categoryId",
          foreignField: "_id",
          as: "mentorcategories",
        },
      },
      {
        $addFields: {
          userCount: { $size: "$members" },
        },
      },
      {
        $project: {
          projectId: 0,
          // Bỏ dòng sau để giữ lại trường matched trong kết quả
          // matched: 0
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
export default {
  checkGroupsExist,
  addUserToGroup,
  createGroup,
  createEmptyProject,
  getMatchedByGroupId,
  getAllGroupsByTeacherId,
  getGroupMembers,
  getGroupById,
};
