import matchedDAO from "../../repositories/matchedDAO/index.js";

const createMatchedHandler = async (req, res) => {
  try {
    const { groupId, mentorId, status } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!groupId || !mentorId) {
      return res
        .status(400)
        .json({ message: "groupId và mentorId là bắt buộc" });
    }
    // Tạo bản ghi Matched
    const matched = await matchedDAO.createMatched({
      groupId,
      mentorId,
      status,
    });

    res
      .status(201)
      .json({ message: "Mentor đã được gán thành công", data: matched });
  } catch (error) {
    console.error("Lỗi khi tạo Matched:", error);
    res.status(500).json({ message: "Lỗi máy chủ", error: error.message });
  }
};

export default {
  createMatchedHandler,
};
