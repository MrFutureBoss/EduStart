import projectDAO from "../../repositories/projectDAO/index.js";
import mongoose from "mongoose";

const updateGroupProject = async (req, res) => {
  const { groupId } = req.params;
  const {
    name,
    description,
    status = "Planning",
    declineMessage,
    professionId,
    specialtyIds,
  } = req.body;

  try {
    const group = await projectDAO.findGroupById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    let projectId = group.projectId;

    // Nếu nhóm chưa có dự án, tạo dự án mới
    if (!projectId) {
      const newProject = await projectDAO.createProject({
        name,
        description,
        status,
        declineMessage,
      });
      projectId = newProject._id;

      await projectDAO.updateGroupWithProjectId(groupId, projectId);
    } else {
      // Cập nhật dự án nếu đã có projectId
      await projectDAO.updateProjectById(projectId, {
        name,
        description,
        status,
        declineMessage,
      });
    }

    // Cập nhật hoặc thêm mới ProjectCategory
    const updatedProjectCategory = await projectDAO.upsertProjectCategory(
      projectId,
      professionId,
      specialtyIds
    );

    return res.status(200).json({
      message: "Project updated successfully",
      projectId: projectId,
      projectCategory: updatedProjectCategory,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const reviseProject = async (req, res) => {
  try {
    const { groupId } = req.params;
    const {
      name,
      description,
      status = "Changing",
      professionId,
      specialtyIds,
    } = req.body;

    const group = await projectDAO.findGroupById(groupId);
    if (!group || !group.projectId) {
      return res
        .status(404)
        .json({ error: "Group or associated project not found" });
    }

    const projectId = group.projectId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ error: "Invalid project ID format" });
    }

    // Cập nhật dự án với các trường mới
    const updatedProject = await projectDAO.updateProjectById(projectId, {
      name,
      description,
      status,
    });

    if (!updatedProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Cập nhật hoặc thêm mới ProjectCategory (profession và specialty)
    const updatedProjectCategory = await projectDAO.upsertProjectCategory(
      projectId,
      professionId,
      specialtyIds
    );

    return res.status(200).json({
      message: "Project revised successfully",
      project: updatedProject,
      projectCategory: updatedProjectCategory,
    });
  } catch (error) {
    console.error("Error revising project:", error);
    res.status(500).json({ error: error.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await projectDAO.getProjectById(id);
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPlanningProjectsForTeacher = async (req, res) => {
  const teacherId = req.params.teacherId;

  try {
    const results = await projectDAO.getPlanningProjectsForTeacher(teacherId);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getChangingProjectsForTeacher = async (req, res) => {
  const teacherId = req.params.teacherId;

  try {
    const results = await projectDAO.getChangingProjectsForTeacher(teacherId);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveProjectPlanning = async (req, res) => {
  const { projectId } = req.params;
  try {
    const updatedProject = await projectDAO.updateProjectStatusPlanning(
      projectId,
      "InProgress"
    );
    if (!updatedProject) {
      return res.status(404).json({
        error: "Không tìm thấy dự án có trạng thái Planning",
      });
    }
    res.json(updatedProject);
  } catch (error) {
    console.error("Error in approveProject:", error);
    res.status(500).json({ error: error.message });
  }
};

const declineProjectPlanning = async (req, res) => {
  const { projectId } = req.params;
  const { declineMessage } = req.body; // Get decline message from request body
  try {
    // Update project status
    const updatedProjectStatus = await projectDAO.updateProjectStatusPlanning(
      projectId,
      "Decline"
    );
    if (!updatedProjectStatus) {
      return res.status(404).json({
        error: "Không tìm thấy dự án có trạng thái Planning",
      });
    }
    // Update decline message
    const updatedProjectMessage = await projectDAO.updateProjectDeclineMessage(
      projectId,
      declineMessage
    );

    res.json(updatedProjectMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const approveProjectChanging = async (req, res) => {
  const { projectId } = req.params;
  try {
    const updatedProject = await projectDAO.updateProjectStatusChanging(
      projectId,
      "InProgress"
    );
    if (!updatedProject) {
      return res.status(404).json({
        error: "Không tìm thấy dự án có trạng thái Changing",
      });
    }
    res.json(updatedProject);
  } catch (error) {
    console.error("Error in approveProject:", error);
    res.status(500).json({ error: error.message });
  }
};

const declineProjectChanging = async (req, res) => {
  const { projectId } = req.params;
  const { declineMessage } = req.body; // Get decline message from request body
  try {
    // Update project status
    const updatedProjectStatus = await projectDAO.updateProjectStatusChanging(
      projectId,
      "Decline"
    );
    if (!updatedProjectStatus) {
      return res.status(404).json({
        error: "Không tìm thấy dự án có trạng thái Changing",
      });
    }
    // Update decline message
    const updatedProjectMessage = await projectDAO.updateProjectDeclineMessage(
      projectId,
      declineMessage
    );

    res.json(updatedProjectMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export default {
  updateGroupProject,
  getProjectById,
  getPlanningProjectsForTeacher,
  getChangingProjectsForTeacher,
  approveProjectPlanning,
  declineProjectPlanning,
  approveProjectChanging,
  declineProjectChanging,
  reviseProject,
};
