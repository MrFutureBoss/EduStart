import express from "express";
import tempGroupController from "../controllers/tempGroupController/index.js";
import { verifyAccessToken, authorize } from "../utilities/jwt.js";

const tempGroupRouters = express.Router();

tempGroupRouters.get(
  "/",
  verifyAccessToken,
  tempGroupController.getAllTempGroups
);
tempGroupRouters.get(
  "/class/:classId",
  verifyAccessToken,
  tempGroupController.getTempGroupsByClassId
);

tempGroupRouters.get(
  "/name/:groupName",
  verifyAccessToken,
  tempGroupController.getTempGroupDetailByGroupName
);

tempGroupRouters.get(
  "/:id",
  verifyAccessToken,
  tempGroupController.getTempGroupById
);
tempGroupRouters.post(
  "/",
  verifyAccessToken,
  tempGroupController.createNewTempGroup
);

tempGroupRouters.post(
  "/auto-fill",
  tempGroupController.autoFillGroupsOnDeadline
);

tempGroupRouters.post(
  "/auto-fill/:classId",
  tempGroupController.fillGroupsByClassId
);

tempGroupRouters.post(
  "/offical-group/:classId",
  tempGroupController.makeOfficalGroupByClassId
);

tempGroupRouters.post(
  "/students/:classId",
  tempGroupController.allStudentInClassHasGroup
);

tempGroupRouters.put(
  "/:id",
  verifyAccessToken,
  tempGroupController.updateTempGroup
);
tempGroupRouters.delete(
  "/:id",
  verifyAccessToken,
  tempGroupController.deleteTempGroup
);

export default tempGroupRouters;
