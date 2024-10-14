import express from "express";
import { body, param, query } from "express-validator";
import tempMatchingController from "../controllers/tempMatchingController/index.js";
const tempMatchingRouter = express.Router();

// Lấy danh sách mentor khả dụng
tempMatchingRouter.get(
  "/available-mentors",
  tempMatchingController.getAvailableMentors
);
// Lấy tất cả các ghép tạm thời theo groupId
tempMatchingRouter.get(
  "/:gId",
  [
    param("gId").isMongoId().withMessage("Invalid groupId"),
    query("search").optional().isString(),
    query("skip").optional().isInt({ min: 0 }),
    query("limit").optional().isInt({ min: 1 }),
  ],
  tempMatchingController.getAllTempMatchingByTeacherId
);

// Tạo ghép tạm thời cho groupId
tempMatchingRouter.post(
  "/:gid",
  [param("gid").isMongoId().withMessage("Invalid groupId")],
  tempMatchingController.addTempMatchingByGid
);

// Lấy danh sách mentor tiềm năng cho groupId
tempMatchingRouter.get(
  "/potential-mentors/:groupId",
  [param("groupId").isMongoId().withMessage("Invalid groupId")],
  tempMatchingController.getPotentialMentorsByGroupId
);

// Xác nhận ghép cặp
tempMatchingRouter.post(
  "/confirm-matching",
  [
    body("groupId").isMongoId().withMessage("Invalid groupId"),
    body("mentorId").isMongoId().withMessage("Invalid mentorId"),
  ],
  tempMatchingController.confirmMatching
);

tempMatchingRouter.post(
  "/all-groups/:teacherId",
  [param("teacherId").isMongoId().withMessage("Invalid teacherId")],
  tempMatchingController.addTempMatchingForAllGroups
);

export default tempMatchingRouter;
