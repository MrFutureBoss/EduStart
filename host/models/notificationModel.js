import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    message: { type: String, required: true }, // Nội dung thông báo
    type: { type: String, required: true }, // Loại thông báo: "Project", "Class", "System", etc.
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // Người nhận thông báo
    isRead: { type: Boolean, default: false }, // Trạng thái đã đọc/chưa đọc
    filters: {
      classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" }, // Dành cho lớp
      groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" }, // Dành cho nhóm/dự án
      teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Dành cho giáo viên
    },
    createdAt: { type: Date, default: Date.now }, // Thời gian tạo
  },
  { timestamps: true }
);
const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
