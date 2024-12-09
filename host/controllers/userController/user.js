import userDAO from "../../repositories/userDAO/index.js";
import { clearOTP, verifyOTP } from "../../utilities/otpStore.js";
import { sendEmail } from "../../utilities/email.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import notificationDAO from "../../repositories/mentorDAO/notificationDAO/index.js";
import groupDAO from "../../repositories/groupDAO/index.js";
import TempGroupDAO from "../../repositories/tempGroupDAO/index.js";

const getUserLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const token = await userDAO.loginUser({ email, password });
    const user = await userDAO.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.status(200).json({ token, user });
  } catch (error) {
    if (error.message === "Wrong password.") {
      return res.status(401).json({ error: error.message });
    }
    if (error.message === "User not found.") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

const userProfile = async (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(401).send("Access denied");
  }

  const tokenString = token.split(" ")[1];

  try {
    const decoded = jwt.verify(tokenString, process.env.SECRETKEY);
    req.user = decoded;

    if (!mongoose.Types.ObjectId.isValid(decoded._id)) {
      return res.status(400).json({ error: "Invalid user ID format in token" });
    }

    const result = await userDAO.findUserById(
      new mongoose.Types.ObjectId(decoded._id)
    );
    res.status(201).json(result);
  } catch (error) {
    console.error("Error in userProfile:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const emailExist = await userDAO.findUser({ email });
  if (!emailExist) {
    return res.status(404).send("Email not found");
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  sendEmail({ recipient_email: email, OTP: otp })
    .then((response) => res.send(response.message))
    .catch((error) => {
      console.error("Email sending error: ", error);
      res.status(500).send(error.message);
    });
};

const resetPassword = async (req, res) => {
  const { email, newPassword, otp } = req.body;
  try {
    const user = await userDAO.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const result = verifyOTP(email, otp);
    if (!result.valid) {
      return res.status(400).send(result.message);
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be longer than 6 characters" });
    }
    clearOTP(email);
    await userDAO.updateUserPassword(user._id, newPassword);
    res
      .status(200)
      .json({ message: "Password successfully updated", newPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const changePassword = async (req, res) => {
  const { email, oldPassword, newPassword } = req.body; // Get email, old password, and new password from request

  try {
    const result = await userDAO.changePassword(
      email,
      oldPassword,
      newPassword
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const findUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await userDAO.findUserById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params; // User ID from request params
  const updateData = req.body; // Updated data from request body

  try {
    // Check if user exists
    const existingUser = await userDAO.findUserById(id);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user
    const updatedUser = await userDAO.updateUserById(id, updateData);
    return res.status(200).json({
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error.message);
    return res.status(500).json({
      message: "An error occurred while updating the user",
      error: error.message,
    });
  }
};

const getAllStudentByClassId = async (req, res) => {
  const { classId } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit) : null;
  const skip = req.query.skip ? parseInt(req.query.skip) : null;

  try {
    const { students, total } = await userDAO.getAllStudentByClassId(
      classId,
      limit,
      skip
    );

    if (!students.length) {
      return res
        .status(404)
        .json({ message: "No students found in this class." });
    }

    res.status(200).json({
      students,
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const patchUser = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  try {
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No update data provided" });
    }
    const updatedUser = await userDAO.updateUserById(id, updateData);
    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in patchUser:", error.message);
    if (error.message === "User not found") {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({ error: error.message });
  }
};

const editUserProfile = async (req, res) => {
  const userId = req.user._id; // ID người dùng từ token
  const updateData = req.body; // Dữ liệu cập nhật từ request body

  try {
    // Kiểm tra nếu không có dữ liệu cập nhật
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No update data provided" });
    }

    // Lấy thông tin người dùng hiện tại
    const existingUser = await userDAO.findUserById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cập nhật thông tin người dùng
    const updatedUser = await userDAO.updateInfoUserById(userId, updateData);
    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in editUserProfile:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const updateLeaderByTeacher = async (req, res) => {
  const { _id, isLeader, groupId, teacherId } = req.body;
  const groupMembers = await groupDAO.getGroupMembers(groupId);

  const recipients = groupMembers.map((member) => member._id);

  try {
    // Cập nhật thông tin leader
    const updatedUser = await userDAO.updateUserLeaderStatus(_id, isLeader);

    // Tạo thông báo thay đổi leader cho nhóm
    const notificationMessage = `Nhóm của bạn đã cập nhật lại nhóm trưởng.`;
    const notifications = await notificationDAO.createNotifications({
      message: notificationMessage,
      type: "ChangeLeader",
      recipients,
      filters: { groupId: groupId },
      senderId: teacherId,
      io: req.io,
    });
    res.json({ message: "Leader updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const checkUserGroup = async (req, res) => {
  const userId = req.user._id; // ID người dùng từ token

  try {
    // Kiểm tra người dùng có nhóm chưa
    const user = await userDAO.findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log(user);

    const tempGroup = await TempGroupDAO.findTempGroupByClassId(user.classId);

    if (tempGroup) {
      // Giáo viên đã tạo nhóm cho lớp
      return res.status(200).json({
        type: "teacherCreatedGroup",
        message: "Giáo viên đã tạo nhóm cho lớp này",
        user,
      });
    } else {
      // Giáo viên chưa tạo nhóm
      return res.status(200).json({
        type: "noGroup",
        message: "Giáo viên chưa tạo nhóm cho lớp này",
      });
    }
  } catch (error) {
    console.error("Error in checkClassGroup:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export default {
  getUserLogin,
  forgotPassword,
  resetPassword,
  findUserById,
  changePassword,
  userProfile,
  updateUser,
  getAllStudentByClassId,
  patchUser,
  editUserProfile,
  updateLeaderByTeacher,
  checkUserGroup,
};
