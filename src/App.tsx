import { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import "./App.css";

function App() {
  const [status, setStatus] = useState("Checking for updates...");

  useEffect(() => {
    checkForUpdates();
  }, []);

  async function checkForUpdates() {
    try {
      const update = await check();
      if (update) {
        setStatus(`Update available: ${update.version}`);
        const shouldUpdate = confirm(
          `A new version (${update.version}) of Blue Pearls Desktop is available!\n\n${update.body}\n\nWould you like to update now?`,
        );
        if (shouldUpdate) {
          await update.downloadAndInstall((event) => {
            switch (event.event) {
              case "Started":
                setStatus("Downloading update...");
                break;
              case "Progress":
                setStatus("Downloading...");
                break;
              case "Finished":
                setStatus("Installing...");
                break;
            }
          });
          await relaunch();
        }
      } else {
        setStatus("No update available");
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  }

  return (
    <main className="container">
      <img
        src="/logo.png"
        alt="Blue Pearls Logo"
        style={{ width: "120px", height: "120px", objectFit: "contain" }}
      />
      <h1>Blue Pearls Desktop</h1>
      <p>{status}</p>
    </main>
  );
}

export default App;
