
import mongoose from "mongoose";
import Task from "./task.model.js";
import Project from "../projects/project.model.js";

function validId(id) {
  return mongoose.isValidObjectId(id);
}

async function findOwnedProject(projectId, ownerId) {
  if (!validId(projectId)) return null;

  return Project.findOne({
    _id: projectId,
    owner: ownerId,
  });
}

export async function getTasks(req, res, next) {
  try {
    const filter = { owner: req.userId };

    if (req.query.projectId) {
      if (!validId(req.query.projectId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid project ID.",
        });
      }

      filter.project = req.query.projectId;
    }

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

    const tasks = await Task.find(filter)
      .populate("project", "name")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: tasks.length,
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

    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.userId,
    })
      .populate("project", "name")
      .lean();

    if (!task) {
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
    } = req.body;

    const project = await findOwnedProject(
      projectId,
      req.userId
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
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
    });

    await task.populate("project", "name");

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

    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    const {
      title,
      description,
      status,
      priority,
      dueDate,
      project: projectId,
    } = req.body;

    if (projectId !== undefined) {
      const project = await findOwnedProject(
        projectId,
        req.userId
      );

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found.",
        });
      }

      task.project = project._id;
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

    await task.save();
    await task.populate("project", "name");

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

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}