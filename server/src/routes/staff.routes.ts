import express from "express";
import multer from "multer";
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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.get("/", getAll);
router.get("/:id", getById);

router.post(
  "/create",
  authenticate(Admin_and_Director),
  upload.single("profile_image"),
  create,
);

router.patch(
  "/update/:id",
  authenticate(Admin_Only),
  upload.single("profile_image"),
  update,
);

router.delete("/delete/:id", authenticate(Admin_Only), remove);

export default router;
