# Our Little Room

This is a static website for GitHub Pages and Firebase Hosting. It uses plain HTML, CSS, and JavaScript with no framework and no build step.

## Structure

- `index.html` is the static site entry file.
- `css/style.css` contains the site styles.
- `js/data.js` contains the default site content.
- `js/firebase.js` contains Firebase web config placeholders and safe bootstrap code.
- `js/store.js` contains the data access abstraction. The app currently uses `localStore` by default.
- `js/render.js` renders page sections from the data.
- `js/app.js` contains initialization and shared interactions.
- `js/admin.js` contains the browser admin/editor tools.
- `firebase.json` configures Firebase Hosting.
- `firestore.rules` contains the initial Firestore Security Rules skeleton.

## Local Setup

Open `index.html` directly in a browser, or serve the folder with any static file server.

## Editing Flow

Default content lives in `js/data.js`. To make source-controlled content changes, edit the files in this repository, then commit the changes with Git.

The in-browser admin/editor can export and import JSON for convenience.

## localStorage Limitation

Browser edits are stored in `localStorage` only. They stay in that browser profile, but they do not update GitHub, Firebase, the repository, or other visitors.

For now, logged-out/static behavior still uses `localStorage` through `localStore`. Firestore scaffolding exists, but the production path does not write to Firestore yet.

To publish browser edits, export the JSON, apply the intended changes to the repository files manually, and commit them with Git.

## Firebase Setup Notes

Firebase support is scaffolded but not active by default.

1. Create a Firebase project.
2. Enable Authentication and Cloud Firestore in the Firebase console.
3. Register a Web app and copy the public Firebase web config into `js/firebase.js`.
4. Keep only normal public Firebase web config in frontend files. Do not commit service account keys, real passwords, private share codes, or backend secrets.
5. Deploy rules with the Firebase CLI when ready.
6. Deploy the static site with Firebase Hosting when ready.

The placeholder `firestoreStore` in `js/store.js` is intentionally not wired into the current app flow yet.

## GitHub Pages Deployment

Publish from the repository root. GitHub Pages will load `index.html` as the site entry file.

## Firebase Hosting Deployment

Firebase Hosting is configured to serve the repository root as a static site. The hosting ignore list excludes project metadata such as `firebase.json`, `firestore.rules`, `README.md`, dotfiles, and `node_modules`.
