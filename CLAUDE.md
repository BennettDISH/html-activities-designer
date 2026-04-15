# HTML Activities Designer

Tool for designing and managing HTML learning activities.

## Architecture
- **Frontend**: React 19 + Vite + SASS (`/src/`)
- **Backend**: Express.js + PostgreSQL
- **Auth**: bcryptjs + JWT
- **Deployment**: Railway (auto-deploys on git push)

## Commands
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Project Structure
- `/src/` — React application
- `/public/` — Static assets
- `/config/` — Database configuration
- `/middleware/` — Auth and other middleware
- `/routes/` — Express API routes
- `/database/` — Database setup
- `/samples/` — Sample activities
- `server.js` — Express entry point

## Deployment
- **Platform**: Railway
- Push to main → automatic rebuild and deploy
- Express serves `/dist` in production

## TODO — Remaining Work
- **Templates browsing page** — Backend endpoint (`/api/activities/templates/list`) exists and Dashboard links to `/templates`, but no React page component (`src/pages/Templates.jsx`) has been created. Templates can only be loaded from inside the ActivityBuilder.
- **Search/filtering** — Activities list shows all user activities with no way to search or filter.
- **Analytics/view tracking** — Dashboard has a `// TODO: Add views tracking` comment. No usage metrics exist for activities (views, engagement, completions).
- **Rate limiting** — Public embed API (`/api/embed/:slug`) has no rate limiting.
