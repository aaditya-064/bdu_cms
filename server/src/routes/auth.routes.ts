import express from "express";
import {
  register,
  login,
  getProfile,
  logout,
  changeProfileImage,
} from "../controller/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { Admin_and_Director } from "../types/enum.types";

const router = express.Router();
//* register
router.post("/register", authenticate(Admin_and_Director), register);
//* login
router.post("/login", login);

router.get("/me", authenticate(), getProfile);

router.post("/logout", logout);

router.post("/change-profile-image", authenticate(), changeProfileImage);

export default router;
