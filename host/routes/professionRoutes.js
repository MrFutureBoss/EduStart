import express from "express";
import professionController from "../controllers/professionController/index.js";

const professionRouters = express.Router();
//Search nên đặt lên trước để tránh bị coi /:id
professionRouters.get(
  "/get-all",
  professionController.getProfessionsAndSpecialties
);
professionRouters.get("/", professionController.getAllProfessionsAndSpecialty);
professionRouters.get(
  "/search",
  professionController.findProfessionAndSpecialtyByName
);
professionRouters.get(
  "/search/like",
  professionController.searchProfessionsAndSpecialtiesByName
);
professionRouters.get("/:id", professionController.getProfessionById);
professionRouters.get(
  "/:id/specialties",
  professionController.getAllSpecialtyByProfessionID
);
professionRouters.put(
  "/:id/specialties",
  professionController.updateProfessionAndSpecialty
);
professionRouters.post("/", professionController.createNewProfessionAndSpecialty);
professionRouters.post("/bulk", professionController.createProfessionsInBulk);
professionRouters.patch("/:id", professionController.updateProfession);
professionRouters.delete(
  "/:id",
  professionController.deleteProfessionAndSpecialties
);
professionRouters.patch("/:id", professionController.patchProfession);

export default professionRouters;
