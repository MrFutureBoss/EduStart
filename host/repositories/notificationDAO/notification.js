import Notification from "../../models/notificationModel.js";

const createNotification = async (data) => {
  const { message, type, recipient, filters, io } = data;
  const notification = await Notification.create({
    message,
    type,
    recipient,
    filters,
  });

  // Gửi thông báo qua Socket.IO
  if (io && recipient) {
    io.to(`user:${recipient}`).emit("notification", notification);
  }

  return notification;
};

// Lấy thông báo của người dùng
const getNotificationsByRecipient = async (userId, options = {}) => {
  const { isRead, type, limit = 10, page = 1 } = options;

  // Tạo bộ lọc dựa trên điều kiện
  const filters = { recipient: userId };
  if (typeof isRead !== "undefined") filters.isRead = isRead; // Lọc theo trạng thái đọc
  if (type) filters.type = type; // Lọc theo loại thông báo

  // Tính toán phân trang
  const skip = (page - 1) * limit;

  // Lấy danh sách thông báo
  const notifications = await Notification.find(filters)
    .sort({ createdAt: -1 }) // Sắp xếp mới nhất lên trước
    .skip(skip)
    .limit(limit);

  // Đếm tổng số thông báo
  const total = await Notification.countDocuments(filters);

  return {
    total,
    page,
    limit,
    notifications,
  };
};
const createNotifications = async ({
  message,
  type,
  recipients,
  filters,
  senderId,
  audience,
  groupByKey,
  io,
}) => {
  // Tạo thông báo trong cơ sở dữ liệu
  const notifications = await Promise.all(
    recipients.map((recipient) =>
      Notification.create({
        message,
        type,
        recipient, // Gửi đến từng học sinh
        filters,
        senderId,
        audience,
        groupByKey,
      })
    )
  );

  // Gửi thông báo qua Socket.IO
  if (io) {
    const recipientsArray = Array.isArray(recipients)
      ? recipients
      : [recipients];

    recipientsArray.forEach((recipientId) => {
      io.to(`user:${recipientId}`).emit("notification", {
        message,
        type,
        filters,
        groupByKey,
        createdAt: new Date(),
      });
    });
  }

  return notifications;
};

// Đánh dấu thông báo là đã đọc
const markNotificationAsRead = async (notificationId) => {
  return await Notification.findByIdAndUpdate(
    notificationId,
    { isRead: true },
    { new: true }
  );
};
// Lấy thông báo theo bộ lọc
export const getNotificationsByFilters = async (filters) => {
  return await Notification.find(filters).sort({ createdAt: -1 });
};

const markAllNotificationsAsRead = async (userId) => {
  return Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true } }
  );
};
export default {
  createNotification,
  getNotificationsByRecipient,
  markNotificationAsRead,
  getNotificationsByFilters,
  createNotifications,
  markAllNotificationsAsRead,
};