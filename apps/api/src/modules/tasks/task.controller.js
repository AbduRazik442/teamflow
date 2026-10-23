
import mongoose from "mongoose";
import Task from "./task.model.js";
import Project from "../projects/project.model.js";
import User from "../users/user.model.js";
import Membership from "../workspaces/membership.model.js";
import { canManageProject } from "../workspaces/workspaceAccess.js";

function validId(id) {
    return mongoose.isValidObjectId(id);
}

async function findAccessibleProject(projectId, userId) {
    if (!validId(projectId)) return null;

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

async function validateAssignee(assignedTo, project) {
    if (!assignedTo) return null;

    if (!validId(assignedTo)) {
        return { error: "Invalid assignee ID." };
    }

    const user = await User.findById(assignedTo).select("_id");

    if (!user) {
        return { error: "Assignee not found." };
    }

    if (project.workspace) {
        const membership = await Membership.findOne({
            workspace: project.workspace,
            user: assignedTo,
            status: "active",
        });

        if (!membership) {
            return {
                error: "Assignee must be an active member of the project workspace.",
            };
        }
    } else if (assignedTo.toString() !== project.owner.toString()) {
        return {
            error: "Personal project tasks can only be assigned to the project owner.",
        };
    }

    return { userId: user._id };
}

async function getVisibleProjectIds(userId) {
    const memberships = await Membership.find({
        user: userId,
        status: "active",
    })
        .select("workspace")
        .lean();

    const workspaceIds = memberships.map((item) => item.workspace);

    const projects = await Project.find({
        $or: [
            { owner: userId, workspace: null },
            { owner: userId, workspace: { $exists: false } },
            { workspace: { $in: workspaceIds } },
        ],
    })
        .select("_id")
        .lean();

    return projects.map((project) => project._id);
}


export async function getTasks(req, res, next) {
    try {
        // 1. Get projects accessible to the authenticated user
        const projectIds = await getVisibleProjectIds(req.userId);

        // 2. Base filter: only tasks from accessible projects
        const filter = {
            project: {
                $in: projectIds,
            },
        };

        // 3. Filter by project ID
        if (req.query.projectId) {
            if (!validId(req.query.projectId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid project ID.",
                });
            }

            const requestedProjectId = req.query.projectId;

            const accessibleProjectIds = projectIds.filter(
                (id) => id.toString() === requestedProjectId
            );

            // Prevent accessing projects outside the user's permissions
            if (accessibleProjectIds.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Project not found.",
                });
            }

            filter.project = {
                $in: accessibleProjectIds,
            };
        }

        // 4. Filter by status
        if (req.query.status) {
            const allowedStatuses = [
                "todo",
                "in-progress",
                "completed",
            ];

            if (!allowedStatuses.includes(req.query.status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid task status.",
                });
            }

            filter.status = req.query.status;
        }

        // 5. Filter by priority
        if (req.query.priority) {
            const allowedPriorities = [
                "low",
                "medium",
                "high",
            ];

            if (!allowedPriorities.includes(req.query.priority)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid task priority.",
                });
            }

            filter.priority = req.query.priority;
        }

        // 6. Search by task title or description
        if (req.query.search) {
            const search = req.query.search.trim();

            if (search.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: "Search cannot exceed 100 characters.",
                });
            }

            if (search) {
                // Escape regex characters to prevent unintended patterns
                const escapedSearch = search.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                );

                filter.$or = [
                    {
                        title: {
                            $regex: escapedSearch,
                            $options: "i",
                        },
                    },
                    {
                        description: {
                            $regex: escapedSearch,
                            $options: "i",
                        },
                    },
                ];
            }
        }

        // 7. Pagination
        const page = Math.max(
            1,
            Number.parseInt(req.query.page, 10) || 1
        );

        const limit = Math.min(
            100,
            Math.max(
                1,
                Number.parseInt(req.query.limit, 10) || 10
            )
        );

        const skip = (page - 1) * limit;

        // 8. Sorting
        const allowedSortFields = [
            "createdAt",
            "updatedAt",
            "dueDate",
            "priority",
            "title",
        ];

        const sortBy = allowedSortFields.includes(req.query.sortBy)
            ? req.query.sortBy
            : "createdAt";

        const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

        const sort = {
            [sortBy]: sortOrder,
            _id: sortOrder,
        };

        // 9. Get total matching tasks
        const total = await Task.countDocuments(filter);

        // 10. Fetch paginated tasks
        const tasks = await Task.find(filter)
            .populate("project", "name workspace owner")
            .populate("assignedTo", "name email")
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        // 11. Return response
        return res.status(200).json({
            success: true,
            count: tasks.length,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            tasks,
        });
    } catch (error) {
        next(error);
    }
}

