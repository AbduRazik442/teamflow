import { NavLink } from "react-router-dom";

const navigation = [
  { label: "Overview", path: "/dashboard", icon: "▦" },
  { label: "Projects", path: "/projects", icon: "◫" },
  { label: "My Tasks", path: "/tasks", icon: "✓" },
  { label: "Team", path: "/team", icon: "♧" },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <NavLink to="/dashboard" className="sidebar-brand" onClick={onClose}>
          <span className="brand-mark">T</span>
          <span>TeamFlow<span className="brand-period">.</span></span>
        </NavLink>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
              }
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <p className="sidebar-label">PREFERENCES</p>
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
            }
          >
            <span className="nav-icon" aria-hidden="true">⚙</span>
            Settings
          </NavLink>

          <div className="sidebar-note">
            <span className="sidebar-note-dot" />
            <div>
              <strong>TeamFlow workspace</strong>
              <p>Organize. Collaborate. Deliver.</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}