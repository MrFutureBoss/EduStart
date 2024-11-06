import Group from "../../models/groupModel.js";
import Project from "../../models/projectModel.js";
import mongoose from "mongoose";
// hàm để tạo dự án
const createProject = async (projectData) => {
  try {
    const project = await Project.create(projectData);
    return project;
  } catch (error) {
    throw new Error(error.message);
  }
};
// hàm để cập nhật dự án
const updateProject = async (id, project) => {
  try {
    const result = await Project.findByIdAndUpdate(id, project);
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
};
// hàm để lấy dự án theo id
const getProjectById = async (id) => {
  try {
    const project = await Project.findOne({ _id: id }).exec();
    return project;
  } catch (error) {
    throw new Error(error.message);
  }
};
// hàm để lấy danh sách các dự án ở trạng thái Planning
const getPlanningProjectsForTeacher = async (teacherId) => {
  return await Group.aggregate([
    {
      $lookup: {
        from: "classes",
        localField: "classId",
        foreignField: "_id",
        as: "classInfo",
      },
    },
    {
      $unwind: "$classInfo",
    },
    {
      $match: {
        "classInfo.teacherId": new mongoose.Types.ObjectId(teacherId),
      },
    },
    {
      $lookup: {
        from: "projects",
        localField: "projectId",
        foreignField: "_id",
        as: "projectInfo",
      },
    },
    {
      $unwind: "$projectInfo",
    },
    {
      $match: {
        "projectInfo.status": "Planning",
      },
    },
    {
      $lookup: {
        from: "projectcategories",
        localField: "projectInfo._id",
        foreignField: "projectId",
        as: "projectCategories",
      },
    },
    {
      $unwind: {
        path: "$projectCategories",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "professions",
        localField: "projectCategories.professionId",
        foreignField: "_id",
        as: "professionInfo",
      },
    },
    {
      $lookup: {
        from: "specialties",
        localField: "projectCategories.specialtyIds",
        foreignField: "_id",
        as: "specialtyInfo",
      },
    },
    {
      $project: {
        _id: 0,
        groupId: "$_id",
        groupName: "$name",
        projectId: "$projectInfo._id",
        projectName: "$projectInfo.name",
        profession: "$professionInfo.name",
        specialties: "$specialtyInfo.name",
      },
    },
  ]);
};
// hàm để lấy danh sách các dự án ở trạng thái Changing
const getChangingProjectsForTeacher = async (teacherId) => {
  return await Group.aggregate([
    {
      $lookup: {
        from: "classes",
        localField: "classId",
        foreignField: "_id",
        as: "classInfo",
      },
    },
    {
      $unwind: "$classInfo",
    },
    {
      $match: {
        "classInfo.teacherId": new mongoose.Types.ObjectId(teacherId),
      },
    },
    {
      $lookup: {
        from: "projects",
        localField: "projectId",
        foreignField: "_id",
        as: "projectInfo",
      },
    },
    {
      $unwind: "$projectInfo",
    },
    {
      $match: {
        "projectInfo.status": "Changing",
      },
    },
    {
      $lookup: {
        from: "projectcategories",
        localField: "projectInfo._id",
        foreignField: "projectId",
        as: "projectCategories",
      },
    },
    {
      $unwind: {
        path: "$projectCategories",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "professions",
        localField: "projectCategories.professionId",
        foreignField: "_id",
        as: "professionInfo",
      },
    },
    {
      $lookup: {
        from: "specialties",
        localField: "projectCategories.specialtyIds",
        foreignField: "_id",
        as: "specialtyInfo",
      },
    },
    {
      $project: {
        _id: 0,
        groupId: "$_id",
        groupName: "$name",
        projectId: "$projectInfo._id",
        projectName: "$projectInfo.name",
        profession: "$professionInfo.name",
        specialties: "$specialtyInfo.name",
      },
    },
  ]);
};
// hàm để cập nhật trạng thái của dự án Planning
const updateProjectStatusPlanning = async (projectId, newStatus) => {
  try {
    const updatedProject = await Project.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(projectId),
        status: "Planning",
      },
      { $set: { status: newStatus } },
      { new: true }
    );
    return updatedProject;
  } catch (error) {
    console.error("Error in updateProjectStatus:", error);
    throw new Error("Error updating project status");
  }
};
// hàm để cập nhật trạng thái của dự án Changing
const updateProjectStatusChanging = async (projectId, newStatus) => {
  try {
    const updatedProject = await Project.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(projectId),
        status: "Changing",
      },
      { $set: { status: newStatus } },
      { new: true }
    );
    return updatedProject;
  } catch (error) {
    console.error("Error in updateProjectStatus:", error);
    throw new Error("Error updating project status");
  }
};

const updateProjectDeclineMessage = async (projectId, declineMessage) => {
  return Project.findByIdAndUpdate(
    projectId,
    { declineMessage },
    { new: true }
  );
};

export default {
  createProject,
  getProjectById,
  updateProject,
  getPlanningProjectsForTeacher,
  updateProjectStatusPlanning,
  getChangingProjectsForTeacher,
  updateProjectStatusChanging,
  updateProjectDeclineMessage,
};
