# Update & Release Guide

## Overview

Every time you want to ship a new version, follow these steps in order. The process takes about 15–20 minutes — most of that is waiting for GitHub Actions to build on all 3 platforms.

---

## Step 1 — Make Your Changes

Make whatever code, design, or content changes you want in the project.

---

## Step 2 — Bump the Version

Open `src-tauri/tauri.conf.json` and update the version number:

```json
"version": "NEW_VERSION_HERE"
```

Use [Semantic Versioning](https://semver.org):
- **Patch** (0.3.0 → 0.3.1) — bug fixes
- **Minor** (0.3.0 → 0.4.0) — new features
- **Major** (0.3.0 → 1.0.0) — breaking changes

---

## Step 3 — Commit and Push

Commit all your changes and push to main using GitHub Desktop or the terminal:

```bash
git add .
git commit -m "Release vNEW_VERSION_HERE"
git push origin main
```

---

## Step 4 — Tag and Push

```bash
git tag vNEW_VERSION_HERE
git push origin vNEW_VERSION_HERE
```

This tag push is what triggers the GitHub Actions build. Make sure you push your commits to main **before** pushing the tag.

---

## Step 5 — Wait for the Build

Go to your repo's Actions tab and watch the build. You will see 4 jobs running simultaneously — Windows, Linux, macOS Intel, and macOS Apple Silicon. All 4 must show a green checkmark before proceeding.

---

## Step 6 — Publish the Release

Once the build finishes, go to your repo's Releases page. You will see a draft release. Click the edit icon, add release notes if you want, then click **Publish Release**.

Publishing the release makes `latest.json` live, which is the file the app checks to detect new updates.

---

## Step 7 — Users Get Notified

Once the release is published, any user who opens the installed app will be automatically checked for updates. If a newer version is found, they will see a prompt asking if they want to update. If they confirm, the update downloads, installs, and the app relaunches on the new version.

---

## Troubleshooting

**Build did not trigger after pushing the tag**
The tag may have been created before your latest commit. Delete and recreate it:
```bash
git tag -d vNEW_VERSION_HERE
git push origin --delete vNEW_VERSION_HERE
git tag vNEW_VERSION_HERE
git push origin vNEW_VERSION_HERE
```

**Users are not seeing the update prompt**
Make sure you have published the release — a draft release does not serve `latest.json`.

**Build failed**
Check the Actions tab for the error. Common causes are missing secrets (`TAURI_SIGNING_PRIVATE_KEY`) or a dependency issue in the workflow.

---

## Keys Reference

| File | What it is | Where it lives |
|---|---|---|
| Private key | Signs your update artifacts — never share | `~/.tauri/` |
| Public key | Pasted into `tauri.conf.json` | `~/.tauri/` |

The private key is also stored as a GitHub Actions secret so builds can be signed automatically without exposing the key.

---

## GitHub Secrets Required

These are set once in `Settings → Secrets and Variables → Actions`:

| Secret | Value |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | Full text content of your private key file |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Your key password, or empty if none |
