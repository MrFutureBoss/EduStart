// routes/groupRoutes.js
import express from "express";
import mentorController from "../controllers/mentorController/index.js";
import { verifyAccessToken } from "../utilities/jwt.js";
const mentorRouter = express.Router();

mentorRouter.get(
  "/projects-list/:mentorId",
  verifyAccessToken,
  mentorController.getMatchingProjects
);
mentorRouter.post(
  "/projects/save-preferences",
  verifyAccessToken,
  mentorController.saveMentorPreferences
);
mentorRouter.post(
  "/remove-preference",
  mentorController.removePreferenceController
);
mentorRouter.get("/mentor-infor/:mentorId", mentorController.fetchMentorById);
mentorRouter.post("/update/:mentorId", mentorController.updateMentor);
mentorRouter.get(
  "/status/:mentorId",
  verifyAccessToken,
  mentorController.checkMentorUpdateStatus
);

export default mentorRouter;
