import groupDAO from "../../repositories/groupDAO/index.js";
import matchedDAO from "../../repositories/matchedDAO/index.js";
import notificationDAO from "../../repositories/mentorDAO/notificationDAO/index.js";
import projectDAO from "../../repositories/projectDAO/index.js";

const createMatchedHandler = async (req, res) => {
  try {
    const { groupId, mentorId, status, teacherId } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!groupId || !mentorId) {
      return res
        .status(400)
        .json({ message: "groupId và mentorId là bắt buộc" });
    }
    const recipients = [mentorId];

    const notificationMessage = `Bạn đã được giáo viên ghép với một dự án. Hãy đi kiểm tra và xác nhận!`;
    const notifications = await notificationDAO.createNotifications({
      message: notificationMessage,
      type: "MatchedNotification",
      recipients,
      filters: { groupId: groupId },
      senderId: teacherId,
      audience: "Student",
      groupByKey: `Group_${groupId}`,
      io: req.io,
    });

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

    if (!updatedMatched) {
      return res.status(404).json({ message: "Matched record not found" });
    }

    res.status(200).json({
      message: "New time events added successfully",
      matched: updatedMatched,
    });
  } catch (error) {
    console.error("Error in createNewTimeEventsHandler:", error.message);

    const statusCode = error.message.includes("Invalid Matched ID") ? 400 : 500;

    res.status(statusCode).json({ error: error.message });
  }
};

const patchTimeEventHandler = async (req, res) => {
  const { eventId } = req.params;
  const updateData = req.body;

  try {
    if (
      !updateData ||
      typeof updateData !== "object" ||
      Object.keys(updateData).length === 0
    ) {
      return res.status(400).json({ message: "No valid update data provided" });
    }

    const updatedMatched = await matchedDAO.patchTimeEventById(
      eventId,
      updateData
    );

    res.status(200).json({
      message: "Time event updated successfully",
      matched: updatedMatched,
    });
  } catch (error) {
    console.error("Error in updateTimeEventHandler:", error.message);

    if (error.message === "Invalid Event ID format") {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === "Event record not found") {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
};

const deleteTimeEventHandler = async (req, res) => {
  const { eventId } = req.params;

  try {
    const updatedMatched = await matchedDAO.deleteTimeEventById(eventId);
    // const groupId = updatedMatched.groupId;
    // const mentorId = updatedMatched.mentorId;
    // const groupMembers = await groupDAO.getGroupMembers(group._id);
    // const recipients = groupMembers.map((member) => member._id);

    // if (!groupId || !mentorId) {
    //   return res
    //     .status(400)
    //     .json({ message: "Group ID or Mentor ID missing in Matched" });
    // }

    // const group = await projectDAO.findGroupById(groupId);
    // if (!Array.isArray(updatedMatched.time)) {
    //   return res
    //     .status(400)
    //     .json({ message: "Time array not found in Matched" });
    // }
    // const notificationMessage = `Người hướng dẫn của bạn đã hủy lịch họp`;
    // await notificationDAO.createNotifications({
    //   message: notificationMessage,
    //   type: "DeleteMeetingTimeNotification",
    //   recipients,
    //   filters: { groupId: group._id, groupName: group.name },
    //   senderId: group._id,
    //   io: req.io,
    // });
    res.status(200).json({
      message: "Time event deleted successfully",
      matched: updatedMatched,
    });
  } catch (error) {
    console.error("Error in deleteTimeEventHandler:", error.message);

    if (error.message === "Invalid Event ID format") {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === "Event record not found") {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
};

const getMatchedInfoByClassId = async (req, res) => {
  const { classId, semesterId } = req.params;
  console.log(semesterId);

  try {
    // Gọi hàm getGroupsByClassId để lấy danh sách nhóm trong lớp
    const { groups } = await groupDAO.getGroupsByClassId(classId, semesterId);

    if (!groups || groups.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy nhóm nào trong lớp này." });
    }
    // Lọc các nhóm chưa có mentor
    const groupsWithoutMentor = groups.filter((group) => group.mentor);

    if (groupsWithoutMentor.length === 0) {
      return res.status(200).json({
        message: "Tất cả các nhóm trong lớp đã có mentor.",
        groups,
      });
    }

    // Lấy thông tin matched cho từng nhóm chưa có mentor
    const detailedGroups = await Promise.all(
      groupsWithoutMentor.map(async (group) => {
        const matchedInfo = await matchedDAO.getMatchedInfoByGroupId(group._id);
        return {
          group,
          matchedInfo,
        };
      })
    );
    res.status(200).json({
      message: "Thông tin nhóm và matched trong lớp được lấy thành công.",
      groups: detailedGroups,
    });
    console.log(detailedGroups);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin nhóm và matched:", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteMatched = async (req, res) => {
  try {
    const { groupId } = req.params; // Lấy id từ URL params
    const deletedMatched = await matchedDAO.deleteMatchedById(groupId);
    return res
      .status(200)
      .json({ message: "Xóa dữ liệu thành công.", data: deletedMatched });
  } catch (error) {
    console.error("Lỗi khi xóa dữ liệu:", error);
    return res.status(500).json({
      message: "Đã xảy ra lỗi khi xóa dữ liệu.",
      error: error.message,
    });
  }
};

const getMatchedGroupsCountController = async (req, res) => {
  try {
    const { classId } = req.params;

    // Call the service function
    const result = await matchedDAO.getMatchedGroupsCount(classId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi máy chủ. Vui lòng thử lại sau.",
    });
  }
};

export default {
  createMatchedHandler,
  getMatchedInfoByGroupId,
  updateMatchedStatus,
  getAllMatchingDetailByMentorId,
  patchMatched,
  createNewTimeEventsHandler,
  patchTimeEventHandler,
  deleteTimeEventHandler,
  getMatchedInfoByClassId,
  deleteMatched,
  getMatchedGroupsCountController,
};
