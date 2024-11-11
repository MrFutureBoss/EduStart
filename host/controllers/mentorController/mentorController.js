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

export default {
  getMatchingProjects,
  saveMentorPreferences,
  removePreferenceController,
};
