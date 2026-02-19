import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { ask } from "@tauri-apps/plugin-dialog";
import LoginPage from "./pages/Login";
import Layout from "./layouts/Layout";
import Dashboard from "./pages/Dashboard";

// ── Security Wrappers ────────────────────────────────────────────────────────

// Prevents unauthorized users from accessing the app
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("bp_token");
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Prevents logged-in users from going back to the login page
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("bp_token");
  if (token) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// ── Update Button ────────────────────────────────────────────────────────────

type UpdateStatus = "idle" | "available" | "downloading" | "done" | "error";

function UpdateBadge() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [label, setLabel] = useState("Checking for updates…");

  useEffect(() => {
    checkForUpdates();
  }, []);

  async function checkForUpdates() {
    try {
      const update = await check();
      if (update) {
        setStatus("available");
        setLabel("Update available");
      } else {
        setStatus("done");
        setLabel("Up to date");
      }
    } catch {
      setStatus("error");
      setLabel("");
    }
  }

  async function handleUpdateClick() {
    if (status !== "available") return;

    try {
      const update = await check();
      if (!update) return;

      const shouldUpdate = await ask(
        `A newer version is available.\n\n${update.body}\n\nWould you like to update now?`,
        {
          title: "Update Available",
          kind: "info",
          okLabel: "Update",
          cancelLabel: "Later",
        },
      );

      if (shouldUpdate) {
        setStatus("downloading");
        setLabel("Downloading…");

        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case "Started":
              setLabel("Downloading…");
              break;
            case "Progress":
              setLabel("Downloading…");
              break;
            case "Finished":
              setLabel("Installing…");
              break;
          }
        });

        await relaunch();
      }
    } catch {
      setStatus("error");
      setLabel("");
    }
  }

  if (status === "error" || status === "done" || label === "") return null;

  const isClickable = status === "available";

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999]"
      style={{ fontFamily: "'Inter', sans-serif" }}>
      <button
        onClick={handleUpdateClick}
        disabled={!isClickable}
        title={label}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 select-none"
        style={{
          background:
            status === "available"
              ? "linear-gradient(135deg, #1a3a5c 0%, #1e6ea6 100%)"
              : "rgba(0,0,0,0.06)",
          color: status === "available" ? "#ffffff" : "#94a3b8",
          boxShadow:
            status === "available" ? "0 2px 10px rgba(26,58,92,0.25)" : "none",
          border:
            status === "available" ? "none" : "1px solid rgba(0,0,0,0.08)",
          cursor: isClickable ? "pointer" : "default",
        }}>
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            background:
              status === "available"
                ? "#7dd3fc"
                : status === "downloading"
                  ? "#fbbf24"
                  : "#86efac",
            boxShadow:
              status === "available"
                ? "0 0 0 2px rgba(125,211,252,0.3)"
                : "none",
          }}
        />
        {label}
        {status === "downloading" && (
          <span
            className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"
            style={{ opacity: 0.6 }}
          />
        )}
      </button>
    </div>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────

function App() {
  return (
    <BrowserRouter>
      {/* Sonner Toaster - Notifications appear at bottom-center as requested */}
      <Toaster position="bottom-center" richColors />

      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Protected layout routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      <UpdateBadge />
    </BrowserRouter>
  );
}

export default App;
