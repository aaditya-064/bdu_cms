import { Router } from "express";
import { getAuditLogs } from "../controller/audit.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authenticate(), getAuditLogs);

export default router;
