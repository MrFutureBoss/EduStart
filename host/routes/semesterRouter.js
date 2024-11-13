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
  verifyRole([1]),
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
  "/check-semester-status",
  verifyAccessToken,
  semesterController.checkSemesterStatus
);
semesterRouter.get(
  "/check-teachers",
  verifyAccessToken,
  semesterController.checkTeachersInSemester
);
semesterRouter.get(
  "/check-mentors",
  verifyAccessToken,
  semesterController.checkMentorsInSemester
);
semesterRouter.get(
  "/check-students",
  verifyAccessToken,
  semesterController.checkStudentsInSemester
);
semesterRouter.get(
  "/check-students-pending",
  verifyAccessToken,
  semesterController.checkStudentsInSemesterStatus
);
semesterRouter.get(
  "/check-class-capacity",
  verifyAccessToken,
  semesterController.checkClassCapacity
);
semesterRouter.get(
  "/check-teachers-without-class",
  verifyAccessToken,
  semesterController.getTeachersWithoutClass
);
export default semesterRouter;
