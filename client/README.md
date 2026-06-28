# Client — Community Hero

## Run locally

```bash
npm install
# create .env with your Google Maps JS API key:
echo "VITE_MAPS_KEY=your_maps_js_api_key" > .env
npm run dev
# open the printed localhost URL on your PHONE (same network) to test the camera
```

The dev server proxies `/api/*` to the backend on :8080 automatically (see vite.config.js).

Get a Maps JS API key: https://console.cloud.google.com/google/maps-apis
Enable "Maps JavaScript API" and restrict the key to your domains.

## Build for production

```bash
npm run build   # outputs dist/
```

Serve `dist/` from any static host, or let your backend serve it.
For the hackathon, deploying the whole app via AI Studio Build mode is simplest.

## NOTE ON CAMERA / GEOLOCATION

The `<input capture="environment">` opens the rear camera on mobile.
Geolocation + camera require HTTPS in production (Cloud Run gives you HTTPS).
If you deploy via AI Studio, add to metadata.json:
"requestFramePermissions": ["camera", "geolocation"]
