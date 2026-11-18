import express, { type Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { auditModule } from "../middlewares/audit.middleware";
import auditLogRoutes from "./audit.routes";
import authRoutes from "./auth.routes";
import fileRoutes from "./file.routes";
import folderRoutes from "./folder.routes";
import staffRoutes from "./staff.routes";
import vaultRoutes from "./vault.routes";
import feedRoutes from "./feed.routes";
import rateList from "./rateList.routes";
import documentPhotos from "./document-photo.routes";
import { rasidRoutes, bharpaiRoutes } from "./voucher.routes";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/audit-logs", auditLogRoutes);

function protectedModule(path: string, name: string, routes: Router) {
  router.use(path, authenticate(), auditModule(name), routes);
}

protectedModule("/document-photos", "Document photos", documentPhotos);
protectedModule("/file", "Files", fileRoutes);
protectedModule("/folder", "Folders", folderRoutes);
protectedModule("/staff", "Staff", staffRoutes);
protectedModule("/vault", "Vault", vaultRoutes);
protectedModule("/feed", "Feed", feedRoutes);
protectedModule("/feed-rates", "Feed rates", rateList);
protectedModule("/rasid", "Rasid", rasidRoutes);
protectedModule("/bharpai", "Bharpai", bharpaiRoutes);

// If auth.routes.ts contains protected user-management routes, add
// auditModule("Users") AFTER authenticate() on those specific routes.
// Leave login, password reset and other public auth endpoints as they are.

export default router;
