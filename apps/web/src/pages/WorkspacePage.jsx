
import { Link, useLocation } from "react-router-dom";

const pageContent = {
  "/projects": {
    title: "Projects",
    description: "Create projects, organize work, and track progress.",
    icon: "◫",
  },
  "/tasks": {
    title: "My Tasks",
    description: "Keep track of your assigned work and deadlines.",
    icon: "✓",
  },
  "/team": {
    title: "Team",
    description: "Collaborate with teammates in your workspace.",
    icon: "♧",
  },
  "/settings": {
    title: "Settings",
    description: "Manage your workspace preferences and account.",
    icon: "⚙",
  },
};

export default function WorkspacePage() {
  const { pathname } = useLocation();
  const page = pageContent[pathname] || pageContent["/projects"];

  return (
    <section className="placeholder-page">
      <div className="placeholder-icon">{page.icon}</div>
      <p className="page-eyebrow">TEAMFLOW WORKSPACE</p>
      <h1>{page.title}</h1>
      <p>{page.description}</p>

      <div className="placeholder-card">
        <span className="placeholder-status">COMING IN A FUTURE MILESTONE</span>
        <h2>This section is ready for development.</h2>
        <p>
          The shared navigation and authentication are in place. Next,
          we'll connect this section to real backend data.
        </p>
        <Link to="/dashboard" className="primary-action">
          Back to overview <span>←</span>
        </Link>
      </div>
    </section>
  );
}