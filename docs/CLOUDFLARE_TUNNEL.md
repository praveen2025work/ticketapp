# Cloudflare Tunnel (public URL)

Your app can be exposed with a **Cloudflare quick tunnel** so it’s reachable at a public `https://....trycloudflare.com` URL.

## Your Cloudflare URL

**https://exceed-buf-newsletters-sin.trycloudflare.com**

- The tunnel must be running for this URL to work (see below).
- Backend CORS is already set to allow this origin (via `.env` → `CORS_ALLOWED_ORIGINS`).

## Get a new URL / restart tunnel

1. **Start the stack** (if not already):
   ```bash
   docker compose up -d
   ```

2. **Start the Cloudflare tunnel** (downloads `cloudflared` into `.bin/` on first run):
   ```bash
   ./scripts/cloudflare-tunnel.sh
   ```
   Default target is `http://localhost:3080` (Docker frontend). To point at another port:
   ```bash
   ./scripts/cloudflare-tunnel.sh http://localhost:5173
   ```

3. **Copy the URL** from the script output (e.g. `https://something.trycloudflare.com`).

4. **Add it to CORS** in `.env`:
   ```env
   CORS_ALLOWED_ORIGINS=https://your-new-url.trycloudflare.com,http://localhost,...
   ```

5. **Recreate the backend** so it picks up the new origin:
   ```bash
   docker compose up -d --force-recreate backend
   ```

Keep the tunnel script running in a terminal while you use the Cloudflare URL. Quick tunnels are free and don’t require a Cloudflare account; the URL changes each time you start a new tunnel.
