import User from "../../models/userModel.js";
import Class from "../../models/classModel.js";

// tìm giáo viên theo userName và role = 2
const findTeacherByUsername = async (username, semesterId) => {
  try {
    const teacher = await User.findOne({
      username,
      role: 2,
      semesterId: semesterId,
    }).exec();
    return teacher;
  } catch (error) {
    console.error(`Error finding teacher by username: ${error.message}`);
    throw new Error(error.message);
  }
};

const findOrCreateClass = async (className, semesterId, teacherId) => {
  try {
    // Kiểm tra xem lớp học đã tồn tại trong kỳ học này chưa
    let classData = await Class.findOne({ className, semesterId })
      .lean()
      .exec();

    if (!classData) {
      // Kiểm tra xem teacherId có hợp lệ và tham gia kỳ học này không
      const teacher = await User.findOne({
        _id: teacherId,
        role: 2,
        semesterId: semesterId,
      }).exec();
      if (!teacher) {
        const error = new Error(
          `Giáo viên với ID: ${teacherId} không tồn tại hoặc không tham gia kỳ học này.`
        );
        error.statusCode = 400;
        throw error;
      }

      // Tạo lớp học mới với teacherId
      classData = new Class({
        className,
        semesterId,
        teacherId: teacherId,
        limitStudent: 30,
        status: "InActive",
      });
      await classData.save();
    }

    // Đếm số học sinh trong lớp thuộc kỳ học cụ thể
    const studentCount = await User.countDocuments({
      classId: classData._id,
      semesterId: semesterId,
    });

    return { classData, studentCount };
  } catch (error) {
    console.error(`Error in findOrCreateClass: ${error.message}`);
    throw error;
  }
};

// tạo danh sách user mới
const createListUsers = async (listData) => {
  try {
    const users = await User.insertMany(listData);
    return users;
  } catch (error) {
    console.error(`Error creating list of users: ${error.message}`);
    throw new Error(error.message);
  }
};

// Tìm người dùng theo email
const findUserByEmail = async (email) => {
  try {
    const user = await User.findOne({ email: email });
    return user;
  } catch (error) {
    console.error(`Lỗi khi tìm kiếm người dùng theo email: ${email}`, error);
    throw error;
  }
};

const assignStudentToClass = async (userId, classId) => {
  try {
    const studentCount = await User.countDocuments({ classId });
    const classData = await Class.findById(classId);
    if (!classData) {
      throw new Error("Lớp không tồn tại");
    }
    if (studentCount >= classData.limitStudent) {
      throw new Error("Lớp đã đầy");
    }
    await User.findByIdAndUpdate(userId, { classId, status: "Active" });

    return {
      message: "Thêm học sinh vào lớp thành công",
    };
  } catch (error) {
    console.error("Lỗi khi thêm học sinh vào lớp:", error);
    throw error;
  }
};

const findFullClassUsers = async (semesterId) => {
  return await User.find({ semesterId, status: "Pending" }).lean();
};

const findUserByRollNumber = async (rollNumber) => {
  try {
    return await User.findOne({ rollNumber });
  } catch (error) {
    throw new Error("Lỗi khi tìm người dùng bằng RollNumber.");
  }
};

// Tìm người dùng dựa trên MemberCode
const findUserByMemberCode = async (memberCode) => {
  try {
    return await User.findOne({ memberCode });
  } catch (error) {
    throw new Error("Lỗi khi tìm người dùng bằng MemberCode.");
  }
};

const createUser = async (userData) => {
  try {
    const user = await User.create(userData);
    return user;
  } catch (error) {
    console.error(`Error creating user: ${error.message}`);
    throw new Error(`Lỗi khi tạo người dùng: ${error.message}`);
  }
};

export default {
  findTeacherByUsername,
  findOrCreateClass,
  createListUsers,
  findUserByEmail,
  assignStudentToClass,
  findFullClassUsers,
  findUserByRollNumber,
  findUserByMemberCode,
  createUser,
};
