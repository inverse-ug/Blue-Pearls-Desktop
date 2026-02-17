import { useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import "./App.css";

function App() {
  useEffect(() => {
    checkForUpdates();
  }, []);

  async function checkForUpdates() {
    try {
      const update = await check();

      if (update) {
        const shouldUpdate = confirm(
          `A new version (${update.version}) of Blue Pearls Desktop is available!\n\n${update.body}\n\nWould you like to update now?`,
        );

        if (shouldUpdate) {
          await update.downloadAndInstall((event) => {
            switch (event.event) {
              case "Started":
                console.log(`Downloading update...`);
                break;
              case "Progress":
                console.log(`Downloading...`);
                break;
              case "Finished":
                console.log("Download complete, installing...");
                break;
            }
          });

          await relaunch();
        }
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
    }
  }

  return (
    <main className="container">
      <img src="/logo.png" alt="Blue Pearls Logo" />
      <h1>Blue Pearls Desktop</h1>
    </main>
  );
}

export default App;
