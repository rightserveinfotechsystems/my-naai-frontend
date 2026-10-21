import { useEffect, useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { Crosshair, ExternalLink, MapPin, Search, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import LocationMap from "./LocationMap.jsx";
import {
  formatCoordinates,
  isValidLatitude,
  isValidLongitude,
  mapsUrl,
  requestBrowserLocation,
  toCoordinate,
  toPoint
} from "../utils/geo";

/**
 * LocationField — the "where is this?" control used by Add/Edit Distributor
 * and by the delivery-pin correction on an order.
 *
 * Four ways in, because a dispatcher is not always standing at the point:
 *   1. a map click (or dragging the pin);
 *   2. "Use my current location" (browser GPS — the phone in their hand);
 *   3. a place search (OpenStreetMap Nominatim, no key);
 *   4. typing the coordinates (read off another device or a paper sheet).
 *
 * `onChange({ latitude, longitude } | null)` — null clears the pin.
 */
const LocationField = ({
  value = null,
  onChange,
  label = "Location",
  helper = "Pin the pickup / base point. This is what makes the KM and the nearest-first list work.",
  height = 240,
  disabled = false,
  required = false
}) => {
  const point = toPoint(value);
  const [latText, setLatText] = useState(point ? String(point.latitude) : "");
  const [lngText, setLngText] = useState(point ? String(point.longitude) : "");
  const [locating, setLocating] = useState(false);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);

  // Keep the text inputs in step with the pin (map click, GPS, or a parent
  // that loaded a saved distributor), without fighting the user while typing.
  useEffect(() => {
    if (!point) {
      setLatText("");
      setLngText("");
      return;
    }
    setLatText(String(point.latitude));
    setLngText(String(point.longitude));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [point?.latitude, point?.longitude]);

  const commit = (next) => {
    if (disabled) return;
    const clean = toPoint(next);
    onChange?.(clean ? { latitude: clean.latitude, longitude: clean.longitude } : null);
  };

  const useCurrentLocation = async () => {
    if (disabled) return;
    setLocating(true);
    try {
      const result = await requestBrowserLocation();
      if (!result.ok) {
        toast.error(result.message || "Could not read this device's location");
        return;
      }
      commit({ latitude: result.latitude, longitude: result.longitude });
      toast.success("Current location captured");
    } finally {
      setLocating(false);
    }
  };

  const applyTypedCoordinates = () => {
    const latitude = toCoordinate(latText);
    const longitude = toCoordinate(lngText);
    if (latitude === null && longitude === null) {
      commit(null);
      return;
    }
    if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
      toast.error("Enter a valid pair — latitude −90…90 and longitude −180…180");
      return;
    }
    commit({ latitude, longitude });
  };

  const runSearch = async (event) => {
    event.preventDefault();
    const query = search.trim();
    if (query.length < 3) {
      toast.error("Type at least 3 characters to search a place");
      return;
    }
    setSearching(true);
    try {
      // Free & key-less. `countrycodes=in` because every partner so far is in
      // India; drop it if the platform ever delivers elsewhere.
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=in&q=${encodeURIComponent(query)}`,
        { headers: { Accept: "application/json" } }
      );
      if (!response.ok) throw new Error("search failed");
      const rows = await response.json();
      setResults(Array.isArray(rows) ? rows : []);
      if (!rows.length) toast.info("No place matched — drop the pin on the map instead.");
    } catch {
      toast.error("Place search is unavailable right now — drop the pin on the map instead.");
    } finally {
      setSearching(false);
    }
  };

  const chooseResult = (row) => {
    commit({ latitude: Number(row.lat), longitude: Number(row.lon) });
    setResults([]);
    setSearch("");
  };

  const openMap = () => {
    const url = mapsUrl(point);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="border rounded-3 p-3" style={{ background: "#fff" }}>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <div>
          <div className="fw-semibold small text-dark d-flex align-items-center gap-1">
            <MapPin size={14} /> {label} {required && <span className="text-danger">*</span>}
          </div>
          <div className="text-muted" style={{ fontSize: "0.78rem" }}>{helper}</div>
        </div>
        <div className="d-flex gap-2">
          <Button
            type="button"
            variant="outline-secondary"
            size="sm"
            className="d-flex align-items-center gap-1"
            onClick={useCurrentLocation}
            disabled={disabled || locating}
          >
            {locating ? <Spinner animation="border" size="sm" /> : <Crosshair size={14} />}
            {locating ? "Locating…" : "Use my location"}
          </Button>
          {point && (
            <>
              <Button type="button" variant="outline-primary" size="sm" className="d-flex align-items-center gap-1" onClick={openMap} disabled={disabled}>
                <ExternalLink size={14} /> Map
              </Button>
              <Button type="button" variant="outline-danger" size="sm" className="d-flex align-items-center gap-1" onClick={() => commit(null)} disabled={disabled}>
                <Trash2 size={14} /> Clear
              </Button>
            </>
          )}
        </div>
      </div>

      <LocationMap
        value={point}
        onChange={commit}
        readOnly={disabled}
        height={height}
        ariaLabel={`${label} map`}
      />

      <Form
        className="d-flex flex-wrap gap-2 align-items-end mt-2"
        onSubmit={(event) => {
          event.preventDefault();
          applyTypedCoordinates();
        }}
      >
        <div style={{ flex: "1 1 130px", minWidth: 0 }}>
          <Form.Label className="small text-muted mb-1" style={{ fontSize: "0.75rem" }}>Latitude</Form.Label>
          <Form.Control
            size="sm"
            value={latText}
            inputMode="decimal"
            placeholder="21.14580"
            onChange={(event) => setLatText(event.target.value)}
            onBlur={applyTypedCoordinates}
            disabled={disabled}
          />
        </div>
        <div style={{ flex: "1 1 130px", minWidth: 0 }}>
          <Form.Label className="small text-muted mb-1" style={{ fontSize: "0.75rem" }}>Longitude</Form.Label>
          <Form.Control
            size="sm"
            value={lngText}
            inputMode="decimal"
            placeholder="79.08820"
            onChange={(event) => setLngText(event.target.value)}
            onBlur={applyTypedCoordinates}
            disabled={disabled}
          />
        </div>
        <div style={{ flex: "1 1 200px", minWidth: 0 }}>
          <Form.Label className="small text-muted mb-1" style={{ fontSize: "0.75rem" }}>Search a place</Form.Label>
          <div className="d-flex gap-1">
            <Form.Control
              size="sm"
              value={search}
              placeholder="e.g. Sitabuldi, Nagpur"
              onChange={(event) => setSearch(event.target.value)}
              disabled={disabled}
            />
            <Button type="submit" size="sm" variant="outline-secondary" onClick={runSearch} disabled={disabled || searching}>
              {searching ? <Spinner animation="border" size="sm" /> : <Search size={14} />}
            </Button>
          </div>
        </div>
      </Form>

      {results.length > 0 && (
        <div className="list-group mt-2" style={{ maxHeight: "150px", overflowY: "auto" }}>
          {results.map((row) => (
            <button
              key={`${row.place_id}`}
              type="button"
              className="list-group-item list-group-item-action py-2 small"
              onClick={() => chooseResult(row)}
            >
              <strong className="d-block text-dark">{row.name || row.display_name}</strong>
              <span className="text-muted" style={{ fontSize: "0.76rem" }}>{row.display_name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-2 small text-muted">
        {point ? (
          <span>
            <strong className="text-dark">Saved point:</strong> {formatCoordinates(point)}
          </span>
        ) : (
          <span>No point set — the partner will not appear as “nearest” until one is saved.</span>
        )}
      </div>
    </div>
  );
};

export default LocationField;
