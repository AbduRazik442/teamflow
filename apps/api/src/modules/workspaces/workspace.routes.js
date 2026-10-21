
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  createWorkspace,
  getWorkspaces,
  getWorkspaceMembers,
  inviteMember,
  acceptInvitation,
} from "./workspace.controller.js";
import {
  validateWorkspace,
  validateInvitation,
} from "./workspace.validation.js";

const router = Router();

router.use(requireAuth);

router.get("/", getWorkspaces);
router.post("/", validateWorkspace, createWorkspace);

router.post(
  "/invitations/:invitationId/accept",
  acceptInvitation
);

router.get("/:workspaceId/members", getWorkspaceMembers);

router.post(
  "/:workspaceId/invitations",
  validateInvitation,
  inviteMember
);

export default router;