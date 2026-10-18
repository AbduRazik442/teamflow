
import Project from "../projects/project.model.js";
import Task from "../tasks/task.model.js";

export async function getDashboardStats(req, res, next) {
  try {
    const owner = req.userId;

    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      todoTasks,
      inProgressTasks,
      completedTasks,
      highPriorityTasks,
      overdueTasks,
      recentTasks,
      recentProjects,
    ] = await Promise.all([
      Project.countDocuments({ owner }),

      Project.countDocuments({
        owner,
        status: "active",
      }),

      Project.countDocuments({
        owner,
        status: "completed",
      }),

      Task.countDocuments({ owner }),

      Task.countDocuments({
        owner,
        status: "todo",
      }),

      Task.countDocuments({
        owner,
        status: "in-progress",
      }),

      Task.countDocuments({
        owner,
        status: "completed",
      }),

      Task.countDocuments({
        owner,
        priority: "high",
        status: { $ne: "completed" },
      }),

      Task.countDocuments({
        owner,
        status: { $ne: "completed" },
        dueDate: { $lt: new Date() },
      }),

      Task.find({ owner })
        .populate("project", "name")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      Project.find({ owner })
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const completionRate =
      totalTasks === 0
        ? 0
        : Math.round((completedTasks / totalTasks) * 100);

    return res.status(200).json({
      success: true,
      stats: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalTasks,
        todoTasks,
        inProgressTasks,
        completedTasks,
        highPriorityTasks,
        overdueTasks,
        completionRate,
      },
      recentTasks,
      recentProjects,
    });
  } catch (error) {
    next(error);
  }
}