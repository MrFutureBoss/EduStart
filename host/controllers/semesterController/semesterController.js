import moment from "moment";
import semesterDAO from "../../repositories/semesterDAO/index.js";
import classDAO from "../../repositories/classDAO/index.js";

const createSemester = async (req, res) => {
  try {
    const { name, startDate, endDate } = req.body;

    // Kiểm tra định dạng tên kỳ học
    const nameFormat = /^(SP|SU|FA)\d{2}$/;
    if (!nameFormat.test(name)) {
      return res.status(400).json({
        message: "Có lỗi xảy ra.",
        fields: {
          name: "Tên kỳ học không đúng định dạng! Vui lòng sử dụng định dạng: SPxx, SUxx, FAxx.",
        },
      });
    }

    // Kiểm tra xem tên kỳ học đã tồn tại hay chưa
    const existingSemester = await semesterDAO.getSemesterByName(name);
    if (existingSemester) {
      return res.status(400).json({
        message: "Có lỗi xảy ra.",
        fields: {
          name: "Tên kỳ học đã tồn tại!",
        },
      });
    }

    const start = moment(startDate).startOf("day");
    const end = moment(endDate).startOf("day");

    // Kiểm tra ngày bắt đầu và kết thúc có hợp lệ hay không
    if (!start.isValid() || !end.isValid()) {
      return res.status(400).json({
        message: "Có lỗi xảy ra.",
        fields: {
          startDate: "Ngày bắt đầu không hợp lệ!",
          endDate: "Ngày kết thúc không hợp lệ!",
        },
      });
    }

    // Kiểm tra thời gian trùng
    const overlappingSemesters = await semesterDAO.getOverlappingSemester(
      start.toDate(),
      end.toDate()
    );
    if (overlappingSemesters.length > 0) {
      return res.status(400).json({
        message: "Có lỗi xảy ra.",
        fields: {
          startDate: "Kỳ học mới bị trùng với một kỳ học đã có!",
        },
      });
    }

    // Tạo kỳ học mới
    const newSemester = await semesterDAO.createSemester({
      name,
      startDate: start.toDate(),
      endDate: end.toDate(),
      status: "Upcoming",
    });

    return res.status(201).json(newSemester);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi khi tạo kỳ học mới.", error });
  }
};
const updateSemester = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { name, startDate, endDate, status } = req.body;

    const nameFormat = /^(SP|SU|FA)\d{2}$/;
    if (!nameFormat.test(name)) {
      return res.status(400).json({
        message:
          "Tên kỳ học không đúng định dạng! Vui lòng sử dụng định dạng: SPxx, SUxx, FAxx.",
      });
    }

    const existingSemester = await semesterDAO.getSemesterByName(name);
    if (existingSemester && existingSemester._id.toString() !== semesterId) {
      return res.status(400).json({
        message: "Có lỗi xảy ra.",
        fields: {
          name: "Tên kỳ học đã tồn tại!",
        },
      });
    }

    const start = moment(startDate).startOf("day");
    const end = moment(endDate).startOf("day");

    if (!start.isValid() || !end.isValid()) {
      return res
        .status(400)
        .json({ message: "Ngày bắt đầu hoặc ngày kết thúc không hợp lệ!" });
    }

    if (start.isSame(end)) {
      return res.status(400).json({
        message: "Ngày bắt đầu và ngày kết thúc không thể trùng nhau!",
      });
    }

    if (start.isAfter(end)) {
      return res
        .status(400)
        .json({ message: "Ngày bắt đầu không thể sau ngày kết thúc!" });
    }

    const durationInMonths = end.diff(start, "months", true);
    if (durationInMonths < 2) {
      return res
        .status(400)
        .json({ message: "Kỳ học phải kéo dài ít nhất 3 tháng!" });
    }
    if (durationInMonths > 4) {
      return res
        .status(400)
        .json({ message: "Kỳ học không thể kéo dài hơn 4 tháng!" });
    }

    const overlappingSemesters = await semesterDAO.getOverlappingSemester(
      start.toDate(),
      end.toDate()
    );
    const hasOverlap = overlappingSemesters.some(
      (semester) => semester._id.toString() !== semesterId
    );
    if (hasOverlap) {
      return res.status(400).json({
        message: "Có lỗi xảy ra.",
        fields: {
          startDate: "Kỳ học mới bị trùng với một kỳ học đã có!",
        },
      });
    }

    if (status === "Ongoing") {
      const ongoingSemester = await semesterDAO.getSemesterByStatus("Ongoing");
      if (ongoingSemester && ongoingSemester._id.toString() !== semesterId) {
        return res.status(400).json({
          message: "Chỉ có thể có một kỳ học đang diễn ra tại một thời điểm!",
        });
      }
    }

    const updatedSemester = await semesterDAO.updateSemester(semesterId, {
      name,
      startDate: start.toDate(),
      endDate: end.toDate(),
      status,
    });

    if (!updatedSemester) {
      return res.status(404).json({ message: "Kỳ học không tồn tại!" });
    }
    if (status === "Upcoming") {
      // Set all users and classes in this semester to "Inactive"
      await semesterDAO.updateUserStatusBySemesterId(semesterId, "InActive");
      await semesterDAO.updateClassStatusBySemesterId(semesterId, "InActive");
    } else if (status === "Ongoing") {
      // Set all users and classes in this semester to "Active"
      await semesterDAO.updateUserStatusBySemesterId(semesterId, "Active");
      await semesterDAO.updateClassStatusBySemesterId(semesterId, "Active");
    } else if (status === "Finished") {
      // Set all users and classes in this semester to "Inactive" or "Completed"
      await semesterDAO.updateUserStatusBySemesterId(semesterId, "InActive");
      await semesterDAO.updateClassStatusBySemesterId(semesterId, "Completed");
    } else {
      return res.status(400).json({ message: "Trạng thái không hợp lệ!" });
    }

    return res.status(200).json(updatedSemester);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi khi chỉnh sửa kỳ học.", error });
  }
};

