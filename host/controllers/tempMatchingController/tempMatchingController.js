import temporaryMatchingDAO from "../../repositories/temporaryMatchingDAO/index.js";

const recommendMentorsForClassGroups = async (req, res) => {
  const { classId, teacherId } = req.body;
  try {
    const recommendations =
      await temporaryMatchingDAO.recommendAndSaveMentorsForClassGroups(
        classId,
        teacherId
      );
    res.json(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy và lưu gợi ý mentor" });
  }
};
const recommendMentorsForGroup = async (req, res) => {
  const { groupId, teacherId } = req.body;
  try {
    const recommendations =
      await temporaryMatchingDAO.recommendAndSaveMentorsForSingleGroup(
        groupId,
        teacherId
      );
    res.json(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy và lưu gợi ý mentor" });
  }
};
const getClassSuggestions = async (req, res) => {
  const { classId } = req.params;

  try {
    const result = await temporaryMatchingDAO.getSuggestionsByClassId(classId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export default {
  recommendMentorsForClassGroups,
  getClassSuggestions,
  recommendMentorsForGroup,
};
