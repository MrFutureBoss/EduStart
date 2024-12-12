import Group from "../../models/groupModel.js";
import ProjectCategory from "../../models/projectCategoryModel.js";
import Project from "../../models/projectModel.js";
import mongoose from "mongoose";

// hàm để tạo dự án
const createProject = async (projectData) => {
  const project = new Project(projectData);
  return await project.save();
};

// hàm để cập nhật dự án
const updateGroupWithProjectId = async (groupId, projectId) => {
  return await Group.findByIdAndUpdate(
    groupId,
    { projectId: new mongoose.Types.ObjectId(projectId) },
    { new: true }
  );
};
// hàm để cập nhật hoặc tạo mới projectCategory
const upsertProjectCategory = async (
  projectId,
  professionIds = [],
  specialtyIds = []
) => {
  const validProfessionIds = Array.isArray(professionIds) ? professionIds : [];
  const validSpecialtyIds = Array.isArray(specialtyIds) ? specialtyIds : [];

  return await ProjectCategory.findOneAndUpdate(
    { projectId: new mongoose.Types.ObjectId(projectId) },
    {
      projectId: new mongoose.Types.ObjectId(projectId),
      professionId: validProfessionIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      ),
      specialtyIds: validSpecialtyIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      ),
    },
    { new: true, upsert: true }
  );
};

// Hàm cập nhật thông tin dự án bằng projectId
const updateProjectById = async (projectId, projectData) => {
  return await Project.findByIdAndUpdate(projectId, projectData, { new: true });
};

// Tìm nhóm theo groupId
const findGroupById = async (groupId) => {
  return await Group.findById(groupId);
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
        className: "$classInfo.className",
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
        className: "$classInfo.className",
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
  updateGroupWithProjectId,
  getPlanningProjectsForTeacher,
  updateProjectStatusPlanning,
  getChangingProjectsForTeacher,
  updateProjectStatusChanging,
  updateProjectDeclineMessage,
  upsertProjectCategory,
  findGroupById,
  updateProjectById,
};
