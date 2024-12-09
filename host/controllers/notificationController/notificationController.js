import notificationDAO from "../../repositories/mentorDAO/notificationDAO/index.js";

const fetchNotifications = async (req, res) => {
  try {
    const userId = req.user; // Lấy thông tin user từ middleware userProfile
    const { isRead, type, limit, page } = req.query; // Các tham số lọc và phân trang

    const options = {
      isRead: isRead === "true" ? true : isRead === "false" ? false : undefined,
      type,
      limit: parseInt(limit, 10) || 10,
      page: parseInt(page, 10) || 1,
    };

    const result = await notificationDAO.getNotificationsByRecipient(
      userId,
      options
    );

    res.status(200).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching notifications", error: error.message });
  }
};

const markNotificationAsReadHandler = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const notification = await notificationDAO.markNotificationAsRead(
      notificationId
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res
      .status(200)
      .json({ message: "Notification marked as read", notification });
  } catch (error) {
    res.status(500).json({
      message: "Error marking notification as read",
      error: error.message,
    });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    await notificationDAO.markAllNotificationsAsRead(userId);
    res
      .status(200)
      .json({ message: "Tất cả thông báo đã được đánh dấu là đã đọc." });
  } catch (error) {
    console.error("Error in markAllNotificationsAsRead:", error.message);
    res
      .status(500)
      .json({ error: "Lỗi khi đánh dấu tất cả thông báo là đã đọc." });
  }
};
export default {
  fetchNotifications,
  markNotificationAsReadHandler,
  markAllNotificationsAsRead,
};
