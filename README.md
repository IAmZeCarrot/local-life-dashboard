# Local Life Dashboard

A polished, offline-first home for tasks, notes, bookmarks, and reminders. Everything stays in your browser on the current device: there are no accounts, servers, cloud services, analytics, ads, or paid APIs.

## Try it

Open the [live dashboard](https://iamzecarrot.github.io/local-life-dashboard/). No account or setup is required. After the first successful visit, the app shell remains available offline.

In a supported desktop or mobile browser, use the browser's **Install app** option to add the dashboard to your Start menu, home screen, or app launcher.

## Features

- Add tasks, notes, bookmarks, and dated reminders
- Complete and reopen actionable items
- Search titles, details, URLs, and tags
- Filter by item type and see at-a-glance counts
- Highlight overdue and next-24-hour items
- Export a readable, versioned JSON backup
- Preview imports, merge new records, and choose how to handle conflicts
- Cache the application for offline use after the first successful visit
- Responsive layout, keyboard focus styles, semantic labels, live status messages, and reduced-motion support

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
```

Open the address printed by Vite. For a production build:

```sh
npm run build
npm run preview
```

## Data and privacy

Data is stored in `localStorage` under `local-life-dashboard:v1`. Exported files use this shape:

```json
{ "version": 1, "items": [] }
```

Imports are shape-checked and duplicate IDs are rejected. The app previews new, unchanged, and conflicting records. New records merge in; conflicts keep the local version unless you explicitly choose the imported version. Export regularly if the information matters: clearing browser storage or resetting a browser profile can erase local data.

The service worker caches same-origin application files only. It does not send dashboard data anywhere. External bookmark pages are opened only when you choose them.

## Deployment

Changes merged into `main` are checked, built with the repository subpath, and deployed through the GitHub Pages Actions workflow. The repository's Pages source must be set to **GitHub Actions**.

## Development

```sh
npm run check
```

This runs formatting checks, ESLint, strict TypeScript checking, unit/component tests, and the production build. GitHub Actions runs the same gate for pull requests and changes to `main`.

## Limitations

- Data does not synchronize between browsers or devices.
- Browser storage quotas and retention policies vary. This is not a replacement for an external backup.
- Reminders are visually highlighted when the app is open; v1 does not send operating-system notifications.
- The app has no recurring tasks, rich-text editor, attachment storage, or encrypted vault.

## License

MIT
