import { GoogleMap, useLoadScript, InfoWindowF } from "@react-google-maps/api";
import { useState, useRef, useEffect, useMemo } from "react";
import { MAPS_KEY, MAPS_MAP_ID, DEFAULT_CENTER, SEVERITY_COLOR, getIssueMeta } from "../constants/index.js";

// "marker" library is required for AdvancedMarkerElement.
// Stable reference — must not be recreated on every render.
const MAPS_LIBRARIES = ["visualization", "marker"];

function riskColor(score) {
  if (!score) return null;
  if (score >= 75) return "#ef4444";
  if (score >= 50) return "#f97316";
  if (score >= 25) return "#f59e0b";
  return "#22c55e";
}

// Builds a circular HTML element that visually matches the old SymbolPath.CIRCLE style.
function makeCircleContent(scale, color, opacity) {
  const size = Math.round(scale * 2);
  const el = document.createElement("div");
  el.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:${color};opacity:${opacity};border:2.5px solid #fff;box-sizing:border-box;cursor:pointer;`;
  return el;
}

export default function MapView({ reports }) {
  const [active, setActive] = useState(null);
  // mapReady gates imperative marker/heatmap effects until onLoad fires.
  const [mapReady, setMapReady] = useState(false);
  const showHeatmap = false;
  const mapRef = useRef(null);
  const heatmapRef = useRef(null);
  const markersRef = useRef([]);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: MAPS_KEY,
    libraries: MAPS_LIBRARIES,
  });

  const reportsWithCoords = useMemo(() => reports.filter((r) => r.lat && r.lng), [reports]);

  // Auto-fit bounds whenever the set of plotted reports changes or the map becomes ready.
  useEffect(() => {
    if (!mapRef.current || reportsWithCoords.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    reportsWithCoords.forEach((r) => bounds.extend({ lat: r.lat, lng: r.lng }));
    mapRef.current.fitBounds(bounds, 64);
    // Don't zoom to street level for a single pin.
    const listener = window.google.maps.event.addListenerOnce(mapRef.current, "idle", () => {
      if (mapRef.current.getZoom() > 15) mapRef.current.setZoom(15);
    });
    return () => window.google.maps.event.removeListener(listener);
  }, [reportsWithCoords, mapReady]);

  // AdvancedMarkerElement instances — recreated whenever reports or heatmap toggle changes.
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps?.marker?.AdvancedMarkerElement) return;

    // Remove previous markers from the map.
    markersRef.current.forEach((m) => { m.map = null; });
    markersRef.current = [];

    reportsWithCoords.forEach((r) => {
      const scale = Math.max(8, 8 + Math.log2(r.reportCount || 1) * 2.5);
      const color = SEVERITY_COLOR[r.severity] || "#3b82f6";
      const opacity = showHeatmap ? 0.5 : 0.92;

      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: { lat: r.lat, lng: r.lng },
        content: makeCircleContent(scale, color, opacity),
        title: r.issueType || "",
      });

      marker.addListener("click", () => setActive(r));
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => { m.map = null; });
      markersRef.current = [];
    };
  }, [reportsWithCoords, showHeatmap, mapReady]);

  // Heatmap layer: create/destroy as toggled.
  useEffect(() => {
    if (!mapRef.current) return;
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }
    if (!showHeatmap || !window.google?.maps?.visualization || reportsWithCoords.length === 0)
      return;

    const data = reportsWithCoords.map((r) => ({
      location: new window.google.maps.LatLng(r.lat, r.lng),
      weight: Math.max(
        0.2,
        ((r.riskAssessment?.priorityScore ?? 40) / 100) * Math.sqrt(r.reportCount || 1)
      ),
    }));
    heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
      data,
      radius: 40,
      opacity: 0.65,
    });
    heatmapRef.current.setMap(mapRef.current);
    return () => {
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
        heatmapRef.current = null;
      }
    };
  }, [showHeatmap, reportsWithCoords, mapReady]);

  if (!MAPS_KEY) {
    return (
      <div className="map placeholder">
        <span>Add VITE_MAPS_KEY to .env to enable the map</span>
      </div>
    );
  }
  if (!isLoaded) {
    return (
      <div className="map placeholder">
        <span>Loading map…</span>
      </div>
    );
  }

  // Always use DEFAULT_CENTER as the controlled `center` prop.
  // The fitBounds useEffect above handles real positioning after markers load;
  // passing a report coordinate here fights with fitBounds on every re-render.
  return (
    <div className="map-outer">
      <GoogleMap
        mapContainerClassName="map"
        center={DEFAULT_CENTER}
        zoom={12}
        onLoad={(m) => {
          mapRef.current = m;
          setMapReady(true);
        }}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_BOTTOM },
          // mapId is required by AdvancedMarkerElement. Note: mapId and the `styles` option
          // are mutually exclusive — to restore the dark theme, attach a Cloud Map Style
          // to the Map ID configured via VITE_MAPS_MAP_ID in .env.
          mapId: MAPS_MAP_ID,
        }}
      >
        {/* Markers are rendered imperatively via the useEffect above. */}

        {active && active.lat && (
          <InfoWindowF
            position={{ lat: active.lat, lng: active.lng }}
            onCloseClick={() => setActive(null)}
          >
            <div className="iw">
              <div className="iw-head">
                {(() => {
                  const m = getIssueMeta(active.issueType);
                  return (
                    <span className="iw-chip" style={{ background: m.bg, color: m.color }}>
                      {m.emoji} {active.issueType}
                    </span>
                  );
                })()}
                <span className="iw-sev" style={{ color: SEVERITY_COLOR[active.severity] }}>
                  {active.severity}
                </span>
              </div>
              <p className="iw-desc">{active.description}</p>
              {active.geoContext?.road && (
                <div className="iw-row">
                  📍 {active.geoContext.road}, {active.geoContext.suburb || active.geoContext.city}
                </div>
              )}
              {active.reportCount > 1 && (
                <div className="iw-row">👥 {active.reportCount} citizens reported</div>
              )}
              {active.riskAssessment?.priorityScore != null && (
                <div
                  className="iw-row"
                  style={{ color: riskColor(active.riskAssessment.priorityScore) }}
                >
                  ⚡ Priority {active.riskAssessment.priorityScore}/100
                </div>
              )}
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      <div className="map-controls">
        {reportsWithCoords.length > 1 && (
          <button
            type="button"
            className="map-ctrl-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!mapRef.current) return;
              const bounds = new window.google.maps.LatLngBounds();
              reportsWithCoords.forEach((r) => bounds.extend({ lat: r.lat, lng: r.lng }));
              mapRef.current.fitBounds(bounds, 64);
            }}
            title="Fit all markers"
          >
            ⊞ Fit All
          </button>
        )}
      </div>

      {reports.length > 0 && reportsWithCoords.length === 0 && (
        <div className="map-no-loc">📍 No GPS data — reports saved without map pins</div>
      )}
    </div>
  );
}

// Kept for reference. Cannot be used alongside mapId (Google Maps API constraint).
// To restore the dark theme, create a Map Style in Google Cloud Console, link it to
// your Map ID, and set VITE_MAPS_MAP_ID in client/.env.
// const MAP_STYLE = [
//   { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
//   { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
//   { elementType: "labels.text.fill", stylers: [{ color: "#6b6b80" }] },
//   { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#2a2a3e" }] },
//   { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
//   { featureType: "road", elementType: "geometry", stylers: [{ color: "#252540" }] },
//   { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1e1e36" }] },
//   { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#5a5a70" }] },
//   { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2e2e50" }] },
//   { featureType: "transit", elementType: "labels", stylers: [{ visibility: "simplified" }] },
//   { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1e1e36" }] },
//   { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e0e20" }] },
//   { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4a4a60" }] },
//   { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#16162a" }] },
// ];
