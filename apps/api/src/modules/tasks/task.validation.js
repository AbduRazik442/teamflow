
const allowedStatuses = ["todo", "in-progress", "completed"];
const allowedPriorities = ["low", "medium", "high"];

export function validateTask(req, res, next) {
    const {
        title,
        description,
        status,
        priority,
        dueDate,
        project,
        assignedTo,
    } = req.body ?? {};

    if (
        req.method === "POST" &&
        (typeof title !== "string" ||
            title.trim().length < 2 ||
            title.trim().length > 150)
    ) {
        return res.status(400).json({
            success: false,
            message: "Task title must be between 2 and 150 characters.",
        });
    }

    if (
        req.method === "PATCH" &&
        title !== undefined &&
        (typeof title !== "string" ||
            title.trim().length < 2 ||
            title.trim().length > 150)
    ) {
        return res.status(400).json({
            success: false,
            message: "Task title must be between 2 and 150 characters.",
        });
    }

    if (
        description !== undefined &&
        (typeof description !== "string" ||
            description.length > 2000)
    ) {
        return res.status(400).json({
            success: false,
            message: "Description cannot exceed 2000 characters.",
        });
    }

    if (
        status !== undefined &&
        !allowedStatuses.includes(status)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid task status.",
        });
    }

    if (
        priority !== undefined &&
        !allowedPriorities.includes(priority)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid task priority.",
        });
    }

    if (
        dueDate !== undefined &&
        dueDate !== null &&
        (typeof dueDate !== "string" ||
            dueDate.trim() === "" ||
            Number.isNaN(Date.parse(dueDate)))
    ) {
        return res.status(400).json({
            success: false,
            message: "Provide a valid due date or null.",
        });
    }

    if (
        req.method === "POST" &&
        (typeof project !== "string" || !project.trim())
    ) {
        return res.status(400).json({
            success: false,
            message: "A project is required.",
        });
    }

    const hasUpdate =
        title !== undefined ||
        description !== undefined ||
        status !== undefined ||
        priority !== undefined ||
        dueDate !== undefined ||
        project !== undefined;

    if (req.method === "PATCH" && !hasUpdate) {
        return res.status(400).json({
            success: false,
            message: "Provide at least one field to update.",
        });
    }

    if (
        assignedTo !== undefined &&
        assignedTo !== null &&
        (typeof assignedTo !== "string" || !assignedTo.trim())
    ) {
        return res.status(400).json({
            success: false,
            message: "Assigned user must be a valid user ID or null.",
        });
    }

    next();
}