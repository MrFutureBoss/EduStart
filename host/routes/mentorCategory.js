import express from "express";
import mentorCategoryController from "../controllers/mentorCategoryController/index.js";

const mentorCategoryRouters = express.Router();
//Search nên đặt lên trước để tránh bị coi /:id
mentorCategoryRouters.get("/", mentorCategoryController.getAllMentorCategories);
mentorCategoryRouters.get("/:id", mentorCategoryController.getMentorCategoryById);
mentorCategoryRouters.post("/", mentorCategoryController.createNewMentorCategory);
export default mentorCategoryRouters;
