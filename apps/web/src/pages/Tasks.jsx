
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

export default function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [members, setMembers] = useState([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [taskData, projectData] = await Promise.all([
                apiRequest("/api/tasks"),
                apiRequest("/api/projects"),
            ]);

            setTasks(taskData.tasks ?? []);
            setProjects(projectData.projects ?? []);
        } catch (err) {
            setError(err.message || "Could not load tasks.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

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

            const data = await apiRequest(
                editingId
                    ? `/api/tasks/${editingId}`
                    : "/api/tasks",
                {
                    method: editingId ? "PATCH" : "POST",
                    body: JSON.stringify(payload),
                }
            );

            if (editingId) {
                setTasks((current) =>
                    current.map((task) =>
                        task._id === editingId ? data.task : task
                    )
                );
                setNotice("Task updated successfully.");
            } else {
                setTasks((current) => [data.task, ...current]);
                setNotice("Task created successfully.");
            }

            setShowForm(false);
            setEditingId(null);
            setForm(emptyForm);
        } catch (err) {
            setError(err.message || "Could not save the task.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(task) {
        if (!window.confirm(`Delete "${task.title}"?`)) return;

        setError("");
        setNotice("");

        try {
            await apiRequest(`/api/tasks/${task._id}`, {
                method: "DELETE",
            });

            setTasks((current) =>
                current.filter((item) => item._id !== task._id)
            );

            setNotice("Task deleted successfully.");
        } catch (err) {
            setError(err.message || "Could not delete the task.");
        }
    }

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
                if (!cancelled) setMembers([]);
            }
        }

        loadMembers();

        return () => {
            cancelled = true;
        };
    }, [projects, form.project]);

    const visibleTasks =
        filter === "all"
            ? tasks
            : tasks.filter((task) => task.status === filter);

    return (
        <section className="tasks-page">
            <div className="projects-page-heading">
                <div>
                    <p className="page-eyebrow">WORKSPACE / TASKS</p>
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

            {error && <p className="form-error" role="alert">{error}</p>}
            {notice && <p className="project-notice" role="status">{notice}</p>}

            {projects.length === 0 && !loading && (
                <div className="panel task-empty">
                    <h2>Create a project first</h2>
                    <p className="muted">
                        Every task must belong to a project. Create one on the Projects page.
                    </p>
                </div>
            )}

            {showForm && (
                <form className="project-form panel" onSubmit={handleSubmit}>
                    <div className="panel-heading">
                        <div>
                            <h2>{editingId ? "Edit task" : "Create a task"}</h2>
                            <p>Add the details and choose a project.</p>
                        </div>
                    </div>

                    <label htmlFor="task-title">Task title</label>
                    <input
                        id="task-title"
                        value={form.title}
                        onChange={(e) =>
                            setForm({ ...form, title: e.target.value })
                        }
                        minLength={2}
                        maxLength={150}
                        required
                        placeholder="e.g. Build the login page"
                    />

                    <label htmlFor="task-description">Description</label>
                    <textarea
                        id="task-description"
                        value={form.description}
                        onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                        }
                        maxLength={2000}
                        rows={3}
                        placeholder="Describe the task..."
                    />

                    <label htmlFor="task-project">Project</label>
                    <select
                        id="task-project"
                        value={form.project}
                        onChange={(e) =>
                            setForm({ ...form, project: e.target.value })
                        }
                        required
                    >
                        <option value="">Choose a project</option>
                        {projects.map((project) => (
                            <option key={project._id} value={project._id}>
                                {project.name}
                            </option>
                        ))}
                    </select>

                    <label htmlFor="task-assignee">Assign to</label>
                    <select
                        id="task-assignee"
                        value={form.assignedTo}
                        onChange={(e) =>
                            setForm({ ...form, assignedTo: e.target.value })
                        }
                    >
                        <option value="">Unassigned</option>
                        {members.map((membership) => (
                            <option
                                key={membership.user._id}
                                value={membership.user._id}
                            >
                                {membership.user.name} ({membership.role})
                            </option>
                        ))}
                    </select>

                    <div className="project-form-row">
                        <div>
                            <label htmlFor="task-status">Status</label>
                            <select
                                id="task-status"
                                value={form.status}
                                onChange={(e) =>
                                    setForm({ ...form, status: e.target.value })
                                }
                            >
                                <option value="todo">To do</option>
                                <option value="in-progress">In progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="task-priority">Priority</label>
                            <select
                                id="task-priority"
                                value={form.priority}
                                onChange={(e) =>
                                    setForm({ ...form, priority: e.target.value })
                                }
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    <label htmlFor="task-due-date">Due date (optional)</label>
                    <input
                        id="task-due-date"
                        type="date"
                        value={form.dueDate}
                        onChange={(e) =>
                            setForm({ ...form, dueDate: e.target.value })
                        }
                    />

                    <div className="project-form-actions">
                        <button
                            className="secondary-action"
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                setEditingId(null);
                                setError("");
                            }}
                        >
                            Cancel
                        </button>

                        <button className="primary-action" disabled={saving}>
                            {saving
                                ? "Saving..."
                                : editingId
                                    ? "Save changes"
                                    : "Create task"}
                        </button>
                    </div>
                </form>
            )}

            <div className="task-filters">
                {[
                    ["all", "All tasks"],
                    ["todo", "To do"],
                    ["in-progress", "In progress"],
                    ["completed", "Completed"],
                ].map(([value, label]) => (
                    <button
                        key={value}
                        className={`task-filter ${filter === value ? "selected" : ""}`}
                        onClick={() => setFilter(value)}
                        type="button"
                    >
                        {label}
                        <span>
                            {value === "all"
                                ? tasks.length
                                : tasks.filter((task) => task.status === value).length}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="panel task-empty">Loading tasks...</div>
            ) : visibleTasks.length === 0 ? (
                <div className="panel task-empty">
                    <h2>No tasks found</h2>
                    <p className="muted">
                        Create a task or select a different filter.
                    </p>
                </div>
            ) : (
                <div className="task-list">
                    {visibleTasks.map((task) => (
                        <article className="panel task-card" key={task._id}>
                            <div className="task-card-main">
                                <div className="task-card-title">
                                    <h2>{task.title}</h2>
                                    <span className={`task-status status-${task.status}`}>
                                        {statusLabels[task.status]}
                                    </span>
                                </div>

                                <p className="real-project-description">
                                    {task.description || "No description provided."}
                                </p>

                                <div className="task-details">
                                    <span>
                                        Project:{" "}
                                        <strong>
                                            {task.project?.name || "Unknown project"}
                                        </strong>
                                    </span>
                                    <span>
                                        Priority:{" "}
                                        <strong className={`priority-${task.priority}`}>
                                            {task.priority}
                                        </strong>
                                    </span>
                                    <span>
                                        Due:{" "}
                                        <strong>
                                            {task.dueDate
                                                ? new Date(task.dueDate).toLocaleDateString()
                                                : "Not set"}
                                        </strong>
                                    </span>
                                    <span>
                                        Assigned to:{" "}
                                        <strong>{task.assignedTo?.name || "Unassigned"}</strong>
                                    </span>
                                </div>
                            </div>

                            <div className="task-card-actions">
                                <button
                                    className="secondary-action"
                                    onClick={() => startEdit(task)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="danger-action"
                                    onClick={() => handleDelete(task)}
                                >
                                    Delete
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}