
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../lib/api.js";

const emptyForm = {
    name: "",
    description: "",
    status: "planning",
    priority: "medium",
    workspace: "",
};

const statuses = [
    "planning",
    "active",
    "on-hold",
    "completed",
];

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [workspaces, setWorkspaces] = useState([]);

    const loadProjects = useCallback(async () => {
        setLoading(true);
        setError("");
        const [projectData, workspaceData] = await Promise.all([
            apiRequest("/api/projects"),
            apiRequest("/api/workspaces"),
        ]);

        setProjects(projectData.projects ?? []);
        setWorkspaces(workspaceData.workspaces ?? []);

        try {
            const data = await apiRequest("/api/projects");
            setProjects(data.projects);
        } catch (err) {
            setError(err.message || "Could not load projects.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    function startCreate() {
        setForm(emptyForm);
        setEditingId(null);
        setError("");
        setNotice("");
        setShowForm(true);
    }

    function startEdit(project) {
        setForm({
            name: project.name,
            description: project.description || "",
            status: project.status,
            priority: project.priority,
            workspace: project.workspace?._id ?? project.workspace ?? "",
        });
        setEditingId(project._id);
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
            const endpoint = editingId
                ? `/api/projects/${editingId}`
                : "/api/projects";

            const data = await apiRequest(endpoint, {
                method: editingId ? "PATCH" : "POST",
                body: JSON.stringify({
                    ...form,
                    name: form.name.trim(),
                    description: form.description.trim(),
                    workspace: form.workspace || null,
                }),
            });

            if (editingId) {
                setProjects((current) =>
                    current.map((project) =>
                        project._id === editingId ? data.project : project
                    )
                );
                setNotice("Project updated successfully.");
            } else {
                setProjects((current) => [data.project, ...current]);
                setNotice("Project created successfully.");
            }

            setShowForm(false);
            setForm(emptyForm);
            setEditingId(null);
        } catch (err) {
            setError(err.message || "Could not save the project.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(project) {
        const confirmed = window.confirm(
            `Delete "${project.name}"? This cannot be undone.`
        );

        if (!confirmed) return;

        setError("");
        setNotice("");

        try {
            await apiRequest(`/api/projects/${project._id}`, {
                method: "DELETE",
            });

            setProjects((current) =>
                current.filter((item) => item._id !== project._id)
            );
            setNotice("Project deleted successfully.");
        } catch (err) {
            setError(err.message || "Could not delete the project.");
        }
    }

    return (
        <section className="projects-page">
            <div className="projects-page-heading">
                <div>
                    <p className="page-eyebrow">WORKSPACE / PROJECTS</p>
                    <h1>Projects</h1>
                    <p className="muted">
                        Organize your work and keep track of progress.
                    </p>
                </div>

                <button className="primary-action" onClick={startCreate}>
                    + New project
                </button>
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}
            {notice && <p className="project-notice" role="status">{notice}</p>}

            {showForm && (
                <form className="project-form panel" onSubmit={handleSubmit}>
                    <div className="panel-heading">
                        <div>
                            <h2>{editingId ? "Edit project" : "Create a project"}</h2>
                            <p>Enter the details for this workspace project.</p>
                        </div>
                    </div>

                    <label htmlFor="project-name">Project name</label>
                    <input
                        id="project-name"
                        value={form.name}
                        onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                        }
                        minLength={2}
                        maxLength={100}
                        required
                        placeholder="e.g. Website Redesign"
                    />

                    <label htmlFor="project-description">Description</label>
                    <textarea
                        id="project-description"
                        value={form.description}
                        onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                        }
                        maxLength={1000}
                        rows={3}
                        placeholder="What is this project about?"
                    />

                    <label htmlFor="project-workspace">Workspace</label>
                    <select
                        id="project-workspace"
                        value={form.workspace}
                        onChange={(e) =>
                            setForm({ ...form, workspace: e.target.value })
                        }
                    >
                        <option value="">Personal project</option>
                        {workspaces.map((workspace) => (
                            <option key={workspace._id} value={workspace._id}>
                                {workspace.name}
                            </option>
                        ))}
                    </select>

                    <div className="project-form-row">
                        <div>
                            <label htmlFor="project-status">Status</label>
                            <select
                                id="project-status"
                                value={form.status}
                                onChange={(e) =>
                                    setForm({ ...form, status: e.target.value })
                                }
                            >
                                {statuses.map((status) => (
                                    <option value={status} key={status}>
                                        {status.replace("-", " ")}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="project-priority">Priority</label>
                            <select
                                id="project-priority"
                                value={form.priority}
                                onChange={(e) =>
                                    setForm({ ...form, priority: e.target.value })
                                }
                            >
                                {["low", "medium", "high"].map((priority) => (
                                    <option value={priority} key={priority}>
                                        {priority}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="project-form-actions">
                        <button
                            className="secondary-action"
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                setEditingId(null);
                                setForm(emptyForm);
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
                                    : "Create project"}
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="panel projects-empty">Loading projects...</div>
            ) : projects.length === 0 ? (
                <div className="panel projects-empty">
                    <div className="placeholder-icon">◫</div>
                    <h2>No projects yet</h2>
                    <p className="muted">
                        Create your first project to get started.
                    </p>
                    <button className="primary-action" onClick={startCreate}>
                        Create your first project
                    </button>
                </div>
            ) : (
                <div className="projects-card-grid">
                    {projects.map((project) => (
                        <article className="panel real-project-card" key={project._id}>
                            <div className="real-project-top">
                                <div className="project-mark mark-violet">
                                    {project.name.charAt(0).toUpperCase()}
                                </div>
                                <span className={`project-status-pill status-${project.status}`}>
                                    {project.status.replace("-", " ")}
                                </span>
                            </div>

                            <h2>{project.name}</h2>
                            <p className="real-project-description">
                                {project.description || "No description provided."}
                            </p>

                            <div className="real-project-meta">
                                <span>Priority</span>
                                <strong>{project.priority}</strong>
                            </div>

                            <div className="real-project-meta">
                                <span>Created</span>
                                <strong>
                                    {new Date(project.createdAt).toLocaleDateString()}
                                </strong>
                            </div>

                            <div className="real-project-actions">
                                <button
                                    className="secondary-action"
                                    onClick={() => startEdit(project)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="danger-action"
                                    onClick={() => handleDelete(project)}
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