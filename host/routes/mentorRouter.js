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
export default mentorRouter;
