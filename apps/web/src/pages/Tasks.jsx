
import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "../lib/api.js";

const emptyForm = {
  title: "",
  description: "",
  project: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
  assignedTo: "",
};

const statusLabels = {
  todo: "To do",
  "in-progress": "In progress",
  completed: "Completed",
};

const statusFilters = [
  ["all", "All tasks"],
  ["todo", "To do"],
  ["in-progress", "In progress"],
  ["completed", "Completed"],
];

const PAGE_SIZE = 10;

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Search and filters
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [priority, setPriority] = useState("");
  const [projectId, setProjectId] = useState("");

  // Sorting
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // --------------------------------------------------
  // Load projects
  // --------------------------------------------------

  const loadProjects = useCallback(async () => {
    try {
      const data = await apiRequest("/api/projects");

      setProjects(data.projects ?? []);
    } catch (err) {
      setError(err.message || "Could not load projects.");
    }
  }, []);

  // --------------------------------------------------
  // Load tasks using backend search/filter/sort/pagination
  // --------------------------------------------------

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      const trimmedSearch = search.trim();

      if (trimmedSearch) {
        params.set("search", trimmedSearch);
      }

      if (filter !== "all") {
        params.set("status", filter);
      }

      if (priority) {
        params.set("priority", priority);
      }

      if (projectId) {
        params.set("projectId", projectId);
      }

      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));

      const data = await apiRequest(
        `/api/tasks?${params.toString()}`
      );

      setTasks(data.tasks ?? []);

      setPagination(
        data.pagination ?? {
          page,
          limit: PAGE_SIZE,
          total: data.count ?? 0,
          totalPages: 0,
        }
      );
    } catch (err) {
      setError(err.message || "Could not load tasks.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [
    search,
    filter,
    priority,
    projectId,
    sortBy,
    sortOrder,
    page,
  ]);

  // --------------------------------------------------
  // Initial project loading
  // --------------------------------------------------

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // --------------------------------------------------
  // Reload tasks when query parameters change
  // --------------------------------------------------

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadTasks();
    }, search.trim() ? 300 : 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadTasks, search]);

  // --------------------------------------------------
  // Reset page when filters change
  // --------------------------------------------------

  useEffect(() => {
    setPage(1);
  }, [search, filter, priority, projectId, sortBy, sortOrder]);

  // --------------------------------------------------
  // Create task
  // --------------------------------------------------

  function startCreate() {
    setForm({
      ...emptyForm,
      project: projects[0]?._id ?? "",
    });

    setEditingId(null);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  // --------------------------------------------------
  // Edit task
  // --------------------------------------------------

  function startEdit(task) {
    setForm({
      title: task.title,
      description: task.description || "",
      project: task.project?._id ?? task.project ?? "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 10)
        : "",
      assignedTo: task.assignedTo?._id ?? task.assignedTo ?? "",
    });

    setEditingId(task._id);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  // --------------------------------------------------
  // Submit task
  // --------------------------------------------------

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        dueDate: form.dueDate || null,
        assignedTo: form.assignedTo || null,
      };

      const endpoint = editingId
        ? `/api/tasks/${editingId}`
        : "/api/tasks";

      const data = await apiRequest(endpoint, {
        method: editingId ? "PATCH" : "POST",

        // IMPORTANT:
        // apiRequest handles JSON serialization.
        // Send a plain object, not JSON.stringify(payload).
        body: payload,
      });

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);

      setNotice(
        editingId
          ? "Task updated successfully."
          : "Task created successfully."
      );

      // Reload to keep server pagination and filters accurate.
      await loadTasks();
    } catch (err) {
      setError(err.message || "Could not save the task.");
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // Delete task
  // --------------------------------------------------

  async function handleDelete(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) {
      return;
    }

    setDeletingId(task._id);
    setError("");
    setNotice("");

    try {
      await apiRequest(`/api/tasks/${task._id}`, {
        method: "DELETE",
      });

      setNotice("Task deleted successfully.");

      // Reload because deleting the last item on a page
      // may require updating the pagination.
      await loadTasks();
    } catch (err) {
      setError(err.message || "Could not delete the task.");
    } finally {
      setDeletingId(null);
    }
  }

  // --------------------------------------------------
  // Load workspace members for selected project
  // --------------------------------------------------

  useEffect(() => {
    const selectedProject = projects.find(
      (project) => project._id === form.project
    );

    const workspaceId =
      selectedProject?.workspace?._id ??
      selectedProject?.workspace ??
      null;

    if (!workspaceId) {
      setMembers([]);
      return;
    }

    let cancelled = false;

    async function loadMembers() {
      try {
        const data = await apiRequest(
          `/api/workspaces/${workspaceId}/members`
        );

        if (!cancelled) {
          setMembers(data.members ?? []);
        }
      } catch {
        if (!cancelled) {
          setMembers([]);
        }
      }
    }

    loadMembers();

    return () => {
      cancelled = true;
    };
  }, [projects, form.project]);

  // --------------------------------------------------
  // Change status filter
  // --------------------------------------------------

  function handleStatusFilter(value) {
    setFilter(value);
    setPage(1);
  }

  // --------------------------------------------------
  // Reset all filters
  // --------------------------------------------------

  function resetFilters() {
    setSearch("");
    setFilter("all");
    setPriority("");
    setProjectId("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  }

  // --------------------------------------------------
  // Pagination helpers
  // --------------------------------------------------

  const totalPages = pagination.totalPages ?? 0;

  const canGoPrevious = page > 1;

  const canGoNext = page < totalPages;

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <section className="tasks-page">
      {/* Page heading */}

      <div className="projects-page-heading">
        <div>
          <p className="page-eyebrow">
            WORKSPACE / TASKS
          </p>

          <h1>Tasks</h1>

          <p className="muted">
            Plan your work, track progress, and meet deadlines.
          </p>
        </div>

        <button
          className="primary-action"
          onClick={startCreate}
          disabled={projects.length === 0}
          title={
            projects.length === 0
              ? "Create a project before adding tasks"
              : ""
          }
        >
          + New task
        </button>
      </div>

      {/* Notifications */}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {notice && (
        <p className="project-notice" role="status">
          {notice}
        </p>
      )}

      {/* No projects */}

      {projects.length === 0 && !loading && (
        <div className="panel task-empty">
          <h2>Create a project first</h2>

          <p className="muted">
            Every task must belong to a project.
            Create one on the Projects page.
          </p>
        </div>
      )}

      {/* Task form */}

      {showForm && (
        <form
          className="project-form panel"
          onSubmit={handleSubmit}
        >
          <div className="panel-heading">
            <div>
              <h2>
                {editingId ? "Edit task" : "Create a task"}
              </h2>

              <p>
                Add the details and choose a project.
              </p>
            </div>
          </div>

          <label htmlFor="task-title">
            Task title
          </label>

          <input
            id="task-title"
            value={form.title}
            onChange={(event) =>
              setForm({
                ...form,
                title: event.target.value,
              })
            }
            minLength={2}
            maxLength={150}
            required
            placeholder="e.g. Build the login page"
          />

          <label htmlFor="task-description">
            Description
          </label>

          <textarea
            id="task-description"
            value={form.description}
            onChange={(event) =>
              setForm({
                ...form,
                description: event.target.value,
              })
            }
            maxLength={2000}
            rows={3}
            placeholder="Describe the task..."
          />

          <label htmlFor="task-project">
            Project
          </label>

          <select
            id="task-project"
            value={form.project}
            onChange={(event) =>
              setForm({
                ...form,
                project: event.target.value,
              })
            }
            required
          >
            <option value="">
              Choose a project
            </option>

            {projects.map((project) => (
              <option
                key={project._id}
                value={project._id}
              >
                {project.name}
              </option>
            ))}
          </select>

          <label htmlFor="task-assignee">
            Assign to
          </label>

          <select
            id="task-assignee"
            value={form.assignedTo}
            onChange={(event) =>
              setForm({
                ...form,
                assignedTo: event.target.value,
              })
            }
          >
            <option value="">
              Unassigned
            </option>

            {members.map((membership) => {
              const member = membership.user;

              if (!member?._id) {
                return null;
              }

              return (
                <option
                  key={member._id}
                  value={member._id}
                >
                  {member.name} ({membership.role})
                </option>
              );
            })}
          </select>

          <div className="project-form-row">
            <div>
              <label htmlFor="task-status">
                Status
              </label>

              <select
                id="task-status"
                value={form.status}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status: event.target.value,
                  })
                }
              >
                <option value="todo">
                  To do
                </option>

                <option value="in-progress">
                  In progress
                </option>

                <option value="completed">
                  Completed
                </option>
              </select>
            </div>

            <div>
              <label htmlFor="task-priority">
                Priority
              </label>

              <select
                id="task-priority"
                value={form.priority}
                onChange={(event) =>
                  setForm({
                    ...form,
                    priority: event.target.value,
                  })
                }
              >
                <option value="low">
                  Low
                </option>

                <option value="medium">
                  Medium
                </option>

                <option value="high">
                  High
                </option>
              </select>
            </div>
          </div>

          <label htmlFor="task-due-date">
            Due date (optional)
          </label>

          <input
            id="task-due-date"
            type="date"
            value={form.dueDate}
            onChange={(event) =>
              setForm({
                ...form,
                dueDate: event.target.value,
              })
            }
          />

          <div className="project-form-actions">
            <button
              className="secondary-action"
              type="button"
              disabled={saving}
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(emptyForm);
                setError("");
              }}
            >
              Cancel
            </button>

            <button
              className="primary-action"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Create task"}
            </button>
          </div>
        </form>
      )}

      {/* Search and filters */}

      <div className="panel task-toolbar">
        <div className="task-search">
          <label htmlFor="task-search">
            Search tasks
          </label>

          <input
            id="task-search"
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search title or description..."
            maxLength={100}
          />
        </div>

        <div className="task-filter-controls">
          <div>
            <label htmlFor="task-project-filter">
              Project
            </label>

            <select
              id="task-project-filter"
              value={projectId}
              onChange={(event) => {
                setProjectId(event.target.value);
                setPage(1);
              }}
            >
              <option value="">
                All projects
              </option>

              {projects.map((project) => (
                <option
                  key={project._id}
                  value={project._id}
                >
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="task-priority-filter">
              Priority
            </label>

            <select
              id="task-priority-filter"
              value={priority}
              onChange={(event) => {
                setPriority(event.target.value);
                setPage(1);
              }}
            >
              <option value="">
                All priorities
              </option>

              <option value="low">
                Low
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="high">
                High
              </option>
            </select>
          </div>

          <div>
            <label htmlFor="task-sort">
              Sort by
            </label>

            <select
              id="task-sort"
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value);
                setPage(1);
              }}
            >
              <option value="createdAt">
                Created date
              </option>

              <option value="updatedAt">
                Updated date
              </option>

              <option value="dueDate">
                Due date
              </option>

              <option value="priority">
                Priority
              </option>

              <option value="title">
                Title
              </option>
            </select>
          </div>

          <div>
            <label htmlFor="task-sort-order">
              Order
            </label>

            <select
              id="task-sort-order"
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value);
                setPage(1);
              }}
            >
              <option value="desc">
                Descending
              </option>

              <option value="asc">
                Ascending
              </option>
            </select>
          </div>

          <button
            type="button"
            className="secondary-action"
            onClick={resetFilters}
          >
            Reset filters
          </button>
        </div>
      </div>

      {/* Status tabs */}

      <div className="task-filters">
        {statusFilters.map(([value, label]) => (
          <button
            key={value}
            className={`task-filter ${
              filter === value ? "selected" : ""
            }`}
            onClick={() => handleStatusFilter(value)}
            type="button"
          >
            {label}

            <span>
              {filter === value
                ? pagination.total
                : ""}
            </span>
          </button>
        ))}
      </div>

      {/* Results summary */}

      {!loading && (
        <p className="muted">
          Showing {tasks.length} of {pagination.total} tasks
        </p>
      )}

      {/* Loading state */}

      {loading ? (
        <div className="panel task-empty">
          Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        /* Empty state */

        <div className="panel task-empty">
          <h2>No tasks found</h2>

          <p className="muted">
            {search ||
            filter !== "all" ||
            priority ||
            projectId
              ? "Try changing your search or filters."
              : "Create your first task to get started."}
          </p>

          {(search ||
            filter !== "all" ||
            priority ||
            projectId) && (
            <button
              type="button"
              className="secondary-action"
              onClick={resetFilters}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        /* Task list */

        <div className="task-list">
          {tasks.map((task) => (
            <article
              className="panel task-card"
              key={task._id}
            >
              <div className="task-card-main">
                <div className="task-card-title">
                  <h2>{task.title}</h2>

                  <span
                    className={`task-status status-${task.status}`}
                  >
                    {statusLabels[task.status] ??
                      task.status}
                  </span>
                </div>

                <p className="real-project-description">
                  {task.description ||
                    "No description provided."}
                </p>

                <div className="task-details">
                  <span>
                    Project:{" "}
                    <strong>
                      {task.project?.name ||
                        "Unknown project"}
                    </strong>
                  </span>

                  <span>
                    Priority:{" "}
                    <strong
                      className={`priority-${task.priority}`}
                    >
                      {task.priority}
                    </strong>
                  </span>

                  <span>
                    Due:{" "}
                    <strong>
                      {task.dueDate
                        ? new Date(
                            task.dueDate
                          ).toLocaleDateString()
                        : "Not set"}
                    </strong>
                  </span>

                  <span>
                    Assigned to:{" "}
                    <strong>
                      {task.assignedTo?.name ||
                        "Unassigned"}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="task-card-actions">
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => startEdit(task)}
                  disabled={deletingId === task._id}
                >
                  Edit
                </button>

                <button
                  className="danger-action"
                  type="button"
                  onClick={() => handleDelete(task)}
                  disabled={deletingId === task._id}
                >
                  {deletingId === task._id
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}

      {!loading && pagination.totalPages > 0 && (
        <div className="task-pagination">
          <button
            type="button"
            className="secondary-action"
            disabled={!canGoPrevious}
            onClick={() => {
              setPage((current) =>
                Math.max(1, current - 1)
              );
            }}
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            className="secondary-action"
            disabled={!canGoNext}
            onClick={() => {
              setPage((current) =>
                Math.min(totalPages, current + 1)
              );
            }}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}