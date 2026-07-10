# Our Little Room

This is a static website for GitHub Pages. It uses plain HTML, CSS, and JavaScript with no framework and no build step.

## Structure

- `index.html` is the GitHub Pages entry file.
- `css/style.css` contains the site styles.
- `js/data.js` contains the default site content.
- `js/render.js` renders page sections from the data.
- `js/app.js` contains initialization and shared interactions.
- `js/admin.js` contains the browser admin/editor tools.

## Local Setup

Open `index.html` directly in a browser, or serve the folder with any static file server.

## Editing Flow

Default content lives in `js/data.js`. To make source-controlled content changes, edit the files in this repository, then commit the changes with Git.

The in-browser admin/editor can export and import JSON for convenience.

## localStorage Limitation

Browser edits are stored in `localStorage` only. They stay in that browser profile, but they do not update GitHub, the repository, or other visitors.

To publish browser edits, export the JSON, apply the intended changes to the repository files manually, and commit them with Git.

## GitHub Pages Deployment

Publish from the repository root. GitHub Pages will load `index.html` as the site entry file.
