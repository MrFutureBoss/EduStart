import adminsDAO from "../../repositories/adminDAO/index.js";
import bcrypt from "bcrypt";
import xlsx from "xlsx";
import classDAO from "../../repositories/classDAO/index.js";
import nodemailer from "nodemailer";
import semesterDAO from "../../repositories/semesterDAO/index.js";
import { sendEmailToUser } from "../../utilities/email.js";

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const validateEmailDomain = (email) => {
  const domainRe = /^[^\s@]+@(gmail\.com|fpt\.edu\.vn|fe\.edu\.vn)$/;
  return domainRe.test(String(email).toLowerCase());
};

const normalizeUserData = (row, role, sourceType = "manual") => {
  const normalized = {
    email: row.Email ? row.Email.trim().toLowerCase() : "",
    role: role,
  };

  // Xử lý phoneNumber dựa trên sourceType
  if (sourceType === "excel") {
    normalized.phoneNumber = row["Số điện thoại"]
      ? String(row["Số điện thoại"]).replace(/\D/g, "").trim()
      : "";
  } else if (sourceType === "manual") {
    normalized.phoneNumber = row.phoneNumber
      ? String(row.phoneNumber).replace(/\D/g, "").trim()
      : "";
  }

  // Xử lý cho học sinh (role 4)
  if (role == 4) {
    if (sourceType === "excel") {
      // Dữ liệu từ file Excel cho học sinh
      normalized.username = row.FullName ? row.FullName.trim() : "Unknown";
      normalized.rollNumber = row.RollNumber ? row.RollNumber.trim() : "";
      normalized.memberCode = row.MemberCode ? row.MemberCode.trim() : "";
      normalized.teacherUsername = row["GV chính"]
        ? row["GV chính"].trim()
        : "";
      normalized.slotType = row.SlotType ? row.SlotType.trim() : "TS33";
      normalized.className = row.ClassName ? row.ClassName.trim() : "";

      if (!normalized.teacherUsername) {
        throw new Error(
          `Thiếu username giáo viên cho học sinh: ${normalized.username}`
        );
      }

      if (!normalized.rollNumber) {
        throw new Error(
          `Thiếu mã số sinh viên cho học sinh: ${normalized.username}`
        );
      }

      if (!normalized.memberCode) {
        throw new Error(
          `Thiếu mã thành viên cho học sinh: ${normalized.username}`
        );
      }
    } else if (sourceType === "manual") {
      // Dữ liệu nhập tay cho học sinh
      normalized.username = row.username ? row.username.trim() : "Unknown";
      normalized.rollNumber = row.rollNumber ? row.rollNumber.trim() : "";
      normalized.memberCode = row.memberCode ? row.memberCode.trim() : "";

      if (!normalized.rollNumber) {
        throw new Error("Vui lòng nhập mã số sinh viên (RollNumber).");
      }

      if (!normalized.memberCode) {
        throw new Error("Vui lòng nhập mã thành viên (MemberCode).");
      }
    }
  }

  // Xử lý cho giáo viên (role 2)
  if (role == 2) {
    if (sourceType === "excel") {
      // Dữ liệu từ file Excel cho giáo viên
      normalized.username = row["Họ và tên Giáo Viên"]
        ? row["Họ và tên Giáo Viên"].trim()
        : "Unknown";

      if (!normalized.username) {
        throw new Error("Thiếu tên giáo viên trong dữ liệu Excel.");
      }

      if (
        !normalized.phoneNumber ||
        !/^[0-9]{10}$/.test(normalized.phoneNumber)
      ) {
        throw new Error("Số điện thoại của giáo viên phải gồm 10 chữ số.");
      }
    } else if (sourceType === "manual") {
      // Dữ liệu nhập tay cho giáo viên
      normalized.username = row.username ? row.username.trim() : "Unknown";

      if (
        !normalized.phoneNumber ||
        !/^[0-9]{10}$/.test(normalized.phoneNumber)
      ) {
        throw new Error("Số điện thoại của giáo viên phải gồm 10 chữ số.");
      }
    }
  }

  // Xử lý cho mentor (role 3)
  if (role == 3) {
    if (sourceType === "excel") {
      // Dữ liệu từ file Excel cho mentor
      normalized.username = row["Họ và tên Mentor"]
        ? row["Họ và tên Mentor"].trim()
        : "Unknown";

      if (!normalized.username) {
        throw new Error("Thiếu tên mentor trong dữ liệu Excel.");
      }

      // Thêm xử lý loại bỏ ký tự không phải số khỏi số điện thoại
      normalized.phoneNumber = row["Số điện thoại"]
        ? String(row["Số điện thoại"]).replace(/\D/g, "").trim()
        : "";

      if (
        !normalized.phoneNumber ||
        !/^[0-9]{10}$/.test(normalized.phoneNumber)
      ) {
        throw new Error("Số điện thoại của mentor phải gồm 10 chữ số.");
      }
    } else if (sourceType === "manual") {
      // Dữ liệu nhập tay cho mentor
      normalized.username = row.username ? row.username.trim() : "Unknown";

      if (
        !normalized.phoneNumber ||
        !/^[0-9]{10}$/.test(normalized.phoneNumber)
      ) {
        throw new Error("Số điện thoại của mentor phải gồm 10 chữ số.");
      }
    }
  }

  // Kiểm tra email
  if (!normalized.email || !validateEmail(normalized.email)) {
    throw new Error(`Email không hợp lệ: ${normalized.email}`);
  }

  if (!validateEmailDomain(normalized.email)) {
    throw new Error(
      `Email phải có đuôi @gmail.com hoặc @fpt.edu.vn hoặc @fe.edu.vn:  ${normalized.email}`
    );
  }

  return normalized;
};

