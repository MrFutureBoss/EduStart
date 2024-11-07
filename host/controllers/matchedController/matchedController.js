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

const getMatchedInfoByGroupId = async (req, res) => {
  const { groupId } = req.params;

  try {
    const matchedInfo = await matchedDAO.getMatchedInfoByGroupId(groupId);
    if (!matchedInfo) {
      return res
        .status(404)
        .json({ message: "Thông tin matched không tồn tại." });
    }
    res.status(200).json(matchedInfo);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin matched:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateMatchedStatus = async (req, res) => {
  const { id } = req.params;
  const { status, mentorId } = req.body;

  try {
    // Gọi hàm updateMatchedById và truyền vào id và dữ liệu cập nhật
    const updatedMatched = await matchedDAO.updateMatchedById(id, {
      status,
      mentorId,
    });

    // Kiểm tra kết quả và trả về response phù hợp
    if (updatedMatched) {
      return res.status(200).json({
        message: "Matched status updated successfully",
        data: updatedMatched,
      });
    } else {
      return res.status(404).json({ message: "Matched record not found" });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error updating matched status", error });
  }
};
export default {
  createMatchedHandler,
  getMatchedInfoByGroupId,
  updateMatchedStatus,
};
