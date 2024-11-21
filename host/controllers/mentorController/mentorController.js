import mentorDAO from "../../repositories/mentorDAO/index.js";

const getMatchingProjects = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const projects = await mentorDAO.getMatchingProjectsForMentor(mentorId);
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message, error });
  }
};

const saveMentorPreferences = async (req, res) => {
  try {
    const { mentorId, projectIds } = req.body;
    await mentorDAO.saveMentorPreferences(mentorId, projectIds);
    res.status(200).json({ message: "Lưu thành công các dự án yêu thích." });
  } catch (error) {
    res.status(500).json({ message: error.message, error });
  }
};

const removePreferenceController = async (req, res) => {
  try {
    const { mentorId, projectIds } = req.body;
    await mentorDAO.removeMentorPreference(mentorId, projectIds);

    res.status(200).json({
      message: "Đã xóa dự án khỏi lựa chọn của mentor thành công.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Có lỗi xảy ra khi xóa lựa chọn dự án.",
      error: error.message,
    });
  }
};

const fetchMentorById = async (req, res) => {
  try {
    const { mentorId } = req.params;

    if (!mentorId) {
      return res.status(400).json({ message: "Mentor ID is required" });
    }

    const mentorDetails = await mentorDAO.getMentorDetailsById(mentorId);
    res.status(200).json(mentorDetails);
  } catch (error) {
    console.error("Error in fetchMentorById:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateMentor = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const updateData = req.body;

    if (!mentorId || !updateData) {
      return res.status(400).json({ message: "Thiếu thông tin cập nhật" });
    }

    const updatedMentor = await mentorDAO.updateMentorData(
      mentorId,
      updateData
    );

    res.status(200).json({
      message: "Cập nhật thành công!",
      data: updatedMentor,
    });
  } catch (error) {
    console.error("Error updating mentor:", error);
    res.status(500).json({ message: error.message });
  }
};

const checkMentorUpdateStatus = async (req, res) => {
  try {
    const { mentorId } = req.params;

    if (!mentorId) {
      return res.status(400).json({ message: "Thiếu mentorId" });
    }

    const status = await mentorDAO.checkMentorInfoStatus(mentorId);

    res.status(200).json(status);
  } catch (error) {
    console.error("Error checking mentor update status:", error);
    res.status(500).json({ message: error.message });
  }
};
export default {
  getMatchingProjects,
  saveMentorPreferences,
  removePreferenceController,
  fetchMentorById,
  updateMentor,
  checkMentorUpdateStatus,
};
