import { Modal, Button } from "react-bootstrap";
import { CheckCircle2, XCircle, Clock3, Ban, MapPin, Phone, Store, CalendarClock, Scissors, IndianRupee, Ticket } from "lucide-react";

// Times are IST for every viewer — the panel is operated from India and a
// support call reads the customer's own clock, not the browser's.
const istDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const istDay = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "2-digit", month: "short" });
};

// "18:30:00" -> "6:30 PM" in IST. The API sends a TIME column, so the string is
// read as-is rather than parsed as a date (a bare time has no date to attach).
const clock = (value) => {
  const raw = String(value || "");
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return raw || "—";
  const hours24 = Number(match[1]);
  const minutes = match[2];
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes} ${suffix}`;
};

const money = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `₹${num.toLocaleString("en-IN")}`;
};

const seconds = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  const total = Math.max(0, Math.round(Number(value)));
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}m ${String(rest).padStart(2, "0")}s`;
};

export const LIFECYCLE = {
  PENDING: { label: "Awaiting answer", tone: "warning", Icon: Clock3 },
  ACCEPTED: { label: "Accepted", tone: "success", Icon: CheckCircle2 },
  REJECTED: { label: "Rejected", tone: "danger", Icon: XCircle },
  AUTO_CANCELLED: { label: "Auto-cancelled", tone: "secondary", Icon: Clock3 },
  CANCELLED: { label: "Cancelled by customer", tone: "secondary", Icon: Ban },
  DELAYED: { label: "Delayed", tone: "info", Icon: CalendarClock }
};

/**
 * One booking REQUEST, opened without leaving the tab.
 *
 * This drawer is the reason the tab exists: it shows the whole life of a lead —
 * sent, answered or missed, and how long it took — instead of a status word. An
 * auto-cancel reads "No answer within 60 seconds — the slot was released
 * automatically", never "rejected": the two are different failures and the salon
 * team is asked about them differently.
 *
 * Read-only. An admin does not accept a request on a salon's behalf; conversion
 * happens when the salon accepts, and a second path would produce two bookings.
 */
