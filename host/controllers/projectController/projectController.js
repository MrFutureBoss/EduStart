import groupDAO from "../../repositories/groupDAO/index.js";
import notificationDAO from "../../repositories/mentorDAO/notificationDAO/index.js";
import projectDAO from "../../repositories/projectDAO/index.js";
import mongoose from "mongoose";

const updateGroupProject = async (req, res, io) => {
  const { groupId } = req.params;
  const {
    name,
    description,
    status = "Planning",
    declineMessage,
    professionId,
    specialtyIds,
    teacherId,
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
    const recipients = [teacherId];
    console.log(recipients);

    const notificationMessage = `Dự án nhóm ${group.name} đã cập nhật.`;
    await notificationDAO.createNotifications({
      message: notificationMessage,
      type: "ProjectUpdate",
      recipients,
      filters: { groupId: group._id, groupName: group.name },
      senderId: group._id,
      audience: "Teacher",
      groupByKey: `Project_${projectId}`,
      io: req.io,
    });
    const io = req.io; // Lấy `io` từ req
    io.to(`user:${teacherId}`).emit("projectUpdated", {
      message: "Project updated",
      groupId,
    });

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

const updateStatusProject = async (req, res) => {
  const { groupId } = req.params;
  const {
    name,
    description,
    status,
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

const reviseProject = async (req, res, io) => {
  try {
    const { groupId } = req.params;
    const {
      name,
      description,
      status = "Changing",
      professionId,
      specialtyIds,
      teacherId,
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
    const recipients = [teacherId];
    const notificationMessage = `Dự án nhóm ${group.name} đã cập nhật lại.`;
    await notificationDAO.createNotifications({
      message: notificationMessage,
      type: "ProjectReUpdate",
      recipients,
      filters: { groupId: group._id, groupName: group.name },
      senderId: group._id,
      io: req.io,
    });
    // kết nối socket.io
    const io = req.io; // Lấy `io` từ req
    io.to(`user:${teacherId}`).emit("projectUpdated", {
      message: "Project updated",
      groupId,
    });
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
    const teacherId = req.user._id;

    if (!updatedProject) {
      return res.status(404).json({
        error: "Không tìm thấy dự án có trạng thái Planning",
      });
    }
    const group = await groupDAO.getGroupByProjectId(projectId);

    const groupMembers = await groupDAO.getGroupMembers(group._id);

    const recipients = groupMembers.map((member) => member._id);

    const notificationMessage = `Dự án của nhóm bạn đã được giáo viên duyệt.`;
    const notifications = await notificationDAO.createNotifications({
      message: notificationMessage,
      type: "ProjectNotification",
      recipients,
      filters: { groupId: group._id, groupName: group.name },
      senderId: teacherId,
      audience: "Student",
      groupByKey: `Project_${projectId}`,
      io: req.io,
    });

    const io = req.io;
    if (projectId) {
      io.to(`project:${projectId}`).emit("projectUpdated", {
        message: "Project approved",
        projectId,
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
  const { declineMessage } = req.body;

  try {
    const teacherId = req.user._id;

    const updatedProjectStatus = await projectDAO.updateProjectStatusPlanning(
      projectId,
      "Decline"
    );

    if (!updatedProjectStatus) {
      return res
        .status(404)
        .json({ error: "Project not found or not in Planning status" });
    }

    await projectDAO.updateProjectDeclineMessage(projectId, declineMessage);

    const group = await groupDAO.getGroupByProjectId(projectId);

    const groupMembers = await groupDAO.getGroupMembers(group._id);

    const recipients = groupMembers.map((member) => member._id);

    const notificationMessage = `Dự án của nhóm bạn đã bị giáo viên từ chối. Lý do: "${declineMessage}".`;
    const notifications = await notificationDAO.createNotifications({
      message: notificationMessage,
      type: "ProjectNotification",
      recipients,
      filters: { groupId: group._id, groupName: group.name },
      senderId: teacherId,
      audience: "Student",
      groupByKey: `Project_${projectId}`,
      io: req.io,
    });

    // Emit sự kiện qua WebSocket
    req.io.to(`project:${projectId}`).emit("projectUpdated", {
      message: "Project Declined",
      projectId,
    });

    res.json({
      message: "Project declined successfully",
      declineMessage,
      notifications,
    });
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
    const teacherId = req.user._id;
    if (!updatedProject) {
      return res.status(404).json({
        error: "Không tìm thấy dự án có trạng thái Changing",
      });
    }
    const io = req.io;

    const group = await groupDAO.getGroupByProjectId(projectId);

    const groupMembers = await groupDAO.getGroupMembers(group._id);

    const recipients = groupMembers.map((member) => member._id);

    const notificationMessage = `Dự án của nhóm bạn đã được giáo duyệt.`;
    const notifications = await notificationDAO.createNotifications({
      message: notificationMessage,
      type: "ProjectNotification",
      recipients,
      filters: { groupId: group._id, groupName: group.name },
      senderId: teacherId,
      audience: "Student",
      groupByKey: `Project_${projectId}`,
      io: req.io,
    });

    if (projectId) {
      io.to(`project:${projectId}`).emit("projectUpdated", {
        message: "Project approve",
        projectId,
      });
    }
    res.json(updatedProject);
  } catch (error) {
    console.error("Error in approveProject:", error);
    res.status(500).json({ error: error.message });
  }
};

const declineProjectChanging = async (req, res, io) => {
  const { projectId } = req.params;
  const { declineMessage } = req.body; // Get decline message from request body
  try {
    // Update project status
    const updatedProjectStatus = await projectDAO.updateProjectStatusChanging(
      projectId,
      "Decline"
    );
    const teacherId = req.user._id;
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

    const group = await groupDAO.getGroupByProjectId(projectId);

    const groupMembers = await groupDAO.getGroupMembers(group._id);

    const recipients = groupMembers.map((member) => member._id);

    const notificationMessage = `Dự án của nhóm bạn đã bị giáo viên từ chối. Lý do: "${declineMessage}".`;
    const notifications = await notificationDAO.createNotifications({
      message: notificationMessage,
      type: "ProjectNotification",
      recipients,
      filters: { groupId: group._id, groupName: group.name },
      senderId: teacherId,
      audience: "Student",
      groupByKey: `Project_${projectId}`,
      io: req.io,
    });

    // Phát tín hiệu cập nhật đến học sinh và giáo viên
    const io = req.io;
    if (projectId) {
      io.to(`project:${projectId}`).emit("projectUpdated", {
        message: "Project Decline",
        projectId,
      });
    }
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
  updateStatusProject,
};
