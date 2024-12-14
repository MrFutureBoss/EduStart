import express from "express";
import semesterController from "../controllers/semesterController/index.js";
import { verifyAccessToken, verifyRole } from "../utilities/jwt.js";

const semesterRouter = express.Router();

semesterRouter.post(
  "/create",
  verifyAccessToken,
  verifyRole([1]),
  semesterController.createSemester
);
semesterRouter.put(
  "/update/:semesterId",
  verifyAccessToken,
  verifyRole([1]),
  semesterController.updateSemester
);
semesterRouter.get(
  "/all",
  verifyAccessToken,
  verifyRole([1, 2]),
  semesterController.getAllSemesters
);
semesterRouter.get(
  "/:semesterId/users",
  verifyAccessToken,
  verifyRole([1]),
  semesterController.getUsersBySemester
);
semesterRouter.get(
  "/current",
  verifyAccessToken,
  verifyRole([1, 2]),
  semesterController.getCurrentSemesterController
);
semesterRouter.get(
  "/:semesterId/detail",
  verifyAccessToken,
  verifyRole([1, 2]),
  semesterController.getSemesterDetail
);
semesterRouter.get(
  "/check-semester-status/:semesterId",
  verifyAccessToken,
  semesterController.checkSemesterStatus
);
semesterRouter.get(
  "/check-teachers/:semesterId",
  verifyAccessToken,
  semesterController.checkTeachersInSemester
);
semesterRouter.get(
  "/check-mentors/:semesterId",
  verifyAccessToken,
  semesterController.checkMentorsInSemester
);
semesterRouter.get(
  "/check-students/:semesterId",
  verifyAccessToken,
  semesterController.checkStudentsInSemester
);
semesterRouter.get(
  "/check-students-pending/:semesterId",
  verifyAccessToken,
  semesterController.checkStudentsInSemesterStatus
);
semesterRouter.get(
  "/check-class-capacity/:semesterId",
  verifyAccessToken,
  semesterController.checkClassCapacity
);
semesterRouter.get(
  "/check-teachers-without-class",
  verifyAccessToken,
  semesterController.getTeachersWithoutClass
);
semesterRouter.get(
  "/check-profesison-speciatly",
  verifyAccessToken,
  semesterController.checkProfessionAndSpeciatyExit
);
export default semesterRouter;