const insertListUsers = async (req, res, next) => {
  try {
    const { semesterId, role } = req.body;

    // Kiểm tra thông tin cơ bản của request
    if (!semesterId) {
      const error = new Error("Semester ID không tồn tại.");
      error.statusCode = 400;
      throw error;
    }
    if (!role) {
      const error = new Error("Role không tồn tại.");
      error.statusCode = 400;
      throw error;
    }

    const file = req.file;
    if (!file) {
      const error = new Error("File không tồn tại.");
      error.statusCode = 400;
      throw error;
    }

    const workbook = xlsx.read(file.buffer);
    const sheet_name_list = workbook.SheetNames;
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

    // Khai báo các biến để đếm và lưu trữ thông tin
    let totalUsersAdded = 0;
    let totalUsersUpdated = 0;
    const errorMessages = [];
    const duplicateEmails = [];
    const duplicateRollNumbers = [];
    const duplicateMemberCodes = [];
    const usersToInsert = [];
    const usersToEmail = [];
    const fullClassUsers = [];
    const failedEmails = [];
    const existingUserName = [];
    // Nhóm dữ liệu theo className (only role 4)
    const classUsersMap = {}; // { className: [user1, user2, ...] }

    // Chuẩn hóa và kiểm tra dữ liệu từ file
    for (const row of data) {
      let user;
      try {
        user = normalizeUserData(row, role, "excel");
      } catch (error) {
        errorMessages.push({
          email: row.email || "Unknown",
          message: `Lỗi dữ liệu trong file: ${error.message}`,
        });
        continue;
      }

      // Kiểm tra email hợp lệ cho role giáo viên (role 2) và mentor (role 3)
      if (
        (role == 2 || role == 3) &&
        !user.email.endsWith("@fe.edu.vn") &&
        !user.email.endsWith("@gmail.com")
      ) {
        errorMessages.push({
          email: user.email,
          message: `Email phải có đuôi @fe.edu.vn hoặc @gmail.com`,
        });
        continue;
      }

      // Kiểm tra xem email đã tồn tại chưa
      const existingUser = await adminsDAO.findUserByEmail(user.email);
      if (existingUser) {
        // Kiểm tra xem người dùng đã tham gia vào kỳ học hiện tại chưa
        const isInCurrentSemester =
          Array.isArray(existingUser.semesterId) &&
          existingUser.semesterId
            .map((id) => id.toString())
            .includes(semesterId);

        if (isInCurrentSemester) {
          duplicateEmails.push(user.email);
          errorMessages.push({
            email: user.email,
            message: `Email đã tồn tại trong kỳ học hiện tại.`,
          });
          continue;
        } else {
          // Kiểm tra các kỳ học trước đó của người dùng đã hoàn thành chưa
          if (existingUser.semesterId.length > 0) {
            const previousSemesters = await semesterDAO.findSemesterFinished(
              existingUser.semesterId
            );

            if (previousSemesters.length !== existingUser.semesterId.length) {
              errorMessages.push({
                email: user.email,
                message: `Người dùng có các kỳ học chưa hoàn thành.`,
              });
              failedEmails.push(user.email);
              continue;
            }
          }

          // Cập nhật người dùng để thêm kỳ học mới
          existingUser.semesterId.push(semesterId);
          await existingUser.save();

          // Thêm vào danh sách để gửi email thông báo
          usersToEmail.push({
            email: user.email,
            password: null,
            status: "Active",
          });

          totalUsersUpdated += 1;
          continue;
        }
      }

      if (role == 4) {
        // Kiểm tra sự trùng lặp của rollNumber và memberCode
        const existingUserByRollNumber = await adminsDAO.findUserByRollNumber(
          user.rollNumber
        );
        if (existingUserByRollNumber) {
          duplicateRollNumbers.push(user.rollNumber);
          errorMessages.push({
            rollNumber: user.rollNumber,
            message: `Mã số sinh viên đã tồn tại: ${user.rollNumber}`,
          });
          continue;
        }

        const existingUserByMemberCode = await adminsDAO.findUserByMemberCode(
          user.memberCode
        );
        if (existingUserByMemberCode) {
          duplicateMemberCodes.push(user.memberCode);
          errorMessages.push({
            memberCode: user.memberCode,
            message: `Mã thành viên đã tồn tại: ${user.memberCode}`,
          });
          continue;
        }

        // Nhóm học sinh theo className
        if (!classUsersMap[user.className]) {
          classUsersMap[user.className] = [];
        }
        classUsersMap[user.className].push(user);
      } else if (role == 3) {
        // Xử lý các role khác
        const password = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(password, 12);

        const userData = {
          ...user,
          password: hashedPassword,
          semesterId: [semesterId],
          status: "Active",
        };

        usersToInsert.push(userData);
        usersToEmail.push({ email: user.email, password, status: "Active" });
        totalUsersAdded += 1;
      } else if (role == 2) {
        const checkTeacherExis = await adminsDAO.findTeacherByUsername(
          user.username,
          semesterId
        );
        if (checkTeacherExis) {
          existingUserName.push(user.username),
            errorMessages.push({
              field: "username",
              email: user.email,
              message: `Tên giáo viên: ${user.username} đã tồn tại trong hệ thống.`,
            });
          continue;
        }
        // Xử lý các role khác
        const password = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(password, 12);

        const userData = {
          ...user,
          password: hashedPassword,
          semesterId: [semesterId],
          status: "Active",
        };

        usersToInsert.push(userData);
        usersToEmail.push({ email: user.email, password, status: "Active" });
        totalUsersAdded += 1;
      } else {
        errorMessages.push({
          email: user.email,
          message: `Role không hợp lệ.`,
        });
        continue;
      }
    }

    // Xử lý từng lớp học (role == 4)
    for (const [className, users] of Object.entries(classUsersMap)) {
      if (users.length === 0) continue;

      // Tất cả các học sinh trong cùng một lớp có cùng teacherUsername
      const teacherUsername = users[0].teacherUsername;
      if (!teacherUsername) {
        errorMessages.push({
          message: `Thiếu teacherUsername cho lớp: ${className}`,
        });
        continue;
      }

      // Tìm giáo viên bằng username và kiểm tra semesterId
      let teacher;
      try {
        teacher = await adminsDAO.findTeacherByUsername(
          teacherUsername,
          semesterId
        );
      } catch (error) {
        errorMessages.push({
          email: users[0].email,
          message: `Không thể tìm giáo viên cho lớp ${className}: ${error.message}`,
        });
        continue;
      }

      // Tìm hoặc tạo lớp học với semesterId và teacherId
      let { classData, studentCount } = await adminsDAO.findOrCreateClass(
        className,
        semesterId,
        teacher._id
      );

      const remainingSlots = classData.limitStudent - studentCount;

      if (remainingSlots <= 0) {
        // Lớp đã đầy, thêm học sinh vào danh sách fullClassUsers với trạng thái Pending
        fullClassUsers.push(...users);

        for (const user of users) {
          const password = generateRandomPassword();
          const hashedPassword = await bcrypt.hash(password, 12);

          const userData = {
            ...user,
            password: hashedPassword,
            classId: null,
            semesterId: semesterId,
            status: "Pending",
          };

          usersToInsert.push(userData);
          usersToEmail.push({ email: user.email, password, status: "Pending" });
        }
        errorMessages.push({
          className: className,
          message: `Lớp ${className} đã đầy.`,
        });
        continue;
      }

      // Số học sinh có thể thêm vào lớp
      const usersCanAdd = users.slice(0, remainingSlots);
      const usersCannotAdd = users.slice(remainingSlots);

      // Thêm học sinh có thể thêm vào lớp
      for (const user of usersCanAdd) {
        const password = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(password, 12);

        const userData = {
          ...user,
          password: hashedPassword,
          classId: classData._id,
          semesterId: semesterId,
          status: "Active",
        };

        usersToInsert.push(userData);
        usersToEmail.push({ email: user.email, password, status: "Active" });
        totalUsersAdded += 1;
      }

      // Thêm học sinh không thể thêm vào lớp vào danh sách fullClassUsers với trạng thái Pending
      for (const user of usersCannotAdd) {
        const password = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(password, 12);

        const userData = {
          ...user,
          password: hashedPassword,
          classId: null,
          semesterId: semesterId,
          status: "Pending",
        };

        usersToInsert.push(userData);
        usersToEmail.push({ email: user.email, password, status: "Pending" });
        fullClassUsers.push(userData);

        errorMessages.push({
          email: user.email,
          message: `Không thể thêm vào lớp ${className} vì lớp đã đầy.`,
        });
      }
    }

    // Thực hiện insert danh sách người dùng
    if (usersToInsert.length > 0) {
      try {
        await adminsDAO.createListUsers(usersToInsert);
      } catch (insertError) {
        errorMessages.push({
          message: "Lỗi khi thêm người dùng vào cơ sở dữ liệu.",
          details: insertError.message,
        });
      }
    }

    // Gửi email cho các người dùng đã được thêm thành công
    for (const user of usersToEmail) {
      try {
        // Nếu status là Pending, không gửi mật khẩu
        const passwordToSend = user.status === "Pending" ? null : user.password;
        await sendEmailToUser(user.email, passwordToSend, user.status);
      } catch (emailError) {
        errorMessages.push({
          email: user.email,
          message: `Gửi email thất bại: ${emailError.message}`,
        });
      }
    }

    // Tính số lượng người dùng được thêm thành công
    const successCount = totalUsersAdded + totalUsersUpdated;

    res.status(200).json({
      success: true,
      message: "Đã xử lý xong tất cả người dùng.",
      successCount,
      duplicateEmails,
      duplicateRollNumbers,
      duplicateMemberCodes,
      fullClassUsers,
      failedEmails,
      errorMessages,
    });
  } catch (error) {
    next(error);
  }
};

