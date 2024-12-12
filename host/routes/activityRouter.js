import express from "express";
import activityController from "../controllers/activityController/index.js";
import { verifyAccessToken, verifyRole } from "../utilities/jwt.js";
import upload, { downloadFile } from "../middlewares/uploadMiddleware.js";

const activityRouters = express.Router();

activityRouters.get(
  "/",
  verifyAccessToken,
  verifyRole([2, 4]),
  activityController.getActivities
);

activityRouters.post(
  "/",
  verifyAccessToken,
  verifyRole([2]),
  upload.single("materialFile"),
  activityController.createActivity
);

activityRouters.patch(
  "/:activityId",
  verifyAccessToken,
  verifyRole([2]),
  upload.single("materialFile"),
  activityController.updateActivity
);

activityRouters.delete(
  "/:activityId",
  verifyAccessToken,
  verifyRole([2]),
  activityController.deleteActivity
);

activityRouters.get("/checkFileExists", activityController.checkFileExists);

activityRouters.get("/download/:filename", downloadFile);

activityRouters.get(
  "/user/:userId",
  verifyAccessToken,
  verifyRole([2]),
  activityController.getActivitiesByTeacher
);
activityRouters.get(
  "/suggested-materials/:classId",
  verifyAccessToken,
  verifyRole([2, 4]),
  activityController.getSuggestedMaterials
);
activityRouters.post(
  "/send-reminder",
  verifyAccessToken,
  verifyRole([2]),
  activityController.sendReminder
);
activityRouters.post(
  "/assign-outcome-manual",
  verifyAccessToken,
  verifyRole([2]),
  activityController.assignOutcomeToAllGroupsManual
);

activityRouters.post(
  "/assign-outcome",
  verifyAccessToken,
  verifyRole([2]),
  activityController.assignOutcomeToAllGroups
);
activityRouters.patch(
  "/update-outcome/:activityId",
  verifyAccessToken,
  verifyRole([2]),
  activityController.updateOutcomeDeadline
);

activityRouters.post(
  "/auto-assign-outcomes",
  verifyAccessToken,
  verifyRole([2]),
  activityController.autoAssignOutcomes
);
activityRouters.get(
  "/group-outcomes/:groupId",
  verifyAccessToken,
  verifyRole([2, 4]),
  activityController.getGroupOutcomes
);

activityRouters.get(
  "/unsubmitted-groups",
  verifyAccessToken,
  verifyRole([2, 4]),
  activityController.getUnsubmittedGroups
);

activityRouters.get(
  "/class/check-outcome",
  activityController.checkClassOutcome
);

//Outcome type
activityRouters.get(
  "/outcome-type",
  verifyAccessToken,
  activityController.getAllOutcomesType
);
activityRouters.post(
  "/outcome-type",
  verifyAccessToken,
  verifyRole([1]),
  activityController.createOutcomeType
);
activityRouters.patch(
  "/outcome-type/:id",
  verifyAccessToken,
  verifyRole([1]),
  activityController.updateOutcomeType
);
activityRouters.delete(
  "/outcome-type/:id",
  verifyAccessToken,
  verifyRole([1]),
  activityController.deleteOutcomeType
);
activityRouters.get(
  "/outcome-type/:id",
  verifyAccessToken,
  verifyRole([1, 2, 3, 4]),
  activityController.getOutcomeTypeById
);
activityRouters.get(
  "/outcome-type/semester/:semesterId",
  verifyAccessToken,
  activityController.getOutcomesBySemester
);
export default activityRouters;
