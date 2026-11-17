// Live updates for the admin panel.
//
// The salon portal has talked to the API over a socket for a long time
// (`salon_<id>` / `user_<id>` rooms). The panel had none, so a booking request
// that arrived while the Booking requests tab was open sat unseen until someone
// pressed Refresh. This is the smallest thing that fixes that: one socket per
// tab, one room — `admin` — and named events.
//
// The server joins the room on `join_admin` (index.js). Rooms are not
// authenticated on the API today (the salon rooms have the same shape), so the
// panel only ever reads what these events carry — an id and a couple of labels —
// and still fetches every row through the authenticated REST endpoints.
import { io } from "socket.io-client";
import { API_BASE_URL } from "./communication.jsx";

let socket = null;
const listeners = new Map();

function ensureSocket() {
  if (socket) return socket;
  socket = io(API_BASE_URL, {
    transports: ["polling", "websocket"],
    upgrade: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    timeout: 20000,
  });
  socket.on("connect", () => {
    socket.emit("join_admin");
  });
  return socket;
}

/**
 * Listen for one admin event until the returned function is called.
 * Subscribing twice to the same event keeps both handlers.
 */
export function subscribeToAdminEvents(event, handler) {
  if (!event || typeof handler !== "function") return () => {};
  const live = ensureSocket();
  if (!listeners.has(event)) listeners.set(event, new Set());
  const handlers = listeners.get(event);
  handlers.add(handler);

  const wrapped = (...args) => {
    if (!handlers.has(handler)) return;
    handler(...args);
  };
  live.on(event, wrapped);

  return () => {
    live.off(event, wrapped);
    handlers.delete(handler);
    if (!handlers.size) listeners.delete(event);
  };
}

// Used by tests and by a sign-out that wants the socket gone.
export function resetAdminLiveSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  listeners.clear();
}
