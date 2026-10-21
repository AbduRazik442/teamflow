
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../lib/api.js";

export default function Workspaces() {
    const [workspaces, setWorkspaces] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [members, setMembers] = useState([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("member");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [invitation, setInvitation] = useState(null);
    const [acceptId, setAcceptId] = useState("");

    const selectedWorkspace = workspaces.find(
        (workspace) => workspace._id === selectedId
    );

    const loadWorkspaces = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const data = await apiRequest("/api/workspaces");
            const items = data.workspaces ?? [];

            setWorkspaces(items);

            setSelectedId((current) =>
                items.some((item) => item._id === current)
                    ? current
                    : items[0]?._id ?? ""
            );
        } catch (err) {
            setError(err.message || "Could not load workspaces.");
        } finally {
            setLoading(false);
        }
    }, []);

    const loadMembers = useCallback(async () => {
        if (!selectedId) {
            setMembers([]);
            return;
        }

        try {
            const data = await apiRequest(
                `/api/workspaces/${selectedId}/members`
            );
            setMembers(data.members ?? []);
        } catch (err) {
            setError(err.message || "Could not load workspace members.");
        }
    }, [selectedId]);

    useEffect(() => {
        loadWorkspaces();
    }, [loadWorkspaces]);

    useEffect(() => {
        loadMembers();
    }, [loadMembers]);

    async function handleCreate(event) {
        event.preventDefault();
        setSaving(true);
        setError("");
        setNotice("");

        try {
            const data = await apiRequest("/api/workspaces", {
                method: "POST",
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim(),
                }),
            });

            setWorkspaces((current) => [data.workspace, ...current]);
            setSelectedId(data.workspace._id);
            setName("");
            setDescription("");
            setNotice("Workspace created successfully.");
        } catch (err) {
            setError(err.message || "Could not create workspace.");
        } finally {
            setSaving(false);
        }
    }

    async function handleInvite(event) {
        event.preventDefault();

        if (!selectedId) return;

        setSaving(true);
        setError("");
        setNotice("");
        setInvitation(null);

        try {
            const data = await apiRequest(
                `/api/workspaces/${selectedId}/invitations`,
                {
                    method: "POST",
                    body: JSON.stringify({ email: email.trim(), role }),
                }
            );

            setInvitation(data.invitation);
            setEmail("");
            setNotice(data.message || "Invitation created.");
        } catch (err) {
            setError(err.message || "Could not create invitation.");
        } finally {
            setSaving(false);
        }
    }

    async function handleAcceptInvitation(event) {
        event.preventDefault();
        setSaving(true);
        setError("");
        setNotice("");

        try {
            const data = await apiRequest(
                `/api/workspaces/invitations/${acceptId.trim()}/accept`,
                { method: "POST" }
            );

            setAcceptId("");
            setNotice(data.message || "Invitation accepted.");
            await loadWorkspaces();
        } catch (err) {
            setError(err.message || "Could not accept invitation.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="workspaces-page">
            <div className="projects-page-heading">
                <div>
                    <p className="page-eyebrow">WORKSPACE / TEAM</p>
                    <h1>Team workspaces</h1>
                    <p className="muted">
                        Create workspaces and manage your team members.
                    </p>
                </div>

                <button
                    className="secondary-action"
                    type="button"
                    onClick={() => {
                        loadWorkspaces();
                        if (selectedId) loadMembers();
                    }}
                    disabled={loading}
                >
                    Refresh
                </button>
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}
            {notice && <p className="project-notice" role="status">{notice}</p>}

            <div className="workspace-layout">
                <div className="workspace-main">
                    <form className="panel project-form" onSubmit={handleCreate}>
                        <div className="panel-heading">
                            <div>
                                <h2>Create a workspace</h2>
                                <p>Start a shared space for a team or project group.</p>
                            </div>
                        </div>

                        <label htmlFor="workspace-name">Workspace name</label>
                        <input
                            id="workspace-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            minLength={2}
                            maxLength={100}
                            required
                            placeholder="e.g. Product Development"
                        />

                        <label htmlFor="workspace-description">Description</label>
                        <textarea
                            id="workspace-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={500}
                            rows={3}
                            placeholder="What will this team work on?"
                        />

                        <button className="primary-action" disabled={saving}>
                            {saving ? "Saving..." : "Create workspace"}
                        </button>
                    </form>

                    <section className="panel workspace-panel">
                        <div className="panel-heading">
                            <div>
                                <h2>Your workspaces</h2>
                                <p>Select a workspace to view its members.</p>
                            </div>
                        </div>

                        {loading ? (
                            <p className="muted">Loading workspaces...</p>
                        ) : workspaces.length === 0 ? (
                            <p className="muted">You haven't joined a workspace yet.</p>
                        ) : (
                            <div className="workspace-list">
                                {workspaces.map((workspace) => (
                                    <button
                                        type="button"
                                        key={workspace._id}
                                        className={`workspace-list-item ${selectedId === workspace._id ? "selected" : ""
                                            }`}
                                        onClick={() => setSelectedId(workspace._id)}
                                    >
                                        <span className="workspace-avatar">
                                            {workspace.name.charAt(0).toUpperCase()}
                                        </span>
                                        <span className="workspace-list-info">
                                            <strong>{workspace.name}</strong>
                                            <small>
                                                {workspace.membershipRole || "member"}
                                            </small>
                                        </span>
                                        <span aria-hidden="true">›</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <div className="workspace-main">
                    <section className="panel workspace-panel">
                        <div className="panel-heading">
                            <div>
                                <h2>
                                    {selectedWorkspace
                                        ? selectedWorkspace.name
                                        : "Workspace members"}
                                </h2>
                                <p>People who have access to this workspace.</p>
                            </div>
                        </div>

                        {!selectedWorkspace ? (
                            <p className="muted">Create or select a workspace first.</p>
                        ) : members.length === 0 ? (
                            <p className="muted">No active members found.</p>
                        ) : (
                            <div className="workspace-list">
                                {members.map((membership) => (
                                    <div className="workspace-list-item" key={membership._id}>
                                        <span className="workspace-avatar">
                                            {membership.user?.name?.charAt(0).toUpperCase() || "U"}
                                        </span>
                                        <span className="workspace-list-info">
                                            <strong>{membership.user?.name || "Unknown user"}</strong>
                                            <small>{membership.user?.email || ""}</small>
                                        </span>
                                        <span className="workspace-role">
                                            {membership.role}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <form className="panel project-form" onSubmit={handleInvite}>
                        <div className="panel-heading">
                            <div>
                                <h2>Invite a member</h2>
                                <p>Invite an existing TeamFlow user by email.</p>
                            </div>
                        </div>

                        <label htmlFor="invite-email">Member email</label>
                        <input
                            id="invite-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="teammate@example.com"
                        />

                        <label htmlFor="invite-role">Role</label>
                        <select
                            id="invite-role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                        </select>

                        <button
                            className="primary-action"
                            disabled={saving || !selectedWorkspace}
                        >
                            {saving ? "Creating..." : "Create invitation"}
                        </button>

                        {!selectedWorkspace && (
                            <p className="muted">Select a workspace first.</p>
                        )}

                        {invitation && (
                            <div className="workspace-invitation-result">
                                <strong>Invitation created</strong>
                                <p>
                                    Email: {invitation.email}
                                    <br />
                                    Role: {invitation.role}
                                    <br />
                                    Expires: {new Date(invitation.expiresAt).toLocaleString()}
                                </p>
                                <p>
                                    Share this invitation ID with the intended user through
                                    a trusted channel:
                                </p>
                                <code>{invitation._id}</code>
                                <button
                                    type="button"
                                    className="secondary-action"
                                    onClick={() =>
                                        navigator.clipboard.writeText(invitation._id)
                                    }
                                >
                                    Copy invitation ID
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            <form className="panel project-form" onSubmit={handleAcceptInvitation}>
                <div className="panel-heading">
                    <div>
                        <h2>Accept an invitation</h2>
                        <p>Use the invitation ID shared with you.</p>
                    </div>
                </div>

                <label htmlFor="accept-invitation-id">Invitation ID</label>
                <input
                    id="accept-invitation-id"
                    value={acceptId}
                    onChange={(event) => setAcceptId(event.target.value)}
                    required
                    placeholder="Paste invitation ID"
                />

                <button className="primary-action" disabled={saving}>
                    {saving ? "Joining..." : "Accept invitation"}
                </button>
            </form>

        </section>
    );
}