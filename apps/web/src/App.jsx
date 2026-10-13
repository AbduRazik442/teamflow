import { useEffect, useState } from "react";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [apiStatus, setApiStatus] = useState("checking");
  const [apiMessage, setApiMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function checkApi() {
      try {
        const response = await fetch(`${API_URL}/api/health`, {
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error("The API returned an unsuccessful response");
        }

        setApiStatus("connected");
        setApiMessage(data.message);
      } catch (error) {
        if (error.name === "AbortError") return;

        setApiStatus("disconnected");
        setApiMessage("Start the backend and try again.");
      }
    }

    checkApi();

    return () => controller.abort();
  }, []);

  return (
    <main className="app-shell">
      <nav className="navbar">
        <a className="brand" href="/" aria-label="TeamFlow home">
          <span className="brand-icon">T</span>
          <span>TeamFlow</span>
        </a>

        <span className="nav-label">DEVELOPER PREVIEW</span>
      </nav>

      <section className="hero">
        <div className="eyebrow">
          <span className="eyebrow-dot" />
          YOUR TEAM'S NEXT WORKSPACE
        </div>

        <h1>
          Great work
          <br />
          <span>happens together.</span>
        </h1>

        <p className="hero-description">
          A focused workspace to organize projects, collaborate
          with your team, and turn ideas into results.
        </p>

        <div className="hero-actions">
          <button
            className="primary-button"
            onClick={() =>
              document.getElementById("system-status")?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              })
            }
          >
            Explore the preview <span aria-hidden="true">↗</span>
          </button>

          <a
            className="secondary-button"
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="preview-card" id="system-status">
          <div className="preview-top">
            <div>
              <span className="preview-caption">SYSTEM STATUS</span>
              <h2>Development environment</h2>
            </div>

            <span className={`status-pill ${apiStatus}`}>
              <span className="status-dot" />
              {apiStatus === "checking"
                ? "Checking"
                : apiStatus === "connected"
                  ? "API Online"
                  : "API Offline"}
            </span>
          </div>

          <div className="status-details">
            <div className="status-row">
              <span>Frontend</span>
              <span className="status-value">
                <span className="status-dot online" />
                React + Vite
              </span>
            </div>

            <div className="status-row">
              <span>Backend</span>
              <span className="status-value">
                <span
                  className={`status-dot ${
                    apiStatus === "connected"
                      ? "online"
                      : apiStatus === "disconnected"
                        ? "offline"
                        : ""
                  }`}
                />
                {apiStatus === "connected"
                  ? "Express connected"
                  : apiStatus === "disconnected"
                    ? "Not reachable"
                    : "Checking API..."}
              </span>
            </div>

            <div className="status-row">
              <span>Database</span>
              <span className="pending-value">Next milestone</span>
            </div>
          </div>

          <p className="api-message" aria-live="polite">
            {apiMessage || "Checking the TeamFlow API..."}
          </p>
        </div>

        <div className="footer-note">
          BUILT WITH REACT · NODE.JS · EXPRESS · MONGODB
        </div>
      </section>
    </main>
  );
}

export default App;