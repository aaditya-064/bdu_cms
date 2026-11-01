import express from "express";
import {
  create,
  getAll,
  getById,
  update,
  remove,
  setLock,
} from "../controller/folder.controller";
import { authenticate } from "../middlewares/auth.middleware";
import {
  Admin_and_Director,
  All_Roles,
  Staff_And_Management,
} from "../types/enum.types";

const router = express.Router();

router.use(authenticate(Staff_And_Management));

router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store");
  next();
});

router.get("/", getAll);
router.get("/:id", getById);
router.post("/create", authenticate(All_Roles), create);
router.patch("/update/:id", authenticate(Admin_and_Director), update);
router.delete("/delete/:id", authenticate(Admin_and_Director), remove);
router.patch("/:id/lock", authenticate(Admin_and_Director), setLock);

export default router;
