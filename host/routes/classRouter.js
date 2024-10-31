import express from "express";
import classController from "../controllers/classController/index.js";
import { verifyAccessToken, verifyRole } from "../utilities/jwt.js";

const classRouter = express.Router();

classRouter.get(
  "/className/:className",
  verifyAccessToken,
  classController.getClassIdByClassName
);
classRouter.get(
  "/projects/:teacherId/:classId",
  verifyAccessToken,
  classController.getProjectsByTeacherAndClass
);
classRouter.get(
  "/:teacherId/summary_classses",
  verifyAccessToken,
  classController.getTeacherClassSummary
);
classRouter.get(
  "/ungroup/:classId",
  verifyAccessToken,
  classController.getUsersByClassIdAndEmptyGroupId
);
classRouter.get(
  "/:userId/user",
  verifyAccessToken,
  verifyRole([2]),
  classController.getClassesByUserId
);

export default classRouter;
