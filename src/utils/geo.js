// Geo helpers for the admin panel + distributor portal.
//
// The admin needs one answer about two points on the map: HOW FAR APART are
// they? Every surface that shows it (the distributor list, the assign drawer
// on an order, the distributor portal, a live GPS refresh) asks this module,
// so the KM in two places can never disagree.
//
// It is the great-circle (haversine) distance, the same formula the backend
// uses in `my_naai_backend/src/utils/geo.js`; the server is the source of
// truth for stored `distanceKm`, and these helpers exist so the UI can sort
// and label without a round trip (and still work while offline).
const EARTH_RADIUS_KM = 6371;

export const toCoordinate = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const isValidLatitude = (value) => {
  const n = toCoordinate(value);
  return n !== null && n >= -90 && n <= 90;
};

export const isValidLongitude = (value) => {
  const n = toCoordinate(value);
  return n !== null && n >= -180 && n <= 180;
};

// A location needs BOTH halves; half a coordinate is a data-entry bug.
export const toPoint = (source) => {
  if (!source) return null;
  const latitude = toCoordinate(source.latitude);
  const longitude = toCoordinate(source.longitude);
  if (latitude === null || longitude === null) return null;
  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) return null;
  return { latitude, longitude };
};

export const haversineKm = (fromLat, fromLon, toLat, toLon) => {
  const lat1 = Number(fromLat);
  const lon1 = Number(fromLon);
  const lat2 = Number(toLat);
  const lon2 = Number(toLon);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a))));
};

export const roundKm = (km, digits = 2) => {
  if (!Number.isFinite(km)) return null;
  const factor = 10 ** digits;
  return Math.round(km * factor) / factor;
};

export const distanceKm = (from, to) => {
  const a = toPoint(from);
  const b = toPoint(to);
  if (!a || !b) return null;
  return roundKm(haversineKm(a.latitude, a.longitude, b.latitude, b.longitude));
};

// "4.2 km" / "850 m" — a dispatcher reads metres for a walk across the road,
// kilometres for anything further. `null` means "no location", never 0.
export const formatKm = (km) => {
  if (!Number.isFinite(Number(km))) return null;
  const value = Number(km);
  if (value < 1) return `${Math.max(0, Math.round(value * 1000))} m`;
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} km`;
};

// Nearest first. Partners with no pin go last (unknown is not "near"), then
// ties break by name so the list does not reshuffle between renders.
export const sortByDistance = (rows = [], reference = null) => {
  const list = [...rows];
  if (!toPoint(reference)) {
    return list.sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")));
  }
  return list.sort((a, b) => {
    const aKm = Number.isFinite(Number(a?.distanceKm)) ? Number(a.distanceKm) : distanceKm(a, reference);
    const bKm = Number.isFinite(Number(b?.distanceKm)) ? Number(b.distanceKm) : distanceKm(b, reference);
    if (aKm === null && bKm === null) return String(a?.name || "").localeCompare(String(b?.name || ""));
    if (aKm === null) return 1;
    if (bKm === null) return -1;
    if (aKm !== bKm) return aKm - bKm;
    return String(a?.name || "").localeCompare(String(b?.name || ""));
  });
};

// Key-less deep link — opens whatever map app the device has.
export const mapsUrl = (source) => {
  const point = toPoint(source);
  if (!point) return null;
  return `https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}`;
};

export const directionsUrl = (from, to) => {
  const start = toPoint(from);
  const end = toPoint(to);
  if (!end) return null;
  if (!start) return mapsUrl(end);
  return `https://www.google.com/maps/dir/?api=1&origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}`;
};

// "21.14580, 79.08820" — enough precision to identify a gate, short enough to
// read out over the phone.
export const formatCoordinates = (source, digits = 5) => {
  const point = toPoint(source);
  if (!point) return "";
  return `${point.latitude.toFixed(digits)}, ${point.longitude.toFixed(digits)}`;
};

// A stored live fix is only useful while it is fresh; the admin should be able
// to see that a partner's pin was set three weeks ago.
export const locationAgeLabel = (value) => {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return "";
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(then).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// Browser GPS, in one place so both the admin panel and the distributor
// portal ask the same way (and report the same reasons when it fails).
export const requestBrowserLocation = ({ timeout = 12000, maximumAge = 30000 } = {}) =>
  new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ ok: false, message: "This browser cannot share a location." });
      return;
    }
    if (typeof window !== "undefined" && window.isSecureContext === false) {
      resolve({ ok: false, message: "Location needs an HTTPS page." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        ok: true,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      }),
      (error) => resolve({
        ok: false,
        code: error?.code || 0,
        message: error?.code === 1
          ? "Location permission was blocked. Allow it in the browser, then try again."
          : error?.code === 2
            ? "Your device has no location fix right now."
            : "Getting your location took too long. Try again."
      }),
      { enableHighAccuracy: true, timeout, maximumAge }
    );
  });
