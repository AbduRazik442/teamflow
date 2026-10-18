
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { getDashboardStats } from "./dashboard.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/stats", getDashboardStats);

export default router;