import express from "express";
import { verifyAccessToken, verifyRole } from "../utilities/jwt.js";
import groupController from "../controllers/groupController/groupController.js";

const groupRouter = express.Router();

groupRouter.get(
  "/project/:groupId",
  verifyAccessToken,
  verifyRole([2]),
  groupController.getProjectByGroupId
);

groupRouter.get(
  "/group-infor/:id",
  verifyAccessToken,
  groupController.getInforGroupById
);

groupRouter.get(
  "/class/:classId/:semesterId",
  verifyAccessToken,
  groupController.getGroupsByClassId
);

groupRouter.get(
  "/student/:classId",
  verifyAccessToken,
  groupController.getAllUserByClassId
);

groupRouter.patch("/:id", verifyAccessToken, groupController.patchGroup);

// groupRouter.get(
//   "/classes/:classId",
//   verifyAccessToken,
//   groupController.getGroupsByClassIds
// );

export default groupRouter;