const autoUpdateSemesterStatus = async () => {
  try {
    const currentDate = moment().startOf("day");
    const semesters = await semesterDAO.getAllSemesters();

    for (const semester of semesters) {
      const semesterStartDate = moment(semester.startDate).startOf("day");
      const semesterEndDate = moment(semester.endDate).startOf("day");

      if (
        currentDate.isBefore(semesterStartDate) &&
        semester.status !== "Upcoming"
      ) {
        await semesterDAO.updateSemesterStatus(semester._id, "Upcoming");
        await semesterDAO.updateUserStatusBySemesterId(
          semester._id,
          "InActive"
        );
        await semesterDAO.updateClassStatusBySemesterId(
          semester._id,
          "InActive"
        );
      }

      if (
        currentDate.isSameOrAfter(semesterStartDate) &&
        currentDate.isSameOrBefore(semesterEndDate) &&
        semester.status !== "Ongoing"
      ) {
        await semesterDAO.updateSemesterStatus(semester._id, "Ongoing");
        await semesterDAO.updateUserStatusBySemesterId(semester._id, "Active");
        await semesterDAO.updateClassStatusBySemesterId(semester._id, "Active");
      }

      if (
        currentDate.isAfter(semesterEndDate) &&
        semester.status !== "Finished"
      ) {
        await semesterDAO.updateSemesterStatus(semester._id, "Finished");
        await semesterDAO.updateUserStatusBySemesterId(
          semester._id,
          "InActive"
        );
        await semesterDAO.updateClassStatusBySemesterId(
          semester._id,
          "Completed"
        );
      }
    }
  } catch (error) {
    console.error("Lỗi khi tự động cập nhật trạng thái kỳ học:", error);
  }
};

const getAllSemesters = async (req, res) => {
  try {
    const semesters = await semesterDAO.getAllSemesters();

    return res.status(200).json(semesters);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi khi lấy danh sách kỳ học.", error });
  }
};

const getUsersBySemester = async (req, res) => {
  try {
    const { semesterId } = req.params;

    // Lấy danh sách người dùng với thông tin bổ sung
    const users = await semesterDAO.getUsersBySemesterId(semesterId);

    // Trả về danh sách người dùng
    res.status(200).json(users);
  } catch (error) {
    console.error("Error in getUsersBySemester:", error);
    res.status(500).json({ message: error.message });
  }
};

