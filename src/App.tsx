import { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { ask } from "@tauri-apps/plugin-dialog";
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
        const shouldUpdate = await ask(
          `A newer version is Available.\n\n${update.body}\n\nWould you like to update now?`,
          {
            title: "Update Available",
            kind: "info",
            okLabel: "Update",
            cancelLabel: "Later",
          },
        );

        if (shouldUpdate) {
          setStatus("Downloading update...");
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
        } else {
          setStatus("Up to date");
        }
      } else {
        setStatus("Up to date");
      }
    } catch (error) {
      setStatus(``);
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
      <p>Welcome to Blue Pearls Desktop. We're glad you're here.</p>
      <p>{status}</p>
    </main>
  );
}

export default App;
