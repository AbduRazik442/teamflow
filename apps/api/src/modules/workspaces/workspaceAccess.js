
import mongoose from "mongoose";
import Membership from "./membership.model.js";
import Project from "../projects/project.model.js";

export async function getActiveMembership(workspaceId, userId) {
  if (!mongoose.isValidObjectId(workspaceId)) return null;

  return Membership.findOne({
    workspace: workspaceId,
    user: userId,
    status: "active",
  });
}

export async function canManageProject(project, userId) {
  if (!project.workspace) {
    return project.owner.toString() === userId.toString();
  }

  const membership = await getActiveMembership(
    project.workspace,
    userId
  );

  if (!membership) return false;

  return (
    membership.role === "owner" ||
    membership.role === "admin" ||
    project.owner.toString() === userId.toString()
  );
}

export async function getAccessibleProjects(userId) {
  const memberships = await Membership.find({
    user: userId,
    status: "active",
  })
    .select("workspace")
    .lean();

  const workspaceIds = memberships.map(
    (membership) => membership.workspace
  );

  return Project.find({
    $or: [
      { owner: userId, workspace: null },
      { owner: userId, workspace: { $exists: false } },
      { workspace: { $in: workspaceIds } },
    ],
  });
}