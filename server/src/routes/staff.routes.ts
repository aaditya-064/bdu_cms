import express from "express";
import {
  create,
  getAll,
  getById,
  update,
  remove,
} from "../controller/staff.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { Admin_Only, Admin_and_Director } from "../types/enum.types";

const router = express.Router();

router.get("/", getAll);
router.get("/:id", getById);
router.post("/create", authenticate(Admin_and_Director), create);
router.patch("/update/:id", authenticate(Admin_Only), update);
router.delete("/delete/:id", authenticate(Admin_Only), remove);

export default router;
