import express from "express";
import multer from "multer";
import {
  create,
  getAll,
  getById,
  update,
  remove,
} from "../controller/file.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { Admin_and_Director } from "../types/enum.types";

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

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get("/", getAll);
router.get("/:id", getById);
router.post(
  "/create",
  authenticate(Admin_and_Director),
  upload.single("file"),
  create,
);
router.patch("/update/:id", authenticate(Admin_and_Director), update);
router.delete("/delete/:id", authenticate(Admin_and_Director), remove);

export default router;
