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
  "/:teacherId/:semesterId/summary_classses",
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

classRouter.get(
  "/info/:teacherId",
  verifyAccessToken,
  classController.getSemestersAndClassesByTeacherId
);

classRouter.get(
  "/task/:teacherId",
  verifyAccessToken,
  classController.getClassesInfoAndTaskByTeacherId
);
classRouter.get(
  "/all-class/:semesterId",
  verifyAccessToken,
  classController.getClasses
);
classRouter.get(
  "/class-detail/:id",
  verifyAccessToken,
  classController.getClassDetails
);
classRouter.put(
  "/update-class/:id",
  verifyAccessToken,
  classController.updateClass
);
// classRouter.post(
//   "/auto-fill-deadline",
//   classController.autoFillGroupsOnDeadline
// );

export default classRouter;
