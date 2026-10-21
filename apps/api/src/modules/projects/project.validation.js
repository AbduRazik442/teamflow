
const allowedStatuses = [
    "planning",
    "active",
    "on-hold",
    "completed",
];

const allowedPriorities = ["low", "medium", "high"];

export function validateProject(req, res, next) {
    const { name, description, status, priority, workspace } = req.body ?? {};

    if (req.method === "POST" || name !== undefined) {
        if (
            typeof name !== "string" ||
            name.trim().length < 2 ||
            name.trim().length > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Project name must be between 2 and 100 characters.",
            });
        }
    }

    if (
        description !== undefined &&
        (typeof description !== "string" || description.length > 1000)
    ) {
        return res.status(400).json({
            success: false,
            message: "Description must not exceed 1000 characters.",
        });
    }

    if (status !== undefined && !allowedStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid project status.",
        });
    }

    if (priority !== undefined && !allowedPriorities.includes(priority)) {
        return res.status(400).json({
            success: false,
            message: "Invalid project priority.",
        });
    }

    if (
        req.method === "PATCH" &&
        name === undefined &&
        description === undefined &&
        status === undefined &&
        priority === undefined
    ) {
        return res.status(400).json({
            success: false,
            message: "Provide at least one field to update.",
        });
    }

    if (
        workspace !== undefined &&
        workspace !== null &&
        workspace !== "" &&
        typeof workspace !== "string"
    ) {
        return res.status(400).json({
            success: false,
            message: "Workspace must be a valid workspace ID.",
        });
    }

    next();
}