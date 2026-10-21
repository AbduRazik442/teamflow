import mongoose from "mongoose";
import Project from "./project.model.js";
import Membership from "../workspaces/membership.model.js";
import Task from "../tasks/task.model.js";
import { canManageProject } from "../workspaces/workspaceAccess.js";

function validateProjectId(req, res) {
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).json({
            success: false,
            message: "Invalid project ID.",
        });
        return false;
    }

    return true;
}

async function findAccessibleProject(projectId, userId) {
    const memberships = await Membership.find({
        user: userId,
        status: "active",
    })
        .select("workspace")
        .lean();

    const workspaceIds = memberships.map((item) => item.workspace);

    return Project.findOne({
        _id: projectId,
        $or: [
            { owner: userId, workspace: null },
            { owner: userId, workspace: { $exists: false } },
            { workspace: { $in: workspaceIds } },
        ],
    });
}

export async function getProjects(req, res, next) {
    try {
        const memberships = await Membership.find({
            user: req.userId,
            status: "active",
        })
            .select("workspace")
            .lean();

        const workspaceIds = memberships.map((item) => item.workspace);

        const projects = await Project.find({
            $or: [
                { owner: req.userId, workspace: null },
                { owner: req.userId, workspace: { $exists: false } },
                { workspace: { $in: workspaceIds } },
            ],
        })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: projects.length,
            projects,
        });
    } catch (error) {
        next(error);
    }
}

export async function getProject(req, res, next) {
    try {
        if (!validateProjectId(req, res)) return;

        const project = await findAccessibleProject(
            req.params.id,
            req.userId
        );

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found.",
            });
        }

        return res.status(200).json({
            success: true,
            project,
        });
    } catch (error) {
        next(error);
    }
}

export async function createProject(req, res, next) {
    try {
        const { name, description, status, priority, workspace } = req.body;

        let workspaceId = null;

        if (workspace !== undefined && workspace !== null && workspace !== "") {
            if (!mongoose.isValidObjectId(workspace)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid workspace ID.",
                });
            }

            const membership = await Membership.findOne({
                workspace,
                user: req.userId,
                status: "active",
            });

            if (!membership) {
                return res.status(403).json({
                    success: false,
                    message: "You are not an active member of this workspace.",
                });
            }

            workspaceId = workspace;
        }

        const project = await Project.create({
            name: name.trim(),
            description: description?.trim() ?? "",
            status: status ?? "planning",
            priority: priority ?? "medium",
            owner: req.userId,
            workspace: workspaceId,
        });

        return res.status(201).json({
            success: true,
            message: "Project created successfully.",
            project,
        });
    } catch (error) {
        next(error);
    }
}

export async function updateProject(req, res, next) {
    try {
        if (!validateProjectId(req, res)) return;

        const project = await findAccessibleProject(
            req.params.id,
            req.userId
        );

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found.",
            });
        }

        if (!(await canManageProject(project, req.userId))) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to update this project.",
            });
        }

        const { name, description, status, priority } = req.body;

        if (name !== undefined) project.name = name.trim();
        if (description !== undefined) project.description = description.trim();
        if (status !== undefined) project.status = status;
        if (priority !== undefined) project.priority = priority;

        await project.save();

        return res.status(200).json({
            success: true,
            message: "Project updated successfully.",
            project,
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteProject(req, res, next) {
    try {
        if (!validateProjectId(req, res)) return;

        const project = await findAccessibleProject(
            req.params.id,
            req.userId
        );

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found.",
            });
        }

        if (!(await canManageProject(project, req.userId))) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to delete this project.",
            });
        }

        const taskCount = await Task.countDocuments({
            project: project._id,
        });

        if (taskCount > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "This project contains tasks. Delete or move its tasks before deleting the project.",
                taskCount,
            });
        }

        await Project.deleteOne({ _id: project._id });

        return res.status(200).json({
            success: true,
            message: "Project deleted successfully.",
        });
    } catch (error) {
        next(error);
    }
}