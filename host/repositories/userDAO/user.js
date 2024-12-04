import User from "../../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const loginUser = async ({ email, password }) => {
  try {
    const user = await User.findOne({ email: email });
    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        const role = user.role;
        const token = jwt.sign({ _id: user._id, role }, process.env.SECRETKEY, {
          expiresIn: "12h",
        });

        return token;
      } else {
        throw new Error("Wrong password.");
      }
    } else {
      throw new Error("User not found.");
    }
  } catch (e) {
    throw new Error(e.message);
  }
};

const findUserByEmail = async (email) => {
  try {
    return await User.findOne({ email });
  } catch (error) {
    throw new Error(error.message);
  }
};

const findUser = async (query) => {
  try {
    return await User.findOne(query);
  } catch (error) {
    throw new Error(error.message);
  }
};

const findUserById = async (id) => {
  try {
    const user = await User.aggregate([
      // Tìm người dùng theo `_id`
      { $match: { _id: new mongoose.Types.ObjectId(id) } },

      // Kết nối với bảng `classes` để lấy thông tin lớp học của người dùng
      {
        $lookup: {
          from: "classes",
          localField: "classId",
          foreignField: "_id",
          as: "classInfo",
        },
      },

      // Kết nối với bảng `groups` để lấy thông tin nhóm của người dùng
      {
        $lookup: {
          from: "groups",
          localField: "groupId",
          foreignField: "_id",
          as: "groupInfo",
        },
      },

      // Kết nối với bảng `projects` thông qua `groupInfo.projectId` để lấy thông tin dự án
      {
        $lookup: {
          from: "projects",
          localField: "groupInfo.projectId",
          foreignField: "_id",
          as: "projectInfo",
        },
      },

      // Kết nối với bảng `matcheds` thông qua `groupInfo._id` để lấy thông tin ghép nối
      {
        $lookup: {
          from: "matcheds",
          localField: "groupInfo._id",
          foreignField: "groupId",
          as: "matchedInfo",
        },
      },

      // Kết nối với bảng `users` để lấy thông tin mentor từ `matchedInfo.mentorId`
      {
        $lookup: {
          from: "users",
          localField: "matchedInfo.mentorId",
          foreignField: "_id",
          as: "mentorInfo",
        },
      },

      // Kết nối với bảng `classes` để lấy danh sách lớp dạy của giáo viên nếu user có vai trò là giáo viên
      {
        $lookup: {
          from: "classes",
          localField: "_id",
          foreignField: "teacherId",
          as: "classList",
        },
      },

      // Thêm trường isLeader và các trường khác vào kết quả
      {
        $addFields: {
          isLeader: "$isLeader",
          username: "$username",
          email: "$email",
          role: "$role",
          Dob: "$Dob",
          phoneNumber: "$phoneNumber",
          degree: "$degree",
          semesterId: "$semesterId",
          status: "$status",
          rollNumber: "$rollNumber",
          memberCode: "$memberCode",
          createdAt: "$createdAt",
          updatedAt: "$updatedAt",
        },
      },

      // Chọn các trường cần thiết trong kết quả để tránh trùng lặp
      {
        $project: {
          password: 0, // Ẩn trường mật khẩu để bảo mật
        },
      },
    ]);

    return user[0];
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateUserPassword = async (userId, newPassword) => {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await User.findByIdAndUpdate(userId, { password: hashedPassword });
  } catch (error) {
    throw new Error(error.message);
  }
};

const changePassword = async (email, oldPassword, newPassword) => {
  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found.");
    }

    // Check if the old password matches
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error("Old password is incorrect.");
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    return { message: "Password changed successfully." };
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateUserById = async (userId, updateData) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true, // Return the updated document
      runValidators: true, // Run schema validation
    });
    return updatedUser;
  } catch (error) {
    throw error;
  }
};

const getAllStudentByClassId = async (classId, limit, skip) => {
  try {
    const query = User.find({
      role: 4,
      classId: classId,
    }).populate("classId", "className");

    if (limit !== null) query.limit(limit);
    if (skip !== null) query.skip(skip);

    const students = await query;

    const total = await User.countDocuments({
      role: 4,
      classId: classId,
    });

    return { students, total };
  } catch (error) {
    throw new Error(error.message);
  }
};

const updateInfoUserById = async (userId, updateData) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true } // Trả về document đã được cập nhật
    );
    return updatedUser;
  } catch (error) {
    throw new Error(error.message);
  }
};
const findLeaderByGroupId = async (groupId) => {
  return await User.findOne({ groupId, isLeader: true }).exec();
};

const updateUserLeaderStatus = async (userId, isLeader) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (isLeader) {
    if (user.isLeader) {
      throw new Error("User is already a leader");
    }
    const existingLeader = await findLeaderByGroupId(user.groupId);
    if (existingLeader) {
      existingLeader.isLeader = false;
      await existingLeader.save();
    }
  }

  user.isLeader = isLeader;
  await user.save();

  return user;
};
export default {
  loginUser,
  findUserByEmail,
  findUser,
  findUserById,
  updateUserPassword,
  changePassword,
  getAllStudentByClassId,
  updateUserById,
  updateInfoUserById,
  updateUserLeaderStatus,
  findLeaderByGroupId,
};
