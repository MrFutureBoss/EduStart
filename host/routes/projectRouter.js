import express from "express";
import projectController from "../controllers/projectController/index.js";
import { verifyAccessToken, verifyRole } from "../utilities/jwt.js";

const projectRouter = express.Router();

projectRouter.get("/:id", verifyAccessToken, projectController.getProjectById);
projectRouter.patch(
  "/:id/update_project",
  verifyAccessToken,
  projectController.updateProject
);
projectRouter.get(
  "/planning-projects/:teacherId",
  verifyAccessToken,
  projectController.getPlanningProjectsForTeacher
);
projectRouter.get(
  "/changing-projects/:teacherId",
  verifyAccessToken,
  projectController.getChangingProjectsForTeacher
);
projectRouter.put(
  "/approve/planning/:projectId",
  verifyAccessToken,
  projectController.approveProjectPlanning
);
projectRouter.put(
  "/decline/planning/:projectId",
  verifyAccessToken,
  projectController.declineProjectPlanning
);
projectRouter.put(
  "/approve/changing/:projectId",
  verifyAccessToken,
  projectController.approveProjectChanging
);
projectRouter.put(
  "/decline/changing/:projectId",
  verifyAccessToken,
  projectController.declineProjectChanging
);

projectRouter.patch(
  "/:id/revise_project",
  verifyAccessToken,
  projectController.reviseProject
);
export default projectRouter;
