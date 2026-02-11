# Deploying FAST App on Windows Server

This guide covers building the frontend and deploying the app (frontend + optional backend) on **Windows Server** using IIS.

---

## 1. Prerequisites

### On the machine where you build the frontend (any OS)

- **Node.js** 18+ (LTS recommended)
- **npm** (comes with Node.js)

### On the Windows Server

- **IIS** (Internet Information Services) with:
  - ASP.NET 4.x / Static Content / Default Document
  - **URL Rewrite Module** ([download](https://www.iis.net/downloads/microsoft/url-rewrite))
- If you run the **backend** on the same server: **Java 17+** (e.g. OpenJDK or Temurin; backend uses Java 21)
- For running the backend as a Windows service: **NSSM** (Non-Sucking Service Manager)

---

## 2. Build the frontend (output: `dist`)

The frontend is a Vite + React app. The build produces a static folder **`dist`** that you deploy to IIS.

### 2.1 Set the API base URL (optional)

If the backend will be at a different origin than the frontend (e.g. `https://api.yourserver.com/api/v1`), set this **before** building:

**Windows (Command Prompt):**

```cmd
set VITE_API_BASE_URL=https://api.yourserver.com/api/v1
npm run build
```

**Windows (PowerShell):**

```powershell
$env:VITE_API_BASE_URL="https://api.yourserver.com/api/v1"
npm run build
```

**Linux / macOS / WSL:**

```bash
export VITE_API_BASE_URL=https://api.yourserver.com/api/v1
npm run build
```

If the frontend and backend are on the **same origin** (e.g. IIS proxies `/api` to the backend), leave `VITE_API_BASE_URL` unset so the app uses `/api/v1`.

### 2.2 Install dependencies and build

From the project root:

```bash
cd fast-frontend
npm ci
npm run build
```

- **Output folder:** `fast-frontend/dist`
- Contents: `index.html`, `assets/` (JS/CSS), `vite.svg`, and **`web.config`** (for IIS SPA routing).

### 2.3 Verify the build

- Ensure `fast-frontend/dist` contains `index.html` and `web.config`.
- Optionally run a local preview:  
  `npm run preview`  
  (serves the `dist` folder locally.)

---

## 3. Copy the build to Windows Server

Copy the **entire `dist`** folder to the server (e.g. via RDP, shared folder, or deployment script).

**Example target on server:**  
`C:\inetpub\wwwroot\fast-app`

- Copy everything **inside** `dist` (not the `dist` folder itself) into `C:\inetpub\wwwroot\fast-app`,  
  **or**
- Copy the `dist` folder and use `C:\inetpub\wwwroot\fast-app\dist` as the site physical path.

So the server folder should contain at least:

- `index.html`
- `web.config`
- `assets/` (with JS and CSS)

---

## 4. Configure IIS for the frontend

### 4.1 Install URL Rewrite (if not already)

1. Download [URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite).
2. Install on the Windows Server.
3. Restart IIS if prompted.

### 4.2 Create (or use) the website

1. Open **IIS Manager** → **Sites**.
2. **Add Website** (or use **Default Web Site**):
   - **Site name:** e.g. `FAST-App`
   - **Physical path:** e.g. `C:\inetpub\wwwroot\fast-app` (where you copied the `dist` contents).
   - **Binding:** Choose port (e.g. **80** for HTTP or **443** for HTTPS) and host name if needed.

The included **`web.config`** in the deployed folder enables SPA routing: non-file requests are rewritten to `index.html` so client-side routes work.

### 4.3 Test the frontend

- Open `http://your-server/` (or the port/host you used).
- You should see the app; navigating to e.g. `/dashboard` or `/tickets` should work without 404s.

---

## 5. Backend (API) on Windows Server

The frontend expects the API at **`/api/v1`** (relative) or at the URL you set in **`VITE_API_BASE_URL`**.

### Option A: Backend on same server – proxy with IIS

1. Run the Java backend (e.g. on `http://localhost:8081`).
2. Install **Application Request Routing (ARR)** and configure a **URL Rewrite** rule to proxy `/api` to `http://localhost:8081`.
3. Keep **`VITE_API_BASE_URL`** unset so the frontend uses relative `/api/v1`.

### Option B: Backend on same server – different port

1. Run the backend on a port (e.g. **8081**).
2. Build the frontend with:  
   `VITE_API_BASE_URL=http://your-server:8081/api/v1`  
   (use HTTPS and the real hostname in production.)
3. Ensure **CORS** on the backend allows the frontend origin (see `CORS_ALLOWED_ORIGINS` in backend config / `.env`).

### Option C: Backend on another server

1. Build the frontend with:  
   `VITE_API_BASE_URL=https://api-server.domain.com/api/v1`
2. Configure CORS on the backend for the frontend origin.

---

## 6. Backend as Windows service (NSSM)

Run the Java backend as a Windows service using **NSSM** so it starts automatically and restarts on failure.

### 6.1 Build the backend JAR

On a machine with Maven (or from the repo after building):

```cmd
cd fast-backend
mvn -q -DskipTests package
```

The JAR is produced at:  
`fast-backend\target\fast-backend-1.0.0-SNAPSHOT.jar`

Copy this JAR (and any `application-prod.yml` or config you use) to the Windows Server, e.g.:

- **App directory:** `C:\Apps\fast-backend`
- **JAR:** `C:\Apps\fast-backend\fast-backend-1.0.0-SNAPSHOT.jar`

### 6.2 Install NSSM

1. Download NSSM from [nssm.cc](https://nssm.cc/download) (use the 64-bit build on 64-bit Windows).
2. Extract (e.g. to `C:\Tools\nssm`).
3. Add the folder containing `nssm.exe` to `PATH`, or run it by full path, e.g.  
   `C:\Tools\nssm\win64\nssm.exe`

### 6.3 Install Java (if not already)

- Install **Java 21** (or 17+) – e.g. [Eclipse Temurin](https://adoptium.net/) or OpenJDK.
- Ensure `java` is on the system `PATH` (open a **new** Command Prompt and run `java -version`).

### 6.4 Create the service with NSSM

Run **Command Prompt or PowerShell as Administrator**.

**Using NSSM GUI:**

```cmd
nssm install FastBackend
```

In the dialog:

- **Path:** `C:\Program Files\Eclipse Adoptium\jdk-21.x.x\bin\java.exe`  
  (use your actual Java path; find it with `where java` or from your JDK install.)
- **Startup directory:** `C:\Apps\fast-backend`
- **Arguments:**  
  `-jar "C:\Apps\fast-backend\fast-backend-1.0.0-SNAPSHOT.jar" --spring.profiles.active=prod`

Click **Install service**.

**Using NSSM from command line (adjust Java path and JAR path to match your server):**

```cmd
nssm install FastBackend "C:\Program Files\Eclipse Adoptium\jdk-21.0.1.12-hotspot\bin\java.exe" "-jar" "C:\Apps\fast-backend\fast-backend-1.0.0-SNAPSHOT.jar" "--spring.profiles.active=prod"
nssm set FastBackend AppDirectory "C:\Apps\fast-backend"
```

### 6.5 Optional: JVM and app settings

In NSSM (Edit FastBackend → **Details** or use the **I/O** tab for stdout/stderr), or via `nssm set`:

- **Environment extra:** add variables the backend needs, e.g.  
  `SPRING_PROFILES_ACTIVE=prod`  
  `CORS_ALLOWED_ORIGINS=https://your-server.domain.com`

To pass JVM options (memory, etc.), put them before `-jar` in **Arguments**, e.g.:

```text
-Xms256m -Xmx512m -jar "C:\Apps\fast-backend\fast-backend-1.0.0-SNAPSHOT.jar" --spring.profiles.active=prod
```

### 6.6 Start and manage the service

```cmd
nssm start FastBackend
nssm status FastBackend
nssm stop FastBackend
nssm restart FastBackend
```

Or use Windows Services (`services.msc`): find **FastBackend**, start/stop/restart and set **Startup type** to **Automatic**.

### 6.7 Logs

- In NSSM, set **Output** and **Error** (I/O tab) to log files, e.g.  
  `C:\Apps\fast-backend\logs\stdout.log`  
  `C:\Apps\fast-backend\logs\stderr.log`  
  (create the `logs` folder first.)
- Or rely on Spring Boot logging (e.g. `application-prod.yml` and `logging.file.name`).

### 6.8 Updating the backend

1. Stop the service: `nssm stop FastBackend`
2. Replace the JAR in `C:\Apps\fast-backend`.
3. Start the service: `nssm start FastBackend`

To remove the service later:  
`nssm remove FastBackend confirm`

---

## 7. Checklist

| Step | Action |
|------|--------|
| 1 | Install Node.js and npm on build machine |
| 2 | Set `VITE_API_BASE_URL` if API is on another origin |
| 3 | Run `npm ci` and `npm run build` in `fast-frontend` |
| 4 | Copy contents of `fast-frontend/dist` to the server folder |
| 5 | Install IIS URL Rewrite on Windows Server |
| 6 | Create/configure IIS site pointing to that folder |
| 7 | Build backend JAR (`mvn package` in `fast-backend`), copy to server (e.g. `C:\Apps\fast-backend`) |
| 8 | Install NSSM and Java 21 on Windows Server |
| 9 | Create FastBackend service with NSSM, set AppDirectory and JAR arguments |
| 10 | Start FastBackend service; configure IIS proxy or CORS as needed |

---

## 8. Build summary

| Item | Value |
|------|--------|
| Frontend build command | `npm run build` (from `fast-frontend`) |
| Output directory | `fast-frontend/dist` |
| Key files in output | `index.html`, `web.config`, `assets/*` |
| API base (same origin) | Leave `VITE_API_BASE_URL` unset → `/api/v1` |
| API base (other origin) | Set `VITE_API_BASE_URL` before build |

For backend configuration (database, CORS, BAM, etc.), see the backend `application.yml` and `.env.example` in the repo.