export async function getTask(req, res, next) {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID.",
            });
        }

        const task = await Task.findById(req.params.id)
            .populate("project", "name workspace owner")
            .populate("assignedTo", "name email")
            .lean();

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found.",
            });
        }

        const project = await findAccessibleProject(
            task.project._id,
            req.userId
        );

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Task not found.",
            });
        }

        return res.status(200).json({
            success: true,
            task,
        });
    } catch (error) {
        next(error);
    }
}


export async function createTask(req, res, next) {
    try {
        const {
            title,
            description,
            status,
            priority,
            dueDate,
            project: projectId,
            assignedTo,
        } = req.body;

        const project = await findAccessibleProject(
            projectId,
            req.userId
        );

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found.",
            });
        }

        // Only authorized managers can create tasks
        // in shared projects.
        if (
            project.workspace &&
            !(await canManageProject(project, req.userId))
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have permission to create tasks in this project.",
            });
        }

        // Validate the assigned user.
        const assignment = await validateAssignee(
            assignedTo,
            project
        );

        if (assignment?.error) {
            return res.status(400).json({
                success: false,
                message: assignment.error,
            });
        }

        const task = await Task.create({
            title: title.trim(),
            description: description?.trim() ?? "",
            status: status ?? "todo",
            priority: priority ?? "medium",
            dueDate: dueDate || null,
            project: project._id,
            owner: req.userId,
            assignedTo: assignment?.userId ?? null,
        });

        await task.populate("project", "name workspace owner");
        await task.populate("assignedTo", "name email");

        return res.status(201).json({
            success: true,
            message: "Task created successfully.",
            task,
        });
    } catch (error) {
        next(error);
    }
}

export async function updateTask(req, res, next) {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID.",
            });
        }

        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found.",
            });
        }

        const currentProject = await findAccessibleProject(
            task.project,
            req.userId
        );

        if (!currentProject) {
            return res.status(404).json({
                success: false,
                message: "Task not found.",
            });
        }

        if (
            currentProject.workspace &&
            !(await canManageProject(currentProject, req.userId))
        ) {
            const isAssignee =
                task.assignedTo?.toString() === req.userId.toString();

            const onlyUpdatingStatus =
                Object.keys(req.body).length === 1 &&
                Object.hasOwn(req.body, "status");

            if (!isAssignee || !onlyUpdatingStatus) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You can only update the status of a task assigned to you.",
                });
            }
        }

        const {
            title,
            description,
            status,
            priority,
            dueDate,
            project: projectId,
            assignedTo,
        } = req.body;

        let targetProject = currentProject;

        if (projectId !== undefined) {
            targetProject = await findAccessibleProject(
                projectId,
                req.userId
            );

            if (!targetProject) {
                return res.status(404).json({
                    success: false,
                    message: "Target project not found.",
                });
            }

            if (
                targetProject.workspace &&
                !(await canManageProject(targetProject, req.userId))
            ) {
                return res.status(403).json({
                    success: false,
                    message: "You cannot move tasks into this project.",
                });
            }

            if (
                currentProject.workspace?.toString() !==
                targetProject.workspace?.toString()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Moving tasks between personal and shared projects or between workspaces is not supported.",
                });
            }

            task.project = targetProject._id;
        }

        if (title !== undefined) task.title = title.trim();

        if (description !== undefined) {
            task.description = description.trim();
        }

        if (status !== undefined) task.status = status;
        if (priority !== undefined) task.priority = priority;

        if (dueDate !== undefined) {
            task.dueDate = dueDate || null;
        }

        if (assignedTo !== undefined) {
            const assignment = await validateAssignee(
                assignedTo,
                targetProject
            );

            if (assignment?.error) {
                return res.status(400).json({
                    success: false,
                    message: assignment.error,
                });
            }

            task.assignedTo = assignment?.userId ?? null;
        }

        await task.save();
        await task.populate("project", "name workspace owner");
        await task.populate("assignedTo", "name email");

        return res.status(200).json({
            success: true,
            message: "Task updated successfully.",
            task,
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteTask(req, res, next) {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID.",
            });
        }

        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found.",
            });
        }

        const project = await findAccessibleProject(
            task.project,
            req.userId
        );

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Task not found.",
            });
        }

        if (
            project.workspace &&
            !(await canManageProject(project, req.userId))
        ) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to delete tasks in this project.",
            });
        }

        await Task.deleteOne({ _id: task._id });

        return res.status(200).json({
            success: true,
            message: "Task deleted successfully.",
        });
    } catch (error) {
        next(error);
    }
}