import express from "express";
import authRoutes from "./auth.routes";
import fileRoutes from "./file.routes";
import folderRoutes from "./folder.routes";
import staffRoutes from "./staff.routes";
import vaultRoutes from "./vault.routes";
import feedRoutes from "./feed.routes";
import rateList from "./rateList.routes";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/file", fileRoutes);
router.use("/folder", folderRoutes);
router.use("/staff", staffRoutes);
router.use("/vault", vaultRoutes);
router.use("/feed", feedRoutes);
router.use("/feed-rates", rateList);

export default router;