const BookingRequestDetailModal = ({ show, request, onHide }) => {
  if (!request) return null;

  const meta = LIFECYCLE[request.status] || LIFECYCLE.PENDING;
  const services = Array.isArray(request.services) ? request.services : [];
  const total = Number(request.total ?? services.reduce((sum, item) => sum + (Number(item.price) || 0), 0));

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
      <Modal.Header closeButton className="border-0 pb-0">
        <div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <Modal.Title className="h5 mb-0">{request.customerName || "Customer"}</Modal.Title>
            <span className={`badge bg-${meta.tone}-subtle text-${meta.tone}-emphasis`}>{meta.label}</span>
          </div>
          <div className="text-muted small mt-1">
            Request #{String(request.bookingRequestId || "").slice(0, 8).toUpperCase()} · sent {istDate(request.createdAt)}
          </div>
        </div>
      </Modal.Header>

      <Modal.Body className="pt-3">
        {/* Customer + salon, side by side: the two parties of a lead. */}
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <div className="border rounded-3 p-3 h-100">
              <div className="text-uppercase text-muted small fw-semibold mb-2" style={{ letterSpacing: "0.4px" }}>Customer</div>
              <div className="fw-semibold">{request.customerName || "—"}</div>
              {request.customerPhone ? (
                <a href={`tel:${request.customerPhone}`} className="d-inline-flex align-items-center gap-1 small text-decoration-none">
                  <Phone size={13} /> {request.customerPhone}
                </a>
              ) : (
                <div className="text-muted small">No phone on file</div>
              )}
              <div className="text-muted small d-flex align-items-center gap-1 mt-1">
                <MapPin size={13} /> {request.city || "—"}
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="border rounded-3 p-3 h-100">
              <div className="text-uppercase text-muted small fw-semibold mb-2" style={{ letterSpacing: "0.4px" }}>Salon</div>
              <div className="fw-semibold d-flex align-items-center gap-1">
                <Store size={14} /> {request.salonName || "—"}
              </div>
              {request.salonPhone ? (
                <a href={`tel:${request.salonPhone}`} className="d-inline-flex align-items-center gap-1 small text-decoration-none">
                  <Phone size={13} /> {request.salonPhone}
                </a>
              ) : (
                <div className="text-muted small">No phone on file</div>
              )}
            </div>
          </div>
        </div>

        {/* What was asked for. Prices are the snapshot taken at request time, so
            an edited price list does not rewrite history. */}
        <div className="border rounded-3 p-3 mb-3">
          <div className="text-uppercase text-muted small fw-semibold mb-2" style={{ letterSpacing: "0.4px" }}>Requested</div>
          <div className="d-flex flex-wrap gap-2 mb-2">
            <span className="badge bg-light text-dark border d-inline-flex align-items-center gap-1">
              <CalendarClock size={12} /> {istDay(request.bookingDate)} · {clock(request.bookingTime)}
            </span>
            <span className="badge bg-light text-dark border d-inline-flex align-items-center gap-1">
              <Scissors size={12} /> {request.barberName || "Any barber"}
            </span>
            <span className="badge bg-light text-dark border d-inline-flex align-items-center gap-1">
              <IndianRupee size={12} /> {money(total)}
            </span>
          </div>
          {services.length ? (
            <ul className="list-unstyled mb-0 small">
              {services.map((item, index) => (
                <li key={`${item.serviceId || index}`} className="d-flex justify-content-between border-bottom py-1">
                  <span>{item.serviceName}</span>
                  <span className="text-muted">{money(item.price)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted small">No services recorded on this request.</div>
          )}
        </div>

        {/* The lifecycle: the part that makes this tab worth building. */}
        <div className="border rounded-3 p-3">
          <div className="text-uppercase text-muted small fw-semibold mb-2" style={{ letterSpacing: "0.4px" }}>Lifecycle</div>
          <div className="d-flex flex-column gap-2 small">
            <div className="d-flex justify-content-between">
              <span className="d-flex align-items-center gap-2"><Clock3 size={14} /> Request sent</span>
              <span className="text-muted">{istDate(request.createdAt)}</span>
            </div>

            {request.status === "PENDING" && (
              <div className="d-flex justify-content-between">
                <span className="d-flex align-items-center gap-2"><Clock3 size={14} /> Answer window closes</span>
                <span className="text-muted">{istDate(request.expiresAt)}</span>
              </div>
            )}

            {request.status === "AUTO_CANCELLED" && (
              <div className="d-flex justify-content-between">
                <span className="d-flex align-items-center gap-2 text-secondary">
                  <Clock3 size={14} /> No answer within 60 seconds — the slot was released automatically
                </span>
                <span className="text-muted">{istDate(request.respondedAt || request.expiresAt)}</span>
              </div>
            )}

            {request.status === "REJECTED" && (
              <div className="d-flex justify-content-between">
                <span className="d-flex align-items-center gap-2 text-danger"><XCircle size={14} /> Rejected by the salon</span>
                <span className="text-muted">{istDate(request.respondedAt)}</span>
              </div>
            )}

            {request.status === "CANCELLED" && (
              <div className="d-flex justify-content-between">
                <span className="d-flex align-items-center gap-2 text-secondary"><Ban size={14} /> Withdrawn by the customer</span>
                <span className="text-muted">{istDate(request.respondedAt)}</span>
              </div>
            )}

            {request.status === "ACCEPTED" && (
              <div className="d-flex justify-content-between">
                <span className="d-flex align-items-center gap-2 text-success"><CheckCircle2 size={14} /> Accepted by the salon</span>
                <span className="text-muted">{istDate(request.respondedAt)}</span>
              </div>
            )}

            {request.responseSeconds !== null && request.responseSeconds !== undefined && (
              <div className="d-flex justify-content-between border-top pt-2">
                <span>Answered in</span>
                <span className="fw-semibold">{seconds(request.responseSeconds)}</span>
              </div>
            )}
          </div>

          {/* The request and the booking are different records. This is the only
              place the panel shows the link, and it is a pointer — never a
              merged row. */}
          <div className="mt-3 pt-2 border-top small">
            {request.bookingId ? (
              <span className="d-flex align-items-center gap-2 text-success">
                <Ticket size={14} /> This request became booking #{String(request.bookingId).slice(0, 8).toUpperCase()}
              </span>
            ) : (
              <span className="text-muted">This request never became a booking.</span>
            )}
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="border-0">
        <div className="text-muted small me-auto">Read-only — the salon answers requests from its own app.</div>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BookingRequestDetailModal;
