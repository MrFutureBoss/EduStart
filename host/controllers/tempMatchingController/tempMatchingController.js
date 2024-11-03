import temporaryMatchingDAO from "../../repositories/temporaryMatchingDAO/index.js";

const recommendMentorsForClassGroups = async (req, res) => {
  const { classId, teacherId } = req.body;
  try {
    const result =
      await temporaryMatchingDAO.recommendAndSaveMentorsForClassGroups(
        classId,
        teacherId
      );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy và lưu gợi ý mentor" });
  }
};
export default {
  recommendMentorsForClassGroups,
};
