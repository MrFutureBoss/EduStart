import adminsDAO from "../../repositories/adminDAO/index.js";
import bcrypt from "bcrypt";
import xlsx from "xlsx";
import classDAO from "../../repositories/classDAO/index.js";
import nodemailer from "nodemailer";
import semesterDAO from "../../repositories/semesterDAO/index.js";
import { sendEmailToUser } from "../../utilities/email.js";
import notificationDAO from "../../repositories/mentorDAO/notificationDAO/index.js";

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
      normalized.major = row["Chuyên ngành"] ? row["Chuyên ngành"].trim() : "";

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

      // Optional: Kiểm tra nếu chuyên ngành bị thiếu
      if (!normalized.major) {
        throw new Error(
          `Thiếu chuyên ngành cho học sinh: ${normalized.username}`
        );
      }
    } else if (sourceType === "manual") {
      // Dữ liệu nhập tay cho học sinh
      normalized.username = row.username ? row.username.trim() : "Unknown";
      normalized.rollNumber = row.rollNumber ? row.rollNumber.trim() : "";
      normalized.memberCode = row.memberCode ? row.memberCode.trim() : "";
      normalized.major = row.major ? row.major.trim() : "";

      if (!normalized.rollNumber) {
        throw new Error("Vui lòng nhập mã số sinh viên (RollNumber).");
      }

      if (!normalized.memberCode) {
        throw new Error("Vui lòng nhập mã thành viên (MemberCode).");
      }

      if (!normalized.major) {
        throw new Error("Vui lòng nhập chuyên ngành (Major).");
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

const validateExcelStructure = (data, role, rowNumber, errorMessages) => {
  const studentHeaders = [
    "ClassName",
    "SubjectCode",
    "RollNumber",
    "MemberCode",
    "Email",
    "FullName",
    "SlotType",
    "GV chính",
    "Chuyên ngành", // Thêm cột "Chuyên ngành"
  ];
  const teacherHeaders = ["Họ và tên Giáo Viên", "Email", "Số điện thoại"];
  const mentorHeaders = ["Họ và tên Mentor", "Email", "Số điện thoại"];

  let expectedHeaders = [];
  let roleName = "";

  if (role == 4) {
    expectedHeaders = studentHeaders;
    roleName = "học sinh";
  } else if (role == 2) {
    expectedHeaders = teacherHeaders;
    roleName = "giáo viên";
  } else if (role == 3) {
    expectedHeaders = mentorHeaders;
    roleName = "mentor";
  } else {
    throw new Error("Role không hợp lệ.");
  }

  // Get headers from the uploaded file
  const fileHeaders = Object.keys(data[0]).map((header) => header.trim());

  // Normalize expected headers
  const normalizedExpectedHeaders = expectedHeaders.map((header) =>
    header.trim()
  );

  // Sort both arrays to ensure order doesn't affect comparison
  fileHeaders.sort();
  normalizedExpectedHeaders.sort();

  // Check if the headers match exactly
  const headersMatch =
    fileHeaders.length === normalizedExpectedHeaders.length &&
    fileHeaders.every(
      (header, index) => header === normalizedExpectedHeaders[index]
    );

  if (!headersMatch) {
    // If headers do not match, report error and stop processing
    errorMessages.push({
      message: `Định dạng file không đúng cho vai trò ${roleName}. Vui lòng sử dụng mẫu đúng.`,
    });
    throw new Error(
      `Định dạng file không đúng cho vai trò ${roleName}. Vui lòng sử dụng mẫu đúng.`
    );
  }
};

const insertListUsers = async (req, res, next) => {
  try {
    const { semesterId, role, confirmChanges } = req.body;
    const file = req.file;

    // Chuyển đổi role sang số
    const numericRole = parseInt(role, 10);
    if (![2, 3, 4].includes(numericRole)) {
      return res.status(400).json({ error: "Role không hợp lệ." });
    }

    // Kiểm tra thông tin cơ bản của request
    if (!semesterId) {
      return res.status(400).json({ error: "Semester ID không tồn tại." });
    }
    if (!file) {
      return res.status(400).json({ error: "File không tồn tại." });
    }

    // Đọc file Excel
    const workbook = xlsx.read(file.buffer, { type: "buffer" });
    const sheetNameList = workbook.SheetNames;
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]], {
      defval: "",
    });

    // Khai báo các biến để đếm và lưu trữ thông tin
    let totalUsersAdded = 0;
    let totalUsersUpdated = 0;
    const errorMessages = [];
    const duplicateEmails = [];
    const duplicateRollNumbers = [];
    const duplicateMemberCodes = [];
    const usersToInsert = [];
    const usersToEmail = [];
    const existingUserName = [];
    const proposedClassChanges = [];

    // Thêm các Set để theo dõi trùng lặp trong dữ liệu tải lên
    const emailsInUpload = new Set();
    const rollNumbersInUpload = new Set();
    const memberCodesInUpload = new Set();

    // Nhóm dữ liệu theo className (chỉ cho role 4)
    const classUsersMap = {};

    try {
      validateExcelStructure(data, numericRole, 1, errorMessages);

      if (errorMessages.length > 0) {
        throw new Error("Định dạng file không hợp lệ.");
      }
    } catch (validationError) {
      return res
        .status(400)
        .json({ generalError: validationError.message, errorMessages });
    }

    // Nếu đã xác nhận các thay đổi lớp, tiến hành cập nhật
    if (confirmChanges && Array.isArray(confirmChanges)) {
      for (const change of confirmChanges) {
        const {
          userId,
          newClassId,
          teacherUsername,
          newClassName,
          limitStudent,
        } = change;
        try {
          const user = await adminsDAO.findUserById(userId);
          if (user) {
            // Kiểm tra lớp mới có tồn tại và còn chỗ không
            let newClass = await adminsDAO.findClassById(newClassId);
            if (!newClass) {
              // Nếu lớp mới không tồn tại, tạo mới lớp
              if (!teacherUsername || !newClassName) {
                errorMessages.push({
                  userId,
                  message:
                    "Thiếu thông tin teacherUsername hoặc newClassName để tạo lớp mới.",
                });
                continue;
              }

              const teacher = await adminsDAO.findTeacherByUsername(
                teacherUsername,
                semesterId
              );
              if (!teacher) {
                errorMessages.push({
                  userId,
                  message: `Không tìm thấy giáo viên với username: ${teacherUsername} để tạo lớp mới.`,
                });
                continue;
              }

              // Tạo lớp mới
              try {
                newClass = await classDAO.createClass({
                  className: newClassName,
                  semesterId: semesterId,
                  teacherId: teacher._id,
                  limitStudent: limitStudent || 30, // Giá trị mặc định nếu không có
                  status: "Active",
                });

                if (!newClass) {
                  errorMessages.push({
                    userId,
                    message: `Không thể tạo lớp mới với tên: ${newClassName}`,
                  });
                  continue;
                }
              } catch (createClassError) {
                errorMessages.push({
                  userId,
                  message: `Lỗi khi tạo lớp mới: ${createClassError.message}`,
                });
                continue;
              }
            }

            // Đếm số học sinh hiện tại trong lớp mới
            const studentCount = await adminsDAO.countStudentsInClass(
              newClass._id,
              semesterId
            );

            if (studentCount >= newClass.limitStudent) {
              errorMessages.push({
                userId,
                message: `Lớp ${newClass.className} đã đầy.`,
              });
              continue;
            }

            // Chuyển học sinh sang lớp mới
            await adminsDAO.transferStudent(userId, newClass._id);

            totalUsersUpdated += 1;
          }
        } catch (error) {
          errorMessages.push({
            userId,
            message: `Lỗi khi cập nhật lớp cho người dùng ID ${userId}: ${error.message}`,
          });
        }
      }

      return res.status(200).json({
        success: totalUsersUpdated > 0,
        message: `${totalUsersUpdated} người dùng đã được cập nhật lớp mới.`,
        errorMessages,
      });
    }

    // Chuẩn hóa và kiểm tra dữ liệu từ file
    let rowNumber = 1;
    for (const row of data) {
      rowNumber++;
      let user;
      const rowErrors = [];
      try {
        user = normalizeUserData(row, numericRole, "excel");
      } catch (error) {
        rowErrors.push(`Lỗi dữ liệu trong file: ${error.message}`);
        errorMessages.push({
          email: row.Email || "Unknown",
          rowNumber,
          message: `Lỗi dữ liệu trong file: ${error.message}`,
        });
        continue;
      }

      // Kiểm tra trùng lặp trong dữ liệu đang tải lên

      // Kiểm tra email
      if (emailsInUpload.has(user.email)) {
        rowErrors.push(`Email trùng lặp trong file upload: ${user.email}`);
        errorMessages.push({
          email: user.email,
          rowNumber,
          message: `Email trùng lặp trong file upload: ${user.email}`,
        });
        continue;
      } else {
        emailsInUpload.add(user.email);
      }

      // Kiểm tra rollNumber
      if (user.rollNumber) {
        if (rollNumbersInUpload.has(user.rollNumber)) {
          rowErrors.push(
            `Mã số sinh viên trùng lặp trong file upload: ${user.rollNumber}`
          );
          errorMessages.push({
            email: user.email,
            rowNumber,
            message: `Mã số sinh viên trùng lặp trong file upload: ${user.rollNumber}`,
          });
          continue;
        } else {
          rollNumbersInUpload.add(user.rollNumber);
        }
      }

      // Kiểm tra memberCode
      if (user.memberCode) {
        if (memberCodesInUpload.has(user.memberCode)) {
          rowErrors.push(
            `Mã thành viên trùng lặp trong file upload: ${user.memberCode}`
          );
          errorMessages.push({
            email: user.email,
            rowNumber,
            message: `Mã thành viên trùng lặp trong file upload: ${user.memberCode}`,
          });
          continue;
        } else {
          memberCodesInUpload.add(user.memberCode);
        }
      }

      // Kiểm tra email hợp lệ cho role giáo viên (role 2) và mentor (role 3)
      if (
        (numericRole === 2 || numericRole === 3) &&
        !user.email.endsWith("@fe.edu.vn") &&
        !user.email.endsWith("@gmail.com")
      ) {
        rowErrors.push(`Email phải có đuôi @fe.edu.vn hoặc @gmail.com`);
        errorMessages.push({
          email: user.email,
          rowNumber,
          message: `Email phải có đuôi @fe.edu.vn hoặc @gmail.com`,
        });
        continue;
      }

      // Kiểm tra xem email đã tồn tại trong cơ sở dữ liệu chưa
      const existingUser = await adminsDAO.findUserByEmail(user.email);
      if (existingUser) {
        // Người dùng đã tồn tại
        // Kiểm tra xem người dùng đã tham gia vào kỳ học hiện tại chưa
        const isInCurrentSemester = existingUser.semesterId
          .map((id) => id.toString())
          .includes(semesterId);

        if (isInCurrentSemester) {
          if (numericRole === 4) {
            // Xử lý thay đổi lớp cho sinh viên (role 4)

            // Kiểm tra lớp hiện tại của người dùng
            const currentClassId = existingUser.classId
              ? existingUser.classId.toString()
              : null;
            const newClassName = user.className;

            // Tìm lớp mới dựa trên className và semesterId
            let newClass = await adminsDAO.findClassByNameAndSemester(
              newClassName,
              semesterId
            );

            if (!newClass) {
              // Nếu lớp mới không tồn tại, tạo mới lớp
              const teacherUsername = user.teacherUsername;
              if (!teacherUsername || !newClassName) {
                rowErrors.push(
                  `Thiếu teacherUsername hoặc newClassName để tạo lớp mới: ${newClassName}`
                );
                errorMessages.push({
                  email: user.email,
                  rowNumber,
                  message: `Thiếu teacherUsername hoặc newClassName để tạo lớp mới: ${newClassName}`,
                });
                continue;
              }

              const teacher = await adminsDAO.findTeacherByUsername(
                teacherUsername,
                semesterId
              );
              if (!teacher) {
                rowErrors.push(
                  `Không tìm thấy giáo viên với username: ${teacherUsername} để tạo lớp mới: ${newClassName}`
                );
                errorMessages.push({
                  email: user.email,
                  rowNumber,
                  message: `Không tìm thấy giáo viên với username: ${teacherUsername} để tạo lớp mới: ${newClassName}`,
                });
                continue;
              }

              // Tạo lớp mới
              try {
                newClass = await classDAO.createClass({
                  className: newClassName,
                  semesterId: semesterId,
                  teacherId: teacher._id,
                  limitStudent: user.limitStudent || 30, // Giá trị mặc định nếu không có
                  status: "Active",
                });

                if (!newClass) {
                  rowErrors.push(
                    `Không thể tạo lớp mới với tên: ${newClassName}`
                  );
                  errorMessages.push({
                    email: user.email,
                    rowNumber,
                    message: `Không thể tạo lớp mới với tên: ${newClassName}`,
                  });
                  continue;
                }
              } catch (createClassError) {
                rowErrors.push(
                  `Lỗi khi tạo lớp mới: ${createClassError.message}`
                );
                errorMessages.push({
                  email: user.email,
                  rowNumber,
                  message: `Lỗi khi tạo lớp mới: ${createClassError.message}`,
                });
                continue;
              }
            }

            const newClassId = newClass._id.toString();

            if (currentClassId && currentClassId !== newClassId) {
              // Lấy thông tin lớp hiện tại để lấy tên lớp
              const currentClass = await adminsDAO.findClassById(
                currentClassId
              );
              const oldClassName = currentClass
                ? currentClass.className
                : "Unknown";

              // Thêm vào danh sách thay đổi lớp đề xuất
              proposedClassChanges.push({
                userId: existingUser._id,
                email: existingUser.email,
                oldClassId: currentClassId,
                newClassId: newClassId,
                oldClassName: oldClassName,
                newClassName: newClassName,
                rollNumber: existingUser.rollNumber,
                fullName: existingUser.fullName, // Sửa từ existingUser.username thành existingUser.fullName
                rowNumber,
              });
              // Chuyển sang bản ghi tiếp theo
              continue;
            } else {
              // Nếu lớp không thay đổi, không làm gì thêm
              continue;
            }
          } else {
            // Đối với role 2 và 3, không cần xử lý thay đổi lớp
            // Chỉ cần thêm semesterId nếu người dùng chưa có trong kỳ học này
            totalUsersUpdated += 1;
            continue;
          }
        } else {
          // Người dùng tồn tại nhưng không trong kỳ học hiện tại
          if (numericRole === 4) {
            // Xử lý thêm semesterId và classId cho sinh viên (role 4)

            // Thêm semesterId mới cho người dùng
            await adminsDAO.addSemesterToUser(existingUser._id, semesterId);

            // Nếu người dùng chưa có lớp, thêm họ vào lớp mới nếu có
            if (!existingUser.classId) {
              if (user.className) {
                let newClass = await adminsDAO.findClassByNameAndSemester(
                  user.className,
                  semesterId
                );

                if (!newClass) {
                  // Nếu lớp mới không tồn tại, tạo mới lớp
                  const teacherUsername = user.teacherUsername;
                  if (!teacherUsername) {
                    rowErrors.push(
                      `Thiếu teacherUsername để tạo lớp mới: ${user.className}`
                    );
                    errorMessages.push({
                      email: user.email,
                      rowNumber,
                      message: `Thiếu teacherUsername để tạo lớp mới: ${user.className}`,
                    });
                    continue;
                  }

                  const teacher = await adminsDAO.findTeacherByUsername(
                    teacherUsername,
                    semesterId
                  );
                  if (!teacher) {
                    rowErrors.push(
                      `Không tìm thấy giáo viên với username: ${teacherUsername} để tạo lớp mới: ${user.className}`
                    );
                    errorMessages.push({
                      email: user.email,
                      rowNumber,
                      message: `Không tìm thấy giáo viên với username: ${teacherUsername} để tạo lớp mới: ${user.className}`,
                    });
                    continue;
                  }

                  // Tạo lớp mới
                  try {
                    newClass = await classDAO.createClass({
                      className: user.className,
                      semesterId: semesterId,
                      teacherId: teacher._id,
                      limitStudent: user.limitStudent || 30, // Giá trị mặc định nếu không có
                      status: "Active",
                    });

                    if (!newClass) {
                      rowErrors.push(
                        `Không thể tạo lớp mới với tên: ${user.className}`
                      );
                      errorMessages.push({
                        email: user.email,
                        rowNumber,
                        message: `Không thể tạo lớp mới với tên: ${user.className}`,
                      });
                      continue;
                    }
                  } catch (createClassError) {
                    rowErrors.push(
                      `Lỗi khi tạo lớp mới: ${createClassError.message}`
                    );
                    errorMessages.push({
                      email: user.email,
                      rowNumber,
                      message: `Lỗi khi tạo lớp mới: ${createClassError.message}`,
                    });
                    continue;
                  }
                }

                const newClassId = newClass._id.toString();

                const studentCount = await adminsDAO.countStudentsInClass(
                  newClassId,
                  semesterId
                );

                if (studentCount < newClass.limitStudent) {
                  await adminsDAO.transferStudent(
                    existingUser._id,
                    newClass._id
                  );
                  totalUsersUpdated += 1;
                } else {
                  // Lớp đã đầy, thêm vào danh sách Pending
                  errorMessages.push({
                    email: user.email,
                    rowNumber: rowNumber,
                    message: `Lớp ${newClass.className} đã đầy. Học sinh được thêm với trạng thái "Chờ xếp lớp".`,
                  });
                }
              } else {
                // Nếu không có className, thêm vào danh sách Pending
                rowErrors.push(`Thiếu tên lớp cho người dùng không có lớp.`);
                errorMessages.push({
                  email: user.email,
                  rowNumber: rowNumber,
                  message: `Thiếu tên lớp cho người dùng không có lớp.`,
                });
                continue;
              }
            }

            totalUsersUpdated += 1;
            continue;
          } else {
            // Đối với role 2 và 3, chỉ cần thêm semesterId
            await adminsDAO.addSemesterToUser(existingUser._id, semesterId);
            totalUsersUpdated += 1;
            continue;
          }
        }
      } else {
        // Người dùng chưa tồn tại trong hệ thống

        if (numericRole === 4) {
          // Kiểm tra sự trùng lặp của rollNumber và memberCode trong cơ sở dữ liệu

          // Kiểm tra rollNumber
          if (user.rollNumber) {
            const existingUserByRollNumber =
              await adminsDAO.findUserByRollNumber(user.rollNumber);
            if (existingUserByRollNumber) {
              duplicateRollNumbers.push(user.rollNumber);
              rowErrors.push(
                `Mã số sinh viên đã tồn tại trong hệ thống: ${user.rollNumber}`
              );
              errorMessages.push({
                email: user.email,
                rowNumber,
                message: `Mã số sinh viên đã tồn tại trong hệ thống: ${user.rollNumber}`,
              });
              continue;
            }
          }

          // Kiểm tra memberCode
          if (user.memberCode) {
            const existingUserByMemberCode =
              await adminsDAO.findUserByMemberCode(user.memberCode);
            if (existingUserByMemberCode) {
              duplicateMemberCodes.push(user.memberCode);
              rowErrors.push(
                `Mã thành viên đã tồn tại trong hệ thống: ${user.memberCode}`
              );
              errorMessages.push({
                email: user.email,
                rowNumber,
                message: `Mã thành viên đã tồn tại trong hệ thống: ${user.memberCode}`,
              });
              continue;
            }
          }

          if (rowErrors.length > 0) {
            continue;
          }

          // Nhóm học sinh theo className
          if (!user.className) {
            rowErrors.push(`Thiếu tên lớp cho học sinh.`);
            errorMessages.push({
              email: user.email,
              rowNumber,
              message: `Thiếu tên lớp cho học sinh.`,
            });
            continue;
          }

          if (!classUsersMap[user.className]) {
            classUsersMap[user.className] = [];
          }
          classUsersMap[user.className].push({ user, rowNumber });
        } else if (numericRole === 3) {
          // Xử lý các role khác (mentor, role 3)
          const password = generateRandomPassword();
          const hashedPassword = await bcrypt.hash(password, 12);

          const userData = {
            ...user,
            password: hashedPassword,
            semesterId: [semesterId],
            status: "Active",
          };

          usersToInsert.push(userData);
          usersToEmail.push({
            email: user.email,
            password,
            status: "Active",
          });
          totalUsersAdded += 1;
        } else if (numericRole === 2) {
          // Xử lý role giáo viên (role 2)
          const checkTeacherExist = await adminsDAO.findTeacherByUsername(
            user.username,
            semesterId
          );
          if (checkTeacherExist) {
            existingUserName.push(user.username);
            rowErrors.push(
              `Tên giáo viên ${user.username} đã tồn tại trong hệ thống.`
            );
            errorMessages.push({
              email: user.email,
              rowNumber,
              message: `Tên giáo viên ${user.username} đã tồn tại trong hệ thống.`,
            });
            continue;
          }
          const password = generateRandomPassword();
          const hashedPassword = await bcrypt.hash(password, 12);

          const userData = {
            ...user,
            password: hashedPassword,
            semesterId: [semesterId],
            status: "Active",
          };

          usersToInsert.push(userData);
          usersToEmail.push({
            email: user.email,
            password,
            status: "Active",
          });
          totalUsersAdded += 1;
        } else {
          rowErrors.push(`Role không hợp lệ.`);
          errorMessages.push({
            email: user.email,
            rowNumber,
            message: `Role không hợp lệ.`,
          });
          continue;
        }
      }
    }

    // Xử lý các lớp học (role == 4)
    if (numericRole === 4) {
      for (const [className, userEntries] of Object.entries(classUsersMap)) {
        if (userEntries.length === 0) continue;

        // Tất cả các học sinh trong cùng một lớp có cùng teacherUsername
        const teacherUsername = userEntries[0].user.teacherUsername;
        if (!teacherUsername) {
          errorMessages.push({
            email: userEntries[0].user.email,
            rowNumber: userEntries[0].rowNumber,
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
          if (!teacher) {
            throw new Error(
              `Không tìm thấy giáo viên với username: ${teacherUsername}`
            );
          }
        } catch (error) {
          errorMessages.push({
            email: userEntries[0].user.email,
            rowNumber: userEntries[0].rowNumber,
            message: `Không thể tìm giáo viên cho lớp ${className}: ${error.message}`,
          });
          continue;
        }

        // Tìm hoặc tạo lớp học với semesterId và teacherId
        let classData, studentCount;
        try {
          ({ classData, studentCount } = await adminsDAO.findOrCreateClass(
            className,
            semesterId,
            teacher._id
          ));

          // Kết nối socket và tạo thông báo cho giáo viên
          const recipients = [teacher._id];
          const notificationMessage = `Bạn đã được phân công lớp ${className}`;
          await notificationDAO.createNotifications({
            message: notificationMessage,
            type: "classAssignment",
            recipients,
            audience: "Teacher",
            io: req.io,
          });
        } catch (error) {
          errorMessages.push({
            message: `Lỗi khi tìm hoặc tạo lớp ${className}: ${error.message}`,
          });
          continue;
        }

        const remainingSlots = classData.limitStudent - studentCount;

        if (remainingSlots <= 0) {
          // Lớp đã đầy, thêm học sinh vào danh sách với trạng thái Pending
          for (const entry of userEntries) {
            const { user, rowNumber } = entry;
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
            usersToEmail.push({
              email: user.email,
              password,
              status: "Pending",
            });

            errorMessages.push({
              email: user.email,
              rowNumber,
              message: `Lớp ${className} đã đầy. Học sinh được thêm với trạng thái "Chờ xếp lớp".`,
            });
          }
          continue;
        }

        // Số học sinh có thể thêm vào lớp
        const usersCanAdd = userEntries.slice(0, remainingSlots);
        const usersCannotAdd = userEntries.slice(remainingSlots);

        // Thêm học sinh có thể thêm vào lớp
        for (const entry of usersCanAdd) {
          const { user } = entry;
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

        // Thêm học sinh không thể thêm vào lớp vào danh sách Pending
        for (const entry of usersCannotAdd) {
          const { user, rowNumber } = entry;
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

          errorMessages.push({
            email: user.email,
            rowNumber,
            message: `Lớp ${className} đã đầy. Học sinh được thêm với trạng thái "Chờ xếp lớp".`,
          });
        }
      }
    }

    // Thực hiện insert danh sách người dùng
    let insertedUsers = [];

    if (usersToInsert.length > 0) {
      try {
        insertedUsers = await adminsDAO.createListUsers(usersToInsert);
      } catch (insertError) {
        console.error(
          "Lỗi khi thêm người dùng vào cơ sở dữ liệu:",
          insertError
        );
        errorMessages.push({
          message: "Lỗi khi thêm người dùng vào cơ sở dữ liệu.",
          details: insertError.message,
        });
      }
    }

    // Cập nhật _id trong usersToInsert với các đối tượng trả về từ cơ sở dữ liệu
    usersToInsert.forEach((user, index) => {
      if (insertedUsers[index]) {
        user._id = insertedUsers[index]._id;
      }
    });

    // Kết nối socket và tạo thông báo cho người dùng mới
    const recipients = usersToInsert.map((member) => member._id);
    const notificationMessage = `Bạn đã được xếp vào lớp. Chúc bạn học tập thật tốt!`;
    await notificationDAO.createNotifications({
      message: notificationMessage,
      type: "classAssignment",
      filters: { classId: usersToInsert[0]?.classId },
      recipients,
      io: req.io,
    });

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
    let success = successCount > 0 && proposedClassChanges.length === 0;

    // Trả về phản hồi, bao gồm cả proposedClassChanges
    res.status(200).json({
      success,
      message: "Đã xử lý xong tất cả người dùng.",
      successCount,
      duplicateEmails,
      duplicateRollNumbers,
      duplicateMemberCodes,
      errorMessages,
      usersToInsert,
      proposedClassChanges, // Bao gồm các thay đổi lớp đề xuất
    });
  } catch (error) {
    console.error("Lỗi trong insertListUsers:", error);
    next(error);
  }
};

// Hàm thêm người dùng bằng tay
const insertUserByHand = async (req, res, next) => {
  try {
    const { semesterId, role, userInput } = req.body;
    const errors = [];

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
    // newUser sẽ bao gồm _id, email, và các trường khác
    const userId = newUser._id; // Lấy _id của người dùng vừa được tạo
    // Send email to user
    await sendEmailToUser(newUser.email, password, userStatus);

    // Respond with success
    return res.status(201).json({
      message: "Người dùng đã được thêm thành công.",
      email: newUser.email,
      status: newUser.status,
      userId: newUser._id,
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

const createClass = async (req, res) => {
  try {
    const { className, limitStudent, teacherId, semesterId } = req.body;
    const classExits = await classDAO.isClassNameExist(className, semesterId);
    if (classExits) {
      return res.status(400).json({
        field: "className", // Chỉ rõ trường gặp lỗi
        message: `Tên lớp: ${className} đã tồn tại trong hệ thống.`,
      });
    }
    const savedClass = await classDAO.createClass({
      className,
      limitStudent,
      teacherId,
      semesterId,
      status: "Active",
      req,
    });
    res.status(201).json(savedClass);
  } catch (error) {
    console.error("Error in createClass:", error);
    res
      .status(500)
      .json({ message: "An error occurred while creating the class" });
  }
};

const fetchFullClasses = async (req, res) => {
  const { semesterId } = req.params;

  try {
    if (!semesterId) {
      return res.status(400).json({ message: "semesterId is required." });
    }

    const fullClasses = await classDAO.getFullClasses(semesterId);

    res.status(200).json({ classes: fullClasses });
  } catch (error) {
    console.error("Error in fetchFullClasses:", error);
    res.status(500).json({ message: error.message });
  }
};

const fetchTeachers = async (req, res) => {
  const { semesterId } = req.params;

  // Check if semesterId is provided
  if (!semesterId) {
    return res.status(400).json({
      message: "semesterId is required.",
    });
  }

  try {
    const teachers = await classDAO.getTeachersWithClassCount(semesterId);

    return res.status(200).json({ teachers });
  } catch (error) {
    console.error("Error in fetchTeachers:", error);
    return res.status(500).json({ message: "Error fetching teachers." });
  }
};

const transferStudentController = async (req, res) => {
  try {
    const { studentId, toClassId } = req.body;
    const result = await adminsDAO.transferStudent(studentId, toClassId);
    res
      .status(200)
      .json({ message: "Chuyển học sinh thành công", data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const swapStudentsController = async (req, res) => {
  try {
    const { studentId1, studentId2 } = req.body;

    const result = await adminsDAO.swapStudents(studentId1, studentId2);
    res
      .status(200)
      .json({ message: "Hoán đổi học sinh thành công", data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const applyClassChanges = async (req, res, next) => {
  try {
    const { classChanges, semesterId } = req.body; // Nhận danh sách thay đổi lớp và semesterId

    if (!Array.isArray(classChanges) || classChanges.length === 0) {
      return res
        .status(400)
        .json({ error: "Không có thay đổi lớp nào để áp dụng." });
    }

    const errorMessages = [];
    let changesApplied = 0;

    for (const change of classChanges) {
      const { userId, newClassId, oldClassId } = change;
      try {
        // Kiểm tra xem lớp mới có tồn tại và còn chỗ không
        const newClass = await adminsDAO.findClassById(newClassId);
        if (!newClass) {
          errorMessages.push({
            userId,
            message: `Không tìm thấy lớp mới với ID: ${newClassId}`,
          });
          continue;
        }

        // Đếm số học sinh hiện tại trong lớp mới
        const studentCount = await adminsDAO.countStudentsInClass(
          newClassId,
          semesterId
        );

        if (studentCount >= newClass.limitStudent) {
          errorMessages.push({
            userId,
            message: `Lớp ${newClass.className} đã đầy.`,
          });
          continue;
        }

        // Cập nhật classId cho người dùng
        await adminsDAO.transferStudent(userId, newClassId);

        // Nếu có class cũ, cập nhật số lượng học sinh trong lớp cũ (giảm đi 1)
        if (oldClassId) {
          // Nếu bạn muốn giữ số lượng học sinh trong Class model, bạn có thể cập nhật ở đây
          // Ví dụ:
          // await adminsDAO.decrementStudentCount(oldClassId);
        }

        changesApplied += 1;
      } catch (error) {
        errorMessages.push({
          userId,
          message: `Lỗi khi cập nhật lớp cho người dùng ID ${userId}: ${error.message}`,
        });
      }
    }

    res.status(200).json({
      success: changesApplied > 0,
      message: `${changesApplied} thay đổi lớp đã được áp dụng.`,
      errorMessages,
    });
  } catch (error) {
    next(error);
  }
};

export { insertListUsers, applyClassChanges };

export default {
  insertListUsers,
  getAvailableClasses,
  assignStudentToClass,
  getPendingUsers,
  insertUserByHand,
  createClass,
  fetchTeachers,
  fetchFullClasses,
  transferStudentController,
  swapStudentsController,
  applyClassChanges,
};
