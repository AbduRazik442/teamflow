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

const router = Router();

router.post("/register", validateRegistration, register);
router.post("/login", validateLogin, login);
router.post("/logout", logout);

router.get("/me", requireAuth, getMe);

export default router;