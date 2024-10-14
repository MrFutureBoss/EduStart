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
    const { name, startDate, endDate } = req.body;

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
        .json({ message: "Kỳ học không thể kéo dài hơn 12 tháng!" });
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

    const updatedSemester = await semesterDAO.updateSemester(semesterId, {
      name,
      startDate: start.toDate(),
      endDate: end.toDate(),
    });

    if (!updatedSemester) {
      return res.status(404).json({ message: "Kỳ học không tồn tại!" });
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
      }

      if (
        currentDate.isSameOrAfter(semesterStartDate) &&
        currentDate.isSameOrBefore(semesterEndDate) &&
        semester.status !== "Ongoing"
      ) {
        await semesterDAO.updateSemesterStatus(semester._id, "Ongoing");
        await semesterDAO.updateUserStatusBySemesterId(semester._id, "Active");
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
    const { studentCount, teacherCount, mentorCount, classCount } =
      await semesterDAO.getCountsForSemester(semester._id);

    // Respond with semester data and counts
    res.status(200).json({
      ...semester.toObject(),
      studentCount,
      teacherCount,
      mentorCount,
      classCount,
    });
  } catch (error) {
    console.error("Error in getCurrentSemester:", error);
    res.status(500).json({ message: error.message });
  }
};

export default {
  createSemester,
  updateSemester,
  autoUpdateSemesterStatus,
  getAllSemesters,
  getUsersBySemester,
  getCurrentSemesterController,
};
