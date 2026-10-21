
import mongoose from "mongoose";
import Workspace from "./workspace.model.js";
import Membership from "./membership.model.js";
import Invitation from "./invitation.model.js";
import User from "../users/user.model.js";

function validId(id) {
  return mongoose.isValidObjectId(id);
}

async function getActiveMembership(workspaceId, userId) {
  return Membership.findOne({
    workspace: workspaceId,
    user: userId,
    status: "active",
  });
}

async function requireAdmin(workspaceId, userId) {
  const membership = await getActiveMembership(workspaceId, userId);

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return null;
  }

  return membership;
}

export async function createWorkspace(req, res, next) {
  let workspace;

  try {
    workspace = await Workspace.create({
      name: req.body.name.trim(),
      description: req.body.description?.trim() ?? "",
      owner: req.userId,
    });

    await Membership.create({
      workspace: workspace._id,
      user: req.userId,
      role: "owner",
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Workspace created successfully.",
      workspace,
    });
  } catch (error) {
    // Avoid leaving an unlinked workspace if membership creation fails.
    if (workspace) {
      await Workspace.deleteOne({ _id: workspace._id }).catch(() => {});
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Workspace membership already exists.",
      });
    }

    next(error);
  }
}

export async function getWorkspaces(req, res, next) {
  try {
    const memberships = await Membership.find({
      user: req.userId,
      status: "active",
    })
      .populate("workspace")
      .sort({ createdAt: -1 })
      .lean();

    const workspaces = memberships
      .filter((item) => item.workspace)
      .map((item) => ({
        ...item.workspace,
        membershipRole: item.role,
      }));

    return res.status(200).json({
      success: true,
      count: workspaces.length,
      workspaces,
    });
  } catch (error) {
    next(error);
  }
}

export async function getWorkspaceMembers(req, res, next) {
  try {
    const { workspaceId } = req.params;

    if (!validId(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID.",
      });
    }

    const membership = await getActiveMembership(
      workspaceId,
      req.userId
    );

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found.",
      });
    }

    const members = await Membership.find({
      workspace: workspaceId,
      status: "active",
    })
      .populate("user", "name email")
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      members,
    });
  } catch (error) {
    next(error);
  }
}

export async function inviteMember(req, res, next) {
  try {
    const { workspaceId } = req.params;
    const email = req.body.email.trim().toLowerCase();
    const role = req.body.role ?? "member";

    if (!validId(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID.",
      });
    }

    const membership = await requireAdmin(
      workspaceId,
      req.userId
    );

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Only workspace owners and admins can invite members.",
      });
    }

    const invitedUser = await User.findOne({ email }).select("_id email");

    if (!invitedUser) {
      return res.status(404).json({
        success: false,
        message: "No registered user exists with that email.",
      });
    }

    if (invitedUser._id.toString() === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You are already a member of this workspace.",
      });
    }

    const existingMembership = await Membership.findOne({
      workspace: workspaceId,
      user: invitedUser._id,
    });

    if (existingMembership) {
      if (existingMembership.status === "active") {
        return res.status(409).json({
          success: false,
          message: "This user is already a workspace member.",
        });
      }

      return res.status(409).json({
        success: false,
        message: "This user's membership is suspended. Restore it through an authorized admin workflow.",
      });
    }

    const pendingInvitation = await Invitation.findOne({
      workspace: workspaceId,
      email,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (pendingInvitation) {
      return res.status(409).json({
        success: false,
        message: "A pending invitation already exists for this email.",
      });
    }

    const invitation = await Invitation.create({
      workspace: workspaceId,
      email,
      role,
      invitedBy: req.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return res.status(201).json({
      success: true,
      message: "Invitation created. The invited user can accept it after signing in.",
      invitation: {
        _id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function acceptInvitation(req, res, next) {
  try {
    const { invitationId } = req.params;

    if (!validId(invitationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invitation ID.",
      });
    }

    const invitation = await Invitation.findOne({
      _id: invitationId,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found, expired, or already processed.",
      });
    }

    const user = await User.findById(req.userId).select("email");

    if (
      !user ||
      user.email.toLowerCase() !== invitation.email.toLowerCase()
    ) {
      return res.status(403).json({
        success: false,
        message: "Sign in with the email address that received this invitation.",
      });
    }

    const existingMembership = await Membership.findOne({
      workspace: invitation.workspace,
      user: req.userId,
    });

    if (existingMembership) {
      if (existingMembership.status !== "active") {
        return res.status(409).json({
          success: false,
          message: "Your existing membership is suspended.",
        });
      }
    } else {
      await Membership.create({
        workspace: invitation.workspace,
        user: req.userId,
        role: invitation.role,
        status: "active",
      });
    }

    invitation.status = "accepted";
    await invitation.save();

    const workspace = await Workspace.findById(invitation.workspace);

    return res.status(200).json({
      success: true,
      message: "You joined the workspace successfully.",
      workspace,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You are already a member of this workspace.",
      });
    }

    next(error);
  }
}