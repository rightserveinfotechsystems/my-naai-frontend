import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toPoint } from "../utils/geo";

/**
 * LocationMap — the one map component in the panel.
 *
 * Free stack on purpose: OpenStreetMap raster tiles rendered by Leaflet. No
 * API key, no billing account, no Google Maps SDK to keep in sync with a
 * project. The component is deliberately small:
 *
 *   · read-only mode  — the delivery location on an order, the pin a salon
 *                       saved, the partner's live position;
 *   · editable mode   — drop/move a pin (map click, drag, GPS, typed
 *                       coordinates) while adding or editing a distributor.
 *
 * Markers are drawn as div-icons rather than Leaflet's default PNG icon: the
 * default icon resolves its image path at runtime, which breaks under Vite's
 * bundling and leaves a broken-image square on the map.
 */

const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors';
// India, zoomed out — the neutral view when nothing has a coordinate yet.
const FALLBACK_CENTER = [21.1458, 79.0882];
const FALLBACK_ZOOM = 5;

const pinIcon = (color) =>
  L.divIcon({
    className: "mynaai-map-pin-wrap",
    html: `<span class="mynaai-map-pin" style="--pin-color:${color}"><span class="mynaai-map-pin-dot"></span></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

const LocationMap = ({
  value = null,
  markers = [],
  onChange = null,
  readOnly = false,
  height = 220,
  zoom = null,
  fit = false,
  ariaLabel = "Map",
  style = {}
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const primaryMarkerRef = useRef(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const point = toPoint(value);

  // Extra pins (the salon's location, the partner's live fix, …). A stable
  // signature keeps the marker-sync effect from re-running on every render of
  // a parent that rebuilds its array.
  const markerSignature = useMemo(
    () =>
      (markers || [])
        .map((marker) => {
          const p = toPoint(marker);
          return p ? `${p.latitude.toFixed(5)},${p.longitude.toFixed(5)},${marker.color || ""},${marker.label || ""}` : "";
        })
        .filter(Boolean)
        .join("|"),
    [markers]
  );

  /* ---------------- map lifecycle ---------------- */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;
    const start = toPoint(value) || { latitude: FALLBACK_CENTER[0], longitude: FALLBACK_CENTER[1] };
    const map = L.map(containerRef.current, {
      center: [start.latitude, start.longitude],
      zoom: zoom || (toPoint(value) ? 13 : FALLBACK_ZOOM),
      scrollWheelZoom: false,
      attributionControl: true
    });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    // A modal that animates in has a 0×0 container at mount; sizing once after
    // the transition (and on any later resize) is what stops the grey tiles.
    const settle = () => {
      try {
        map.invalidateSize();
      } catch {
        /* the map was already torn down */
      }
    };
    const timer = setTimeout(settle, 120);
    let observer = null;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      observer = new ResizeObserver(settle);
      observer.observe(containerRef.current);
    }
    window.addEventListener("resize", settle);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", settle);
      if (observer) observer.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      primaryMarkerRef.current = null;
    };
    // Mount-only: `value`/`zoom` changes are handled by the sync effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- click / drag to set the pin ---------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || readOnly || !onChange) return undefined;
    map.getContainer().classList.add("mynaai-map-editable");
    const handleClick = (event) => {
      onChangeRef.current?.({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6))
      });
    };
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
      map.getContainer()?.classList.remove("mynaai-map-editable");
    };
  }, [readOnly, onChange]);

  /* ---------------- markers ---------------- */
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    primaryMarkerRef.current = null;

    if (point) {
      const marker = L.marker([point.latitude, point.longitude], {
        icon: pinIcon(readOnly ? "#0d6efd" : "#198754"),
        draggable: !readOnly && Boolean(onChange),
        keyboard: false,
        title: readOnly ? "Location" : "Drag to adjust the location"
      }).addTo(layer);
      if (!readOnly && onChange) {
        marker.on("dragend", () => {
          const next = marker.getLatLng();
          onChangeRef.current?.({
            latitude: Number(next.lat.toFixed(6)),
            longitude: Number(next.lng.toFixed(6))
          });
        });
      }
      primaryMarkerRef.current = marker;
    }

    const extraPoints = [];
    (markers || []).forEach((raw) => {
      const p = toPoint(raw);
      if (!p) return;
      extraPoints.push([p.latitude, p.longitude]);
      L.marker([p.latitude, p.longitude], {
        icon: pinIcon(raw.color || "#dc3545"),
        keyboard: false,
        title: raw.label || "Location"
      })
        .addTo(layer)
        .bindPopup(raw.label ? `<strong>${raw.label}</strong>` : "");
    });

    if (point) extraPoints.push([point.latitude, point.longitude]);
    if (!extraPoints.length) return;

    if (fit && extraPoints.length > 1) {
      map.fitBounds(L.latLngBounds(extraPoints).pad(0.35), { maxZoom: 14, animate: false });
      return;
    }
    map.setView(extraPoints[extraPoints.length - 1], zoom || Math.max(map.getZoom(), 13), { animate: false });
  }, [point?.latitude, point?.longitude, markerSignature, readOnly, onChange, fit, zoom]);

  const empty = !point && !(markers || []).some((marker) => toPoint(marker));

  return (
    <div className="position-relative" style={{ borderRadius: "10px", overflow: "hidden", ...style }}>
      <div
        ref={containerRef}
        role="img"
        aria-label={ariaLabel}
        style={{ height: `${height}px`, width: "100%", background: "#eef2f6" }}
      />
      {empty && (
        <div
          className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center text-center px-3"
          style={{ background: "rgba(248,249,250,0.92)", pointerEvents: "none" }}
        >
          <div className="small text-muted">
            <strong className="d-block text-dark mb-1">No location saved yet</strong>
            {readOnly ? "This record has no coordinates." : "Click the map, drag the pin, or use your current location."}
          </div>
        </div>
      )}
      <style>{`
        .mynaai-map-pin {
          display: block;
          width: 24px;
          height: 24px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          background: var(--pin-color, #198754);
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        .mynaai-map-pin-dot {
          position: absolute;
          inset: 6px;
          border-radius: 50%;
          background: #ffffff;
          display: block;
        }
        .mynaai-map-editable { cursor: crosshair; }
        .leaflet-container { font: inherit; }
      `}</style>
    </div>
  );
};

export default LocationMap;
