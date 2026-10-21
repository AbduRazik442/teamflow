import { Router } from "express";

import {
  register,
  login,
  logout,
  getMe,
} from "./auth.controller.js";

import {
  validateRegistration,
  validateLogin,
} from "./auth.validation.js";

import { requireAuth } from "../../middleware/auth.middleware.js";
import { authRateLimiter } from "../../middleware/rateLimit.middleware.js";

const router = Router();

router.post("/register", authRateLimiter, validateRegistration, register);
router.post("/login", authRateLimiter, validateLogin, login);
router.post("/logout", logout);

router.get("/me", requireAuth, getMe);

export default router;