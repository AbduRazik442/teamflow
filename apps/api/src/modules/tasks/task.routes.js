
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from "./task.controller.js";
import { validateTask } from "./task.validation.js";
import { validateTaskQuery } from "./taskQuery.validation.js";

const router = Router();

router.use(requireAuth);

router.get("/", getTasks);
router.get("/:id", getTask);
router.post("/", validateTask, createTask);
router.patch("/:id", validateTask, updateTask);
router.delete("/:id", deleteTask);
router.get("/", validateTaskQuery, getTasks);

export default router;