import express from "express";
import { verifyAccessToken, verifyRole } from "../utilities/jwt.js";
import matchedController from "../controllers/matchedController/matchedController.js";

const matchedRouter = express.Router();

matchedRouter.post(
  "/add-matched",
  verifyAccessToken,
  verifyRole([2]),
  matchedController.createMatchedHandler
);

matchedRouter.get(
  "/infor-matched/:groupId",
  verifyAccessToken,
  verifyRole([2]),
  matchedController.getMatchedInfoByGroupId
);

matchedRouter.put(
  "/edit-matched/:id",
  verifyAccessToken,
  verifyRole([2]),
  matchedController.updateMatchedStatus
);

matchedRouter.patch("/:id", verifyAccessToken, matchedController.patchMatched);

matchedRouter.post(
  "/time/:id",
  verifyAccessToken,
  matchedController.createNewTimeEventsHandler
);

matchedRouter.patch(
  "/time/:eventId",
  verifyAccessToken,
  matchedController.patchTimeEventHandler
);

matchedRouter.delete(
  "/time/:eventId",
  verifyAccessToken,
  matchedController.deleteTimeEventHandler
);

matchedRouter.get(
  "/mentor/:mentorId",
  verifyAccessToken,
  matchedController.getAllMatchingDetailByMentorId
);

matchedRouter.get(
  "/matched-by-class/:classId/:semesterId",
  verifyAccessToken,
  matchedController.getMatchedInfoByClassId
);

matchedRouter.delete(
  "/delete-matched/:groupId",
  verifyAccessToken,
  matchedController.deleteMatched
);

matchedRouter.get(
  "/matched-class/:classId",
  verifyAccessToken,
  matchedController.getMatchedGroupsCountController
);
export default matchedRouter;
