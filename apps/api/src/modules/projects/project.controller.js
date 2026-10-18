
import mongoose from "mongoose";
import Project from "./project.model.js";

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

// GET /api/projects
export async function getProjects(req, res, next) {
  try {
    const projects = await Project.find({ owner: req.userId })
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

// GET /api/projects/:id
export async function getProject(req, res, next) {
  try {
    if (!validateProjectId(req, res)) return;

    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.userId,
    }).lean();

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

// POST /api/projects
export async function createProject(req, res, next) {
  try {
    const { name, description, status, priority } = req.body;

    const project = await Project.create({
      name: name.trim(),
      description: description?.trim() ?? "",
      status: status ?? "planning",
      priority: priority ?? "medium",
      owner: req.userId,
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

// PATCH /api/projects/:id
export async function updateProject(req, res, next) {
  try {
    if (!validateProjectId(req, res)) return;

    const updates = {};
    const { name, description, status, priority } = req.body;

    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update.",
      });
    }

    const project = await Project.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.userId,
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      project,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/projects/:id
export async function deleteProject(req, res, next) {
  try {
    if (!validateProjectId(req, res)) return;

    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Project deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}