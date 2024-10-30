import classDAO from "../../repositories/classDAO/index.js";
import userDAO from "../../repositories/userDAO/index.js";

const getClassesByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    let user;
    let result = await classDAO.getClassesByUserId(userId);
    if (result.length === 0) {
      user = await userDAO.findUserById(userId);
      result = user?.classId;
    }
    res.send(result);
  } catch (error) {
    next(error);
  }
};

const getClassIdByClassName = async (req, res, next) => {
  try {
    const { className } = req.params;
    const classId = await classDAO.getClassIdByClassName(className);

    if (!classId) {
      return res.status(404).send({ message: "Class not found" }); // Trả về 404 nếu không tìm thấy class
    }

    res.status(200).send({ classId });
  } catch (error) {
    next(error);
  }
};

const getUsersByClassIdAndEmptyGroupId = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { skip = 0, limit = 10 } = req.query;

    const { data, total } = await classDAO.getUsersByClassIdAndEmptyGroupId(
      classId,
      parseInt(skip),
      parseInt(limit)
    );

    if (total === 0) {
      return res
        .status(404)
        .send({
          message: "No users found with empty or null groupId in this class",
        });
    }

    res.status(200).send({ data, total });
  } catch (error) {
    next(error);
  }
};

const getSemestersAndClassesByTeacherId = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const { semesters, classes, totalClasses, totalStudents } =
      await classDAO.getSemestersAndClassesByTeacherId(teacherId);

    if (!semesters.length && !classes.length) {
      return res
        .status(404)
        .send({ message: "No semesters or classes found for this teacher" });
    }

    res.status(200).send({
      semesters,
      classes,
      totalClasses, // Trả về tổng số lớp
      totalStudents, // Trả về tổng số sinh viên
    });
  } catch (error) {
    next(error);
  }
};

const getClassesInfoAndTaskByTeacherId = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const classes = await classDAO.getClassesInfoAndTaskByTeacherId(teacherId);
    res.status(200).json({ data: classes });
  } catch (error) {
    next(error);
  }
};
export default {
  getClassesByUserId,
  getClassIdByClassName,
  getUsersByClassIdAndEmptyGroupId,
  getSemestersAndClassesByTeacherId,
  getClassesInfoAndTaskByTeacherId,
};