const getCurrentSemesterController = async (req, res) => {
  try {
    // Fetch the current semester
    const semester = await semesterDAO.getCurrentSemester();

    if (!semester) {
      return res.status(404).json({ message: "Không có kỳ học đang diễn ra." });
    }

    // Fetch counts for users and classes
    const {
      studentCount,
      teacherCount,
      mentorCount,
      classCount,
      studentsWithClass,
      studentsWithoutClass,
      teachersWithClassCount,
      teachersWithoutClassCount,
      classesWithStudentsCount,
      classesWithoutStudentsCount,
      classesWithStudentsList,
      classesWithoutStudentsList,
      teachersWithClasses,
      teachersWithoutClasses,
      mentorsWithMatch,
      mentorsWithoutMatch,
    } = await semesterDAO.getCountsForSemester(semester._id);

    // Respond with semester data and counts
    res.status(200).json({
      ...semester.toObject(),
      studentCount,
      teacherCount,
      mentorCount,
      classCount,
      studentsWithClass,
      studentsWithoutClass,
      teachersWithClassCount,
      teachersWithoutClassCount,
      classesWithStudentsCount,
      classesWithoutStudentsCount,
      details: {
        classesWithStudentsList,
        classesWithoutStudentsList,
        teachersWithClasses,
        teachersWithoutClasses,
        mentorsWithMatch,
        mentorsWithoutMatch,
      },
    });
  } catch (error) {
    console.error("Error in getCurrentSemester:", error);
    res.status(500).json({ message: error.message });
  }
};

const getSemesterDetail = async (req, res) => {
  const { semesterId } = req.params; // Lấy semesterId từ body

  try {
    // Kiểm tra nếu không có semesterId
    if (!semesterId) {
      return res.status(400).json({ message: "Vui lòng cung cấp semesterId." });
    }

    // Lấy thông tin kỳ học từ cơ sở dữ liệu
    const semester = await semesterDAO.getSemesterById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: "Kỳ học không tồn tại." });
    }

    // Fetch counts for users and classes
    const {
      studentCount,
      teacherCount,
      mentorCount,
      classCount,
      studentsWithClass,
      studentsWithoutClass,
      teachersWithClassCount,
      teachersWithoutClassCount,
      classesWithStudentsCount,
      classesWithoutStudentsCount,
      classesWithStudentsList,
      classesWithoutStudentsList,
      teachersWithClasses,
      teachersWithoutClasses,
      mentorsWithMatch,
      mentorsWithoutMatch,
    } = await semesterDAO.getCountsForSemester(semester._id);

    // Respond with semester data and counts
    res.status(200).json({
      ...semester.toObject(),
      studentCount,
      teacherCount,
      mentorCount,
      classCount,
      studentsWithClass,
      studentsWithoutClass,
      teachersWithClassCount,
      teachersWithoutClassCount,
      classesWithStudentsCount,
      classesWithoutStudentsCount,
      details: {
        classesWithStudentsList,
        classesWithoutStudentsList,
        teachersWithClasses,
        teachersWithoutClasses,
        mentorsWithMatch,
        mentorsWithoutMatch,
      },
    });
  } catch (error) {
    console.error("Error in getSemesterDetail:", error);
    res.status(500).json({ message: error.message });
  }
};

