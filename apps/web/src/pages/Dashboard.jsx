
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/api.js";

const initialStats = {
  totalProjects: 0,
  activeProjects: 0,
  completedProjects: 0,
  totalTasks: 0,
  todoTasks: 0,
  inProgressTasks: 0,
  completedTasks: 0,
  highPriorityTasks: 0,
  overdueTasks: 0,
  completionRate: 0,
};

const taskStatusLabels = {
  todo: "To do",
  "in-progress": "In progress",
  completed: "Completed",
};

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Dashboard() {
  const [stats, setStats] = useState(initialStats);
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/api/dashboard/stats");

      setStats({ ...initialStats, ...data.stats });
      setRecentTasks(data.recentTasks ?? []);
      setRecentProjects(data.recentProjects ?? []);
    } catch (err) {
      setError(err.message || "Could not load dashboard analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const metricCards = [
    {
      label: "Total projects",
      value: stats.totalProjects,
      detail: `${stats.activeProjects} active`,
      icon: "▦",
      tone: "violet",
    },
    {
      label: "Total tasks",
      value: stats.totalTasks,
      detail: `${stats.todoTasks} to do`,
      icon: "☷",
      tone: "blue",
    },
    {
      label: "Completed tasks",
      value: stats.completedTasks,
      detail: `${stats.completionRate}% completion`,
      icon: "✓",
      tone: "green",
    },
    {
      label: "Overdue tasks",
      value: stats.overdueTasks,
      detail: `${stats.highPriorityTasks} high priority unfinished`,
      icon: "◷",
      tone: "orange",
    },
  ];

  return (
    <section className="dashboard-page">
      <div className="dashboard-page-heading">
        <div>
          <p className="page-eyebrow">WORKSPACE / OVERVIEW</p>
          <h1>Dashboard</h1>
          <p className="muted">
            Here's an overview of your projects and work.
          </p>
        </div>

        <button
          className="secondary-action"
          onClick={loadDashboard}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {error && (
        <div className="dashboard-error" role="alert">
          <span>{error}</span>
          <button onClick={loadDashboard}>Try again</button>
        </div>
      )}

      <div className="dashboard-metric-grid">
        {metricCards.map((metric) => (
          <article className="panel dashboard-metric" key={metric.label}>
            <div className="dashboard-metric-top">
              <span className="dashboard-metric-label">
                {metric.label}
              </span>
              <span
                className={`dashboard-metric-icon tone-${metric.tone}`}
                aria-hidden="true"
              >
                {metric.icon}
              </span>
            </div>

            <strong className="dashboard-metric-value">
              {loading ? "—" : metric.value}
            </strong>

            <span className="dashboard-metric-detail">
              {loading ? "Loading data..." : metric.detail}
            </span>
          </article>
        ))}
      </div>

      <div className="dashboard-content-grid">
        <section className="panel dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>Task progress</h2>
              <p className="muted">Your current workload</p>
            </div>
            <Link to="/tasks">View tasks →</Link>
          </div>

          <div className="dashboard-progress-summary">
            <strong>
              {loading ? "—" : `${stats.completionRate}%`}
            </strong>
            <span>of all tasks completed</span>
          </div>

          <div
            className="dashboard-progress-track"
            role="progressbar"
            aria-label="Task completion"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={loading ? 0 : stats.completionRate}
          >
            <div
              className="dashboard-progress-fill"
              style={{
                width: `${loading ? 0 : stats.completionRate}%`,
              }}
            />
          </div>

          <div className="dashboard-status-list">
            <div>
              <span><i className="status-dot dot-todo" /> To do</span>
              <strong>{loading ? "—" : stats.todoTasks}</strong>
            </div>
            <div>
              <span>
                <i className="status-dot dot-progress" /> In progress
              </span>
              <strong>{loading ? "—" : stats.inProgressTasks}</strong>
            </div>
            <div>
              <span>
                <i className="status-dot dot-completed" /> Completed
              </span>
              <strong>{loading ? "—" : stats.completedTasks}</strong>
            </div>
          </div>
        </section>

        <section className="panel dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>Recent projects</h2>
              <p className="muted">Your latest project activity</p>
            </div>
            <Link to="/projects">View all →</Link>
          </div>

          {loading ? (
            <p className="muted">Loading projects...</p>
          ) : recentProjects.length === 0 ? (
            <div className="dashboard-empty">
              <p>No projects yet.</p>
              <Link to="/projects">Create your first project →</Link>
            </div>
          ) : (
            <div className="dashboard-recent-list">
              {recentProjects.map((project) => (
                <div className="dashboard-recent-item" key={project._id}>
                  <div className="dashboard-recent-mark">
                    {project.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="dashboard-recent-info">
                    <strong>{project.name}</strong>
                    <span>
                      Updated {formatDate(project.updatedAt)}
                    </span>
                  </div>

                  <span
                    className={`project-status-pill status-${project.status}`}
                  >
                    {project.status.replace("-", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel dashboard-section dashboard-recent-tasks">
          <div className="dashboard-section-heading">
            <div>
              <h2>Recent tasks</h2>
              <p className="muted">The latest tasks you've created</p>
            </div>
            <Link to="/tasks">View all →</Link>
          </div>

          {loading ? (
            <p className="muted">Loading tasks...</p>
          ) : recentTasks.length === 0 ? (
            <div className="dashboard-empty">
              <p>No tasks yet.</p>
              <Link to="/tasks">Create your first task →</Link>
            </div>
          ) : (
            <div className="dashboard-recent-list">
              {recentTasks.map((task) => (
                <div className="dashboard-recent-item" key={task._id}>
                  <div className="dashboard-task-check">
                    {task.status === "completed" ? "✓" : "○"}
                  </div>

                  <div className="dashboard-recent-info">
                    <strong>{task.title}</strong>
                    <span>
                      {task.project?.name || "Unknown project"}
                      {" · "}
                      {formatDate(task.createdAt)}
                    </span>
                  </div>

                  <span
                    className={`task-status status-${task.status}`}
                  >
                    {taskStatusLabels[task.status] || task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}