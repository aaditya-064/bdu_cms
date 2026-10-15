import express from "express";
import {
  register,
  login,
  getProfile,
  logout,
  changeProfileImage,
} from "../controller/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = express.Router();
//* register
router.post("/register", register);
//* login
router.post("/login", login);

router.get("/me", authenticate(), getProfile);

router.post("/logout", logout);

router.post("/change-profile-image", authenticate(), changeProfileImage);

export default router;