// Hàm thêm người dùng bằng tay
const insertUserByHand = async (req, res, next) => {
  try {
    const { semesterId, role, userInput } = req.body;
    const errors = [];
    console.log(userInput);

    // Validate semesterId
    if (!semesterId) {
      errors.push({
        field: "semesterId",
        message: "Semester ID không tồn tại.",
      });
    }

    // Validate role
    if (!role) {
      errors.push({
        field: "role",
        message: "Role không tồn tại.",
      });
    }

    // Validate userInput
    if (!userInput || typeof userInput !== "object") {
      errors.push({
        field: "userInput",
        message: "Thông tin người dùng không hợp lệ.",
      });
    }

    // If initial validations fail, return all errors
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Normalize user data
    let user;

    try {
      user = normalizeUserData(userInput, role, "manual");
      if (!user.username || user.username.trim() === "") {
        throw {
          field: "username",
          message: "Tên người dùng không được để trống.",
        };
      }
    } catch (error) {
      // Assume normalizeUserData throws errors with field and message
      errors.push({
        field: error.field || "general",
        message: `Lỗi dữ liệu nhập: ${error.message}`,
      });
      return res.status(400).json({ errors });
    }

    // Role-specific validations
    if (role === 2 || role === 3) {
      // For teachers and mentors, email must end with @fe.edu.vn
      if (!user.email.endsWith("@fe.edu.vn")) {
        errors.push({
          field: "email",
          message: "Email phải có đuôi @fe.edu.vn.",
        });
      }
    }

    if (role === 4) {
      // Validate rollNumber
      if (!user.rollNumber) {
        errors.push({
          field: "rollNumber",
          message: "Mã số sinh viên không được để trống.",
        });
      }

      // Validate memberCode
      if (!user.memberCode) {
        errors.push({
          field: "memberCode",
          message: "Mã thành viên không được để trống.",
        });
      }
    }

    // Check for existing email
    const existingUserByEmail = await adminsDAO.findUserByEmail(user.email);
    if (existingUserByEmail) {
      errors.push({
        field: "email",
        message: "Email đã tồn tại trong hệ thống.",
      });
    }

    if (role === 4) {
      // Check for existing rollNumber
      const existingUserByRollNumber = await adminsDAO.findUserByRollNumber(
        user.rollNumber
      );
      if (existingUserByRollNumber) {
        errors.push({
          field: "rollNumber",
          message: "Mã số sinh viên đã tồn tại trong hệ thống.",
        });
      }

      // Check for existing memberCode
      const existingUserByMemberCode = await adminsDAO.findUserByMemberCode(
        user.memberCode
      );
      if (existingUserByMemberCode) {
        errors.push({
          field: "memberCode",
          message: "Mã thành viên đã tồn tại trong hệ thống.",
        });
      }
    }

    if (role === 2) {
      const checkTeacherExis = await adminsDAO.findTeacherByUsername(
        user.username,
        semesterId
      );
      if (checkTeacherExis) {
        errors.push({
          field: "username",
          message: `Tên giáo viên: ${user.username} đã tồn tại trong hệ thống.`,
        });
      }
    }
    // If any validation errors occurred, return them
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Generate password
    const password = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userStatus = role === 4 ? "Pending" : "Active";
    const newUser = await adminsDAO.createUser({
      ...user,
      password: hashedPassword,
      semesterId: [semesterId],
      status: userStatus,
    });

    // Send email to user
    await sendEmailToUser(newUser.email, password, userStatus);

    // Respond with success
    return res.status(201).json({
      message: "Người dùng đã được thêm thành công.",
      email: newUser.email,
      status: newUser.status,
    });
  } catch (error) {
    next(error); // Pass error to centralized error handler
  }
};

// Hàm tạo mật khẩu ngẫu nhiên
function generateRandomPassword() {
  const length = 8;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let password = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
}

const getAvailableClasses = async (req, res) => {
  const { semesterId } = req.params;
  try {
    const availableClasses = await classDAO.getAvailableClasses(semesterId);
    res.status(200).json({ classes: availableClasses });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách lớp" });
  }
};

const assignStudentToClass = async (req, res) => {
  try {
    const { userId, classId } = req.body;

    const result = await adminsDAO.assignStudentToClass(userId, classId);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
const getPendingUsers = async (req, res) => {
  try {
    const { semesterId } = req.params;
    if (!semesterId) {
      return res.status(400).json({ message: "Semester ID không tồn tại." });
    }

    const pendingUsers = await adminsDAO.findFullClassUsers(semesterId);

    res.status(200).json({ pendingUsers });
  } catch (error) {
    console.error("Error fetching pending users:", error);
    res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách học sinh chưa thêm vào lớp." });
  }
};

export default {
  insertListUsers,
  getAvailableClasses,
  assignStudentToClass,
  getPendingUsers,
  insertUserByHand,
};
