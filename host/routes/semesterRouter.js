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
  verifyRole([1]),
  semesterController.getCurrentSemesterController
);

export default semesterRouter;
