import express from "express";
import adminController from "../controllers/AdminController/index.js";
import multer from "multer";
import { verifyAccessToken, verifyRole } from "../utilities/jwt.js";

const adminRouter = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

adminRouter.post(
  "/import-users",
  verifyAccessToken,
  verifyRole([1]),
  upload.single("file"),
  adminController.insertListUsers
);
adminRouter.post(
  "/add-user-hand",
  verifyAccessToken,
  verifyRole([1]),
  adminController.insertUserByHand
);

adminRouter.get(
  "/:semesterId/available/class",
  verifyAccessToken,
  verifyRole([1]),
  adminController.getAvailableClasses
);
adminRouter.post(
  "/assign/student",
  verifyAccessToken,
  verifyRole([1]),
  adminController.assignStudentToClass
);
adminRouter.get(
  "/pending-user/:semesterId",
  verifyAccessToken,
  verifyRole([1]),
  adminController.getPendingUsers
);
adminRouter.post(
  "/create-class",
  verifyAccessToken,
  verifyRole([1]),
  adminController.createClass
);
adminRouter.get(
  "/:semesterId/full/classes",
  verifyAccessToken,
  verifyRole([1]),
  adminController.fetchFullClasses
);
adminRouter.get(
  "/teachers-list/:semesterId",
  verifyAccessToken,
  verifyRole([1]),
  adminController.fetchTeachers
);
adminRouter.post(
  "/transfer",
  verifyAccessToken,
  verifyRole([1]),
  adminController.transferStudentController
);
adminRouter.post(
  "/swap",
  verifyAccessToken,
  verifyRole([1]),
  adminController.swapStudentsController
);
adminRouter.post(
  "/apply-class-changes",
  verifyAccessToken,
  verifyRole([1]),
  adminController.applyClassChanges
);
export default adminRouter;