const checkSemesterStatus = async (req, res) => {
  let { semesterId } = req.params;

  try {
    // Kiểm tra kỳ học hiện tại
    const currentSemester = await semesterDAO.getSemesterById(semesterId);

    if (currentSemester) {
      return res.status(200).json({
        message: "Có kỳ học hiện tại",
        semester: currentSemester,
        status: "Ongoing",
      });
    }

    // Kiểm tra kỳ học sắp tới trong vòng 15 ngày
    const upcomingSemester = await semesterDAO.findUpcomingSemesterWithinDays(
      15
    );

    if (upcomingSemester) {
      return res.status(200).json({
        message: "Có kỳ học sắp tới trong vòng 15 ngày",
        semester: upcomingSemester,
        status: "Upcoming",
      });
    }

    // Nếu không có kỳ học nào hiện tại hoặc trong vòng 15 ngày tới
    return res.status(200).json({
      message:
        "Không có kỳ học nào hiện tại hoặc trong vòng 15 ngày tới. Cần tạo kỳ học mới.",
      status: "No upcoming semester",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

const checkTeachersInSemester = async (req, res) => {
  try {
    // Lấy semesterId từ request, nếu không có thì lấy kỳ học hiện tại
    let { semesterId } = req.params;

    // Kiểm tra giáo viên trong kỳ học
    const teachers = await semesterDAO.findTeachersInSemester(semesterId);

    if (teachers.length > 0) {
      return res.status(200).json({
        message: `Đã có ${teachers.length} giáo viên trong kỳ học.`,
        status: "Teachers found",
        teachers,
      });
    } else {
      return res.status(200).json({
        message: "Chưa có giáo viên nào trong kỳ học.",
        status: "No teachers found",
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

const checkMentorsInSemester = async (req, res) => {
  try {
    // Lấy semesterId từ request, nếu không có thì lấy kỳ học hiện tại
    let { semesterId } = req.params;

    // Kiểm tra giáo viên trong kỳ học
    const mentors = await semesterDAO.findMentorsInSemester(semesterId);

    if (mentors.length > 0) {
      return res.status(200).json({
        message: `Đã có ${mentors.length} mentor trong kỳ học.`,
        status: "Mentors found",
        mentors,
      });
    } else {
      return res.status(200).json({
        message: "Chưa có mentor nào trong kỳ học.",
        status: "No mentors found",
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

const checkStudentsInSemester = async (req, res) => {
  try {
    // Lấy semesterId từ request, nếu không có thì lấy kỳ học hiện tại
    let { semesterId } = req.params;

    // Kiểm tra giáo viên trong kỳ học
    const students = await semesterDAO.findStudentsInSemester(semesterId);

    if (students.length > 0) {
      return res.status(200).json({
        message: `Đã có ${students.length} sinh viên trong kỳ học.`,
        status: "Student found",
        students,
      });
    } else {
      return res.status(200).json({
        message: "Chưa có sinh viên nào trong kỳ học.",
        status: "No students found",
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

const checkStudentsInSemesterStatus = async (req, res) => {
  try {
    // Lấy semesterId từ request, nếu không có thì lấy kỳ học hiện tại
    let { semesterId } = req.params;

    // Kiểm tra giáo viên trong kỳ học
    const pendingStudents = await semesterDAO.findStudentsInSemesterStatus(
      semesterId
    );

    if (pendingStudents.length > 0) {
      return res.status(200).json({
        message: `Có ${pendingStudents.length} học sinh trong trạng thái Pending.`,
        status: "Pending students found",
        students: pendingStudents,
      });
    } else {
      return res.status(200).json({
        message: "Không có học sinh nào trong trạng thái Pending.",
        status: "No pending students",
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

const checkClassCapacity = async (req, res) => {
  let { semesterId } = req.params;

  try {
    const classesStatus = await semesterDAO.getClassCapacityStatus(semesterId);
    res.status(200).json({
      message: "Kiểm tra tình trạng các lớp học thành công.",
      data: classesStatus,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Có lỗi xảy ra khi kiểm tra tình trạng các lớp học.",
      error: error.message,
    });
  }
};

const getTeachersWithoutClass = async (req, res) => {
  let { semesterId } = req.params;
  try {
    const teachersWithoutClass = await semesterDAO.findTeachersWithoutClass(
      semesterId
    );
    res.status(200).json({
      message: "Danh sách giáo viên chưa có lớp học.",
      data: teachersWithoutClass,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Có lỗi xảy ra khi lấy danh sách giáo viên chưa có lớp.",
      error: error.message,
    });
  }
};

const checkProfessionAndSpeciatyExit = async (req, res) => {
  try {
    const checkData = await semesterDAO.checkDataExistence();
    res.status(200).json({
      message: "Thông tin lĩnh vực và chuyên môn.",
      data: checkData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Có lỗi xảy ra khi lấy danh sách giáo viên chưa có lớp.",
      error: error.message,
    });
  }
};
export default {
  createSemester,
  updateSemester,
  autoUpdateSemesterStatus,
  getAllSemesters,
  getUsersBySemester,
  getCurrentSemesterController,
  checkSemesterStatus,
  checkTeachersInSemester,
  checkMentorsInSemester,
  checkStudentsInSemester,
  checkStudentsInSemesterStatus,
  checkClassCapacity,
  getTeachersWithoutClass,
  getSemesterDetail,
  checkProfessionAndSpeciatyExit,
};
