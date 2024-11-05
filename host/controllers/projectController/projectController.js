import projectDAO from "../../repositories/projectDAO/index.js";
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status = "Planning" } = req.body;
    const project = await projectDAO.updateProject(id, {
      name,
      description,
      status,
    });
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const reviseProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status = "Changing" } = req.body;
    const project = await projectDAO.updateProject(id, {
      name,
      description,
      status,
    });
    res.status(200).json(project);
  } catch (error) {
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
  updateProject,
  getProjectById,
  getPlanningProjectsForTeacher,
  getChangingProjectsForTeacher,
  approveProjectPlanning,
  declineProjectPlanning,
  approveProjectChanging,
  declineProjectChanging,
  reviseProject,
};
