# NewsForge frontend setup

From your `frontend/` folder (already created with `npm create vite@latest`):

1. `npm install react-router-dom`
2. Copy `index.html`, `vite.config.js` and the whole `src/` folder from this zip over yours.
3. Delete `src/App.css` and `src/assets/` (unused).
4. `npm run dev`

No backend yet? Create `frontend/.env.local` with `VITE_USE_MOCK=true` and restart the dev server.
With a backend, run FastAPI on port 8000; Vite proxies `/api/*` to it (see vite.config.js).
The API contract is documented at the top of `src/services/api.js`.
