# FAST Frontend

React + TypeScript + Vite frontend for the FAST Problem Ticket System.

## Backend API URL

You can set the API base URL in two ways:

### 1. Runtime (no rebuild): `config.json`

**Recommended for deployment.** The app loads **`/config.json`** on startup. Put it in the same folder as `index.html` (e.g. in `public/` so it’s copied to `dist/` on build). Example:

```json
{
  "apiBaseUrl": "http://your-server:8081/api/v1",
  "authMode": "local"
}
```

- **`apiBaseUrl`** – full backend API base (no trailing slash). All API calls use this. Change it on the server and refresh the app; no rebuild needed.
- **`authMode`** – `"local"` to skip BAM and use `/users/me` with the default user.

If `apiBaseUrl` is omitted, the app uses the build-time value or `/api/v1`.

### 2. Build time: `VITE_API_BASE_URL`

Set when building so the default is baked in:

| Where | When to use |
|-------|-------------|
| **`.env`** in `fast-frontend/` | `VITE_API_BASE_URL=http://your-server:8081/api/v1` then `npm run build`. |
| **Shell** | `$env:VITE_API_BASE_URL="http://..."; npm run build` (PowerShell) or `VITE_API_BASE_URL=... npm run build` (Bash). |

- **Empty or unset** → default is **`/api/v1`** (same origin).
- **Set** → e.g. `http://your-server:8081/api/v1` or `https://api.yourserver.com/api/v1`.

If you also use **`config.json`** with `apiBaseUrl`, that runtime value overrides the build-time one after the first load.

---

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
