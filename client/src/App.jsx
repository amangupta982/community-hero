import React, { useEffect, useRef, useState } from "react";
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF } from "@react-google-maps/api";

// Your Google Maps JS API key. Set it in client/.env as VITE_MAPS_KEY.
const MAPS_KEY = import.meta.env.VITE_MAPS_KEY || "";

const SEVERITY_COLOR = {
  Low: "#3b82f6",
  Medium: "#f59e0b",
  High: "#f97316",
  Critical: "#ef4444",
};

// Bengaluru as a sensible default center until we have the user's location.
const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 };

// DEMO MODE coordinates. The first two are ~12m apart, so same-type reports
// there will MERGE into one cluster ("2 citizens reported"). The third is far
// away and stays separate. This lets us demonstrate clustering live on a laptop
// where real GPS doesn't work, without faking anything on the server.
const DEMO_SPOTS = [
  { lat: 12.97160, lng: 77.59460, label: "MG Road" },        // cluster A
  { lat: 12.97168, lng: 77.59466, label: "MG Road (nearby)" }, // ~12m -> merges with A
  { lat: 12.93420, lng: 77.62100, label: "Koramangala" },     // far -> separate
];

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// Returns { coords, reason }. coords is {lat,lng} or null.
// reason explains a null so the UI can show something useful instead of failing silently.
function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      return resolve({ coords: null, reason: "unsupported" });
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }, reason: null }),
      (err) => {
        // 1 = permission denied, 2 = position unavailable, 3 = timeout
        const reason =
          err.code === 1 ? "denied" : err.code === 3 ? "timeout" : "unavailable";
        resolve({ coords: null, reason });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

export default function App() {
  const [reports, setReports] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState(null); // selected map marker
  const [draftingId, setDraftingId] = useState(null); // which report's complaint is generating
  const [demoMode, setDemoMode] = useState(false);
  const demoStep = useRef(0);
  const fileRef = useRef(null);

  const { isLoaded } = useLoadScript({ googleMapsApiKey: MAPS_KEY });

  async function loadReports() {
    try {
      const r = await fetch("/api/reports");
      setReports(await r.json());
    } catch {
      /* ignore on first load */
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function onPhotoChosen(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      let photo, coords;
      if (demoMode) {
        // Cycle through fixed demo spots so clustering is demonstrable on a laptop.
        photo = await fileToDataUrl(file);
        coords = DEMO_SPOTS[demoStep.current % DEMO_SPOTS.length];
        demoStep.current += 1;
      } else {
        // Request location FIRST (tied to the user's tap) so the permission
        // prompt reliably appears, then read the file.
        const locResult = await getLocation();
        photo = await fileToDataUrl(file);
        coords = locResult.coords;
        if (!coords) {
          // Don't block the report — but tell the user why there's no pin.
          const msg = {
            denied: "Location permission is blocked. Enable location for this site to map the report.",
            unavailable: "Couldn't get a GPS fix (common on laptops/indoors). Report saved without a pin.",
            timeout: "Location timed out. Report saved without a pin — try again outdoors.",
            unsupported: "This device can't provide location. Report saved without a pin.",
          }[locResult.reason] || "Location unavailable. Report saved without a pin.";
          setError(msg);
        }
      }
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo, lat: coords?.lat ?? null, lng: coords?.lng ?? null }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Analysis failed");
      }
      await loadReports();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function generateComplaint(id) {
    setDraftingId(id);
    setError("");
    try {
      const res = await fetch(`/api/report/${id}/complaint`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Could not draft complaint");
      }
      await loadReports();
    } catch (err) {
      setError(err.message);
    } finally {
      setDraftingId(null);
    }
  }

  const mapCenter =
    reports.find((r) => r.lat && r.lng) ?
      { lat: reports[0].lat, lng: reports[0].lng } : DEFAULT_CENTER;

  return (
    <div className="app">
      <header>
        <h1>Community&nbsp;Hero</h1>
        <p className="tagline">Spot it. Snap it. The agent handles the rest.</p>
      </header>

      <div className="cta">
        <button
          className={`report-btn${busy ? " agent-working" : ""}`}
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          {busy ? "⟳ Agent analyzing…" : "📸 Report an Issue"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={onPhotoChosen}
        />
        {error && <div className="error">{error}</div>}

        <label className="demo-toggle">
          <input
            type="checkbox"
            checked={demoMode}
            onChange={(e) => { setDemoMode(e.target.checked); demoStep.current = 0; }}
          />
          Demo mode (simulates GPS — first two reports cluster, third is separate)
        </label>
        {demoMode && (
          <div className="demo-hint">
            Next report → <strong>{DEMO_SPOTS[demoStep.current % DEMO_SPOTS.length].label}</strong>
          </div>
        )}
      </div>

      <section className="map-wrap">
        {isLoaded && MAPS_KEY ? (
          <GoogleMap
            mapContainerClassName="map"
            center={mapCenter}
            zoom={13}
            options={{ streetViewControl: false, mapTypeControl: false }}
          >
            {reports
              .filter((r) => r.lat && r.lng)
              .map((r) => (
                <MarkerF
                  key={r.id}
                  position={{ lat: r.lat, lng: r.lng }}
                  onClick={() => setActive(r)}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 9,
                    fillColor: SEVERITY_COLOR[r.severity] || "#3b82f6",
                    fillOpacity: 1,
                    strokeColor: "#fff",
                    strokeWeight: 2,
                  }}
                />
              ))}
            {active && active.lat && (
              <InfoWindowF
                position={{ lat: active.lat, lng: active.lng }}
                onCloseClick={() => setActive(null)}
              >
                <div className="iw">
                  <strong>{active.issueType}</strong> · {active.severity}
                  <div>{active.description}</div>
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        ) : (
          <div className="map placeholder">
            {MAPS_KEY ? "Loading map…" : "Add VITE_MAPS_KEY to see the map"}
          </div>
        )}
      </section>

      <section className="list">
        <p className="section-eyebrow">Issue Tracker</p>
        <h2>Reports ({reports.length})</h2>
        {reports.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">🏙️</span>
            <p className="empty-title">No reports yet</p>
            <p className="empty-sub">Tap the button above to photograph a civic issue — potholes, broken lights, garbage dumps. Your agent takes it from there.</p>
          </div>
        )}
        {reports.map((r) => (
          <article key={r.id} className="card">
            <img src={r.photo} alt={r.issueType} />
            <div className="card-body">
              <div className="row">
                <span className="type">{r.issueType}</span>
                <span className="pill" style={{ background: SEVERITY_COLOR[r.severity] }}>
                  {r.severity}
                </span>
              </div>
              <p className="desc">{r.description}</p>
              <div className="meta">
                <span>Confidence {Math.round(r.confidence)}%</span>
                {r.reportCount > 1 && (
                  <span className="cluster">👥 {r.reportCount} citizens reported</span>
                )}
                <span className="status">{r.status}</span>
              </div>
              {(r.lat == null || r.lng == null) && (
                <div className="no-loc">📍 Location unavailable — not shown on map</div>
              )}

              {r.isCivicIssue === false || r.issueType === "Other" ? (
                <div className="not-civic">
                  ⚠️ Not a public infrastructure issue — no complaint needed.
                </div>
              ) : !r.complaint ? (
                <button
                  className={`complaint-btn${draftingId === r.id ? " agent-working" : ""}`}
                  onClick={() => generateComplaint(r.id)}
                  disabled={draftingId === r.id}
                >
                  {draftingId === r.id ? "⟳ Agent drafting…" : "✍️ Generate Official Complaint"}
                </button>
              ) : (
                <div className="complaint-box">
                  <div className="complaint-head">
                    📨 Drafted complaint → <strong>{r.department}</strong>
                  </div>
                  <pre className="complaint-text">{r.complaint}</pre>
                </div>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
