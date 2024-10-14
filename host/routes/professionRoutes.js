import express from "express";
import professionController from "../controllers/professionController/index.js";

const professionRouters = express.Router();
//Search nên đặt lên trước để tránh bị coi /:id
professionRouters.get("/", professionController.getAllProfessions);
professionRouters.get("/search", professionController.findProfessionAndSpecialtyByName);
professionRouters.get("/:id", professionController.getProfessionById);
professionRouters.get("/:id/specialties", professionController.getAllSpecialtyByProfessionID);
professionRouters.put("/:id/specialties", professionController.updateProfessionAndSpecialty)
professionRouters.post("/", professionController.createNewProfession);
professionRouters.patch("/:id", professionController.updateProfession);
professionRouters.delete("/:id", professionController.deleteProfessionAndSpecialties);
professionRouters.patch("/:id", professionController.patchProfession);
export default professionRouters;
