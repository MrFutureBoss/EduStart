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

const getAllMatchingDetailByMentorId = async (req, res) => {
  const { mentorId } = req.params;

  try {
    const result = await matchedDAO.getAllMatchingDetailByMentorId(mentorId);

    if (!result.groups.length) {
      return res.status(404).json({ message: "No matching groups found." });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching matching details:", error);
    res.status(500).json({
      message: "Error fetching matching details.",
      error: error.message,
    });
  }
};
const patchMatched = async (req, res) => {
  const { id } = req.params; // Extract the ID from URL parameters
  const updateData = req.body; // Extract update data from the request body

  try {
    // Ensure updateData is not empty
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No update data provided" });
    }

    // Call the DAO to update the record
    const updatedMatched = await matchedDAO.patchMatchedById(id, updateData);

    res.status(200).json({
      message: "Matched record updated successfully",
      matched: updatedMatched,
    });
  } catch (error) {
    console.error("Error in patchMatched:", error.message);

    // Handle errors with appropriate status codes
    if (error.message === "Invalid Matched ID format") {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === "Matched record not found") {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
};

const createNewTimeEventsHandler = async (req, res) => {
  const { id } = req.params;
  const { time } = req.body;
  try {
    if (!time || !Array.isArray(time) || time.length === 0) {
      return res.status(400).json({ message: "No valid time data provided" });
    }
    const updatedMatched = await matchedDAO.createNewTimeEvents(id, time);

    res.status(200).json({
      message: "New time events added successfully",
      matched: updatedMatched,
    });
  } catch (error) {
    console.error("Error in createNewTimeEventsHandler:", error.message);

    if (error.message === "Invalid Matched ID format") {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === "Matched record not found") {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
};

export default {
  createMatchedHandler,
  getMatchedInfoByGroupId,
  updateMatchedStatus,
  getAllMatchingDetailByMentorId,
  patchMatched,
  createNewTimeEventsHandler,
};
