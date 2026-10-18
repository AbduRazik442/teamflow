
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "./Sidebar.jsx";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    setLogoutError("");
    setLoggingOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setLogoutError("Unable to contact the server. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  const initials = (user?.name || "User")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="workspace-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="workspace-main">
        <header className="workspace-header">
          <div className="header-left">
            <button
              className="mobile-menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>

            <div>
              <p className="header-eyebrow">YOUR WORKSPACE</p>
              <strong>Workspace overview</strong>
            </div>
          </div>

          <div className="header-user">
            <div className="header-user-info">
              <strong>{user?.name || "Team member"}</strong>
              <span>{user?.email || ""}</span>
            </div>

            <div className="user-avatar" title={user?.name || "User"}>
              {initials}
            </div>

            <button
              className="header-logout"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Signing out..." : "Log out"}
            </button>
          </div>
        </header>

        <main className="workspace-content">
          {logoutError && (
            <p className="form-error" role="alert">{logoutError}</p>
          )}
          <Outlet />
        </main>

        <footer className="workspace-footer">
          TeamFlow <span>·</span> Built for better teamwork
        </footer>
      </div>
    </div>
  );
}