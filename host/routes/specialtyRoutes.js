import express from "express";
import specialtyController from "../controllers/specialtyController/index.js";

const specialtyRouters= express.Router();

specialtyRouters.get("/", specialtyController.getAllSpecialties);
specialtyRouters.post("/", specialtyController.createNewSpecialty);
specialtyRouters.patch("/:id", specialtyController.updateSpecialty);
specialtyRouters.delete("/:id", specialtyController.deleteSpecialty);
export default specialtyRouters;