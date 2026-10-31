import express from "express";
import {
  create,
  getAll,
  getById,
  update,
  remove,
} from "../controller/folder.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { Admin_and_Director, All_Roles } from "../types/enum.types";

const router = express.Router();

router.get("/", getAll);
router.get("/:id", getById);
router.post("/create", authenticate(All_Roles), create);
router.patch("/update/:id", authenticate(Admin_and_Director), update);
router.delete("/delete/:id", authenticate(Admin_and_Director), remove);

export default router;
