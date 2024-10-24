import express from "express";
import mentorCategoryController from "../controllers/mentorCategoryController/index.js";
import { verifyAccessToken, verifyRole } from "../utilities/jwt.js";
import teacherController from "../controllers/teacherController/teacherController.js";

const mentorCategoryRouters = express.Router();
// mentorCategoryRouters.get("/", mentorCategoryController.getAllMentorCategories);
// mentorCategoryRouters.get(
//   "/:id",
//   mentorCategoryController.getMentorCategoryById
// );
// mentorCategoryRouters.post(
//   "/",
//   mentorCategoryController.createNewMentorCategory
// );
// phần mới
mentorCategoryRouters.get(
  "/data_tree",
  verifyAccessToken,
  verifyRole([2]),
  mentorCategoryController.getTreeData
);
mentorCategoryRouters.get(
  "/mentors_list",
  verifyAccessToken,
  verifyRole([2]),
  mentorCategoryController.getMentorsBySpecialty
);
mentorCategoryRouters.post(
  "/selection",
  verifyAccessToken,
  verifyRole([2]),
  teacherController.saveTeacherSelection
);
mentorCategoryRouters.get(
  "/selection",
  verifyAccessToken,
  verifyRole([2]),
  teacherController.getTeacherSelection
);
export default mentorCategoryRouters;
