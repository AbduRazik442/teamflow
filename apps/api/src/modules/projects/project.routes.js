
import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware.js";

import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from "./project.controller.js";

import { validateProject } from "./project.validation.js";

const router = Router();

// All project endpoints require authentication.
router.use(requireAuth);

router.get("/", getProjects);
router.get("/:id", getProject);
router.post("/", validateProject, createProject);
router.patch("/:id", validateProject, updateProject);
router.delete("/:id", deleteProject);

export default router;