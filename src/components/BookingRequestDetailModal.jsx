
import { Modal, Button } from "react-bootstrap";
import {
  CheckCircle2,
  XCircle,
  Clock3,
  Ban,
  MapPin,
  Phone,
  Store,
  CalendarClock,
  Scissors,
  IndianRupee,
  Ticket,
  UserRound,
  Receipt,
  Timer,
} from "lucide-react";

// ==========================================
// DATE & FORMAT HELPERS
// ==========================================

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
    minute: "2-digit",
    hour12: true,
  });
};

const istDay = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
};

const clock = (value) => {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})/);

  if (!match) return value || "—";

  const hours = Number(match[1]);
  return `${hours % 12 || 12}:${match[2]} ${hours >= 12 ? "PM" : "AM"}`;
};

const money = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";

  return `₹${num.toLocaleString("en-IN")}`;
};

const seconds = (value) => {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) return "—";

  const total = Math.max(0, Math.round(Number(value)));

  if (total < 60) return `${total} seconds`;

  const minutes = Math.floor(total / 60);
  const rest = total % 60;

  return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
};

// ==========================================
// STATUS CONFIGURATION
// ==========================================

export const LIFECYCLE = {
  PENDING: {
    label: "Awaiting answer",
    tone: "warning",
    Icon: Clock3,
  },
  ACCEPTED: {
    label: "Accepted",
    tone: "success",
    Icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejected",
    tone: "danger",
    Icon: XCircle,
  },
  AUTO_CANCELLED: {
    label: "Auto-cancelled",
    tone: "secondary",
    Icon: Clock3,
  },
  CANCELLED: {
    label: "Cancelled by customer",
    tone: "secondary",
    Icon: Ban,
  },
  DELAYED: {
    label: "Delayed",
    tone: "info",
    Icon: CalendarClock,
  },
};

// ==========================================
// COMPONENT
// ==========================================

const BookingRequestDetailModal = ({ show, request, onHide }) => {
  if (!request) return null;

  const meta = LIFECYCLE[request.status] || LIFECYCLE.PENDING;
  const StatusIcon = meta.Icon;

  const services = Array.isArray(request.services)
    ? request.services
    : [];

  const total = Number(
    request.total ??
    services.reduce(
      (sum, item) => sum + (Number(item.price) || 0),
      0
    )
  );

  // Build lifecycle timeline
  const events = [
    {
      title: "Request sent",
      description: "Customer submitted a booking request",
      date: request.createdAt,
      Icon: Clock3,
      tone: "primary",
    },
  ];

  if (request.status === "PENDING") {
    events.push({
      title: "Waiting for salon response",
      description: "The salon has not answered this request yet",
      date: request.expiresAt,
      Icon: Timer,
      tone: "warning",
    });
  }

  if (request.status === "AUTO_CANCELLED") {
    events.push({
      title: "Automatically cancelled",
      description:
        "No answer within 60 seconds. The requested slot was released automatically.",
      date: request.respondedAt || request.expiresAt,
      Icon: Clock3,
      tone: "secondary",
    });
  }

  if (request.status === "REJECTED") {
    events.push({
      title: "Rejected by salon",
      description: "The salon declined this booking request",
      date: request.respondedAt,
      Icon: XCircle,
      tone: "danger",
    });
  }

  if (request.status === "CANCELLED") {
    events.push({
      title: "Cancelled by customer",
      description: "The customer withdrew this request",
      date: request.respondedAt,
      Icon: Ban,
      tone: "secondary",
    });
  }

  if (request.status === "ACCEPTED") {
    events.push({
      title: "Accepted by salon",
      description: "The salon accepted this booking request",
      date: request.respondedAt,
      Icon: CheckCircle2,
      tone: "success",
    });
  }

  return (
    <>
      <style>{`
        /* ===================================
           MODAL
        =================================== */

        .booking-request-modal {
          width: calc(100% - 32px);
          max-width: 860px;
          margin: 16px auto;
        }

        .booking-request-modal .modal-content {
          border: 0;
          border-radius: 16px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 20px 65px rgba(15, 23, 42, 0.18);
        }

        /* HEADER */

        .booking-detail-header {
          padding: 20px 24px;
          background: #fff;
          border-bottom: 1px solid #edf0f3;
        }

        .booking-header-content {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
          width: 100%;
        }

        .booking-header-icon {
          width: 44px;
          height: 44px;
          min-width: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          color: #fff;
          background: #182b49;
        }

        .booking-detail-title {
          font-size: 19px;
          font-weight: 700;
          color: #172033;
          line-height: 1.4;
        }

        .booking-header-subtitle {
          margin-top: 4px;
          color: #788397;
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        .booking-header-dot {
          margin: 0 7px;
        }

        /* STATUS BADGES */

        .booking-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 650;
          white-space: nowrap;
        }

        .booking-status-badge.success {
          color: #16804a;
          background: #e7f7ee;
        }

        .booking-status-badge.warning {
          color: #9a6700;
          background: #fff5d9;
        }

        .booking-status-badge.danger {
          color: #c52b36;
          background: #ffebed;
        }

        .booking-status-badge.secondary {
          color: #596273;
          background: #edf0f3;
        }

        .booking-status-badge.info {
          color: #1769aa;
          background: #e6f3ff;
        }

        /* BODY */

        .booking-detail-body {
          padding: 22px 24px;
          background: #f7f8fa;
          max-height: calc(100vh - 175px);
        }

        /* COMMON CARDS */

        .booking-info-card {
          min-width: 0;
          padding: 18px;
          background: #fff;
          border: 1px solid #e9edf2;
          border-radius: 12px;
        }

        .booking-parties-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 14px;
        }

        .booking-section-heading {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 15px;
          color: #263247;
          font-size: 13px;
          font-weight: 700;
        }

        .booking-section-icon {
          width: 34px;
          height: 34px;
          display: flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
        }

        .booking-section-icon.customer {
          color: #4169bc;
          background: #edf3ff;
        }

        .booking-section-icon.salon {
          color: #16845c;
          background: #e8f8f0;
        }

        .booking-section-icon.requested {
          color: #8155bd;
          background: #f2edff;
        }

        .booking-section-icon.lifecycle {
          color: #bd7920;
          background: #fff4e5;
        }

        .booking-party-name {
          color: #172033;
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 7px;
          overflow-wrap: anywhere;
        }

        .booking-contact-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #3971c7;
          font-size: 13px;
          text-decoration: none;
          overflow-wrap: anywhere;
        }

        .booking-contact-link:hover {
          color: #204e99;
          text-decoration: underline;
        }

        .booking-location {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 9px;
          color: #7b8798;
          font-size: 12px;
        }

        .booking-muted-text {
          color: #98a1af;
          font-size: 12px;
        }

        /* BOOKING INFORMATION */

        .booking-requested-card {
          margin-bottom: 14px;
        }

        .booking-request-meta {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          padding: 15px;
          background: #f8f9fb;
          border-radius: 9px;
        }

        .booking-meta-item {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
        }

        .booking-meta-label {
          color: #8993a3;
          font-size: 11px;
          font-weight: 600;
        }

        .booking-meta-value {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #263247;
          font-size: 13px;
          font-weight: 650;
          overflow-wrap: anywhere;
        }

        .booking-meta-value svg {
          flex-shrink: 0;
        }

        .booking-meta-value.booking-total {
          color: #16804a;
          font-size: 15px;
        }

        /* SERVICES */

        .booking-services {
          margin-top: 18px;
        }

        .booking-services-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          color: #3d495c;
          font-size: 12px;
          font-weight: 700;
        }

        .booking-services-heading span {
          color: #8993a3;
          font-size: 11px;
          font-weight: 500;
        }

        .booking-services-list {
          border: 1px solid #edf0f3;
          border-radius: 9px;
          overflow: hidden;
        }

        .booking-service-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 11px 13px;
          background: #fff;
          border-bottom: 1px solid #edf0f3;
        }

        .booking-service-row:last-child {
          border-bottom: 0;
        }

        .booking-service-name {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          color: #344054;
          font-size: 13px;
          font-weight: 500;
          overflow-wrap: anywhere;
        }

        .booking-service-number {
          width: 23px;
          height: 23px;
          min-width: 23px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          background: #f0f2f5;
          color: #687487;
          font-size: 11px;
          font-weight: 650;
        }

        .booking-service-price {
          flex-shrink: 0;
          color: #263247;
          font-size: 13px;
          font-weight: 650;
        }

        .booking-empty-services {
          color: #8993a3;
          font-size: 12px;
          padding: 12px;
          background: #f8f9fb;
          border-radius: 8px;
        }

        /* LIFECYCLE TIMELINE */

        .booking-lifecycle-card {
          margin-bottom: 2px;
        }

        .booking-section-description {
          margin-top: 3px;
          color: #929baa;
          font-size: 11px;
          font-weight: 400;
        }

        .booking-timeline {
          position: relative;
          margin-top: 20px;
          margin-left: 7px;
        }

        .booking-timeline-item {
          position: relative;
          display: flex;
          gap: 15px;
          padding-bottom: 23px;
        }

        .booking-timeline-item:last-child {
          padding-bottom: 5px;
        }

        .booking-timeline-item:not(:last-child)::after {
          content: "";
          position: absolute;
          top: 30px;
          left: 14px;
          bottom: 0;
          width: 2px;
          background: #e9edf2;
        }

        .booking-timeline-indicator {
          width: 30px;
          height: 30px;
          min-width: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          z-index: 1;
          background: #edf3ff;
          color: #4169bc;
        }

        .booking-timeline-item.success .booking-timeline-indicator {
          background: #e6f7ed;
          color: #16804a;
        }

        .booking-timeline-item.warning .booking-timeline-indicator {
          background: #fff4dd;
          color: #a66a00;
        }

        .booking-timeline-item.danger .booking-timeline-indicator {
          background: #ffebed;
          color: #cf3440;
        }

        .booking-timeline-item.secondary .booking-timeline-indicator {
          background: #edf0f3;
          color: #687487;
        }

        .booking-timeline-content {
          flex: 1;
          min-width: 0;
          padding-top: 2px;
        }

        .booking-timeline-title {
          color: #273449;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .booking-timeline-description {
          margin-top: 3px;
          color: #7e8999;
          font-size: 12px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .booking-timeline-date {
          margin-top: 6px;
          color: #8d97a6;
          font-size: 11px;
          line-height: 1.5;
        }

        /* RESPONSE TIME */

        .booking-response-time {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 15px;
          margin-top: 15px;
          background: #f7f8fa;
          border-radius: 9px;
        }

        .booking-response-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #647084;
          font-size: 12px;
          font-weight: 600;
        }

        .booking-response-value {
          color: #263247;
          font-size: 13px;
          font-weight: 700;
        }

        /* BOOKING CONVERSION */

        .booking-conversion {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 14px;
          margin-top: 14px;
          border-radius: 9px;
          background: #f2f4f7;
          color: #687487;
        }

        .booking-conversion.converted {
          background: #eaf8f0;
          color: #16804a;
        }

        .booking-conversion > svg {
          flex-shrink: 0;
        }

        .booking-conversion-title {
          font-size: 12px;
          font-weight: 700;
        }

        .booking-conversion-description {
          margin-top: 3px;
          font-size: 11px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        /* FOOTER */

        .booking-detail-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 15px 24px;
          background: #fff;
          border-top: 1px solid #edf0f3;
        }

        .booking-readonly-note {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #8b95a3;
          font-size: 11px;
        }

        .booking-close-btn {
          padding: 8px 22px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
        }

        /* ===================================
           RESPONSIVE
        =================================== */

        @media (max-width: 767px) {
          .booking-request-modal {
            width: calc(100% - 20px);
            max-width: none;
            margin: 10px auto;
          }

          .booking-detail-header {
            padding: 15px;
          }

          .booking-detail-body {
            padding: 14px;
          }

          .booking-parties-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .booking-info-card {
            padding: 14px;
          }

          .booking-request-meta {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px 10px;
          }

          .booking-detail-title {
            font-size: 16px;
          }

          .booking-header-icon {
            width: 38px;
            height: 38px;
            min-width: 38px;
          }

          .booking-detail-footer {
            padding: 12px 15px;
          }
        }

        @media (max-width: 380px) {
          .booking-detail-title {
            font-size: 14px;
          }

          .booking-header-subtitle {
            font-size: 10px;
          }

          .booking-status-badge {
            font-size: 10px;
            padding: 4px 7px;
          }

          .booking-request-meta {
            grid-template-columns: 1fr 1fr;
          }

          .booking-readonly-note {
            font-size: 10px;
          }
        }
      `}</style>

      <Modal
        show={show}
        onHide={onHide}
        centered
        size="xl"
        scrollable
        backdrop="static"
        dialogClassName="booking-request-modal"
      >
        {/* HEADER */}
        <Modal.Header closeButton className="booking-detail-header">
          <div className="booking-header-content">
            <div className="booking-header-icon">
              <Receipt size={21} />
            </div>

            <div className="flex-grow-1 min-w-0">
              <div className="d-flex align-items-center flex-wrap gap-2">
                <Modal.Title className="booking-detail-title">
                  Booking Request
                </Modal.Title>

                <span className={`booking-status-badge ${meta.tone}`}>
                  <StatusIcon size={13} />
                  {meta.label}
                </span>
              </div>

              <div className="booking-header-subtitle">
                #{String(request.bookingRequestId || "")
                  .slice(0, 8)
                  .toUpperCase()}
                <span className="booking-header-dot">•</span>
                Sent {istDate(request.createdAt)}
              </div>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body className="booking-detail-body">

          {/* CUSTOMER & SALON */}
          <div className="booking-parties-grid">

            <div className="booking-info-card">
              <div className="booking-section-heading">
                <div className="booking-section-icon customer">
                  <UserRound size={17} />
                </div>
                Customer Details
              </div>

              <div className="booking-party-name">
                {request.customerName || "—"}
              </div>

              {request.customerPhone ? (
                <a
                  href={`tel:${request.customerPhone}`}
                  className="booking-contact-link"
                >
                  <Phone size={14} />
                  {request.customerPhone}
                </a>
              ) : (
                <div className="booking-muted-text">
                  No phone on file
                </div>
              )}

              <div className="booking-location">
                <MapPin size={14} />
                {request.city || "—"}
              </div>
            </div>

            <div className="booking-info-card">
              <div className="booking-section-heading">
                <div className="booking-section-icon salon">
                  <Store size={17} />
                </div>
                Salon Details
              </div>

              <div className="booking-party-name">
                {request.salonName || "—"}
              </div>

              {request.salonPhone ? (
                <a
                  href={`tel:${request.salonPhone}`}
                  className="booking-contact-link"
                >
                  <Phone size={14} />
                  {request.salonPhone}
                </a>
              ) : (
                <div className="booking-muted-text">
                  No phone on file
                </div>
              )}
            </div>

          </div>

          {/* BOOKING INFORMATION */}
          <div className="booking-info-card booking-requested-card">

            <div className="booking-section-heading">
              <div className="booking-section-icon requested">
                <CalendarClock size={17} />
              </div>
              Booking Information
            </div>

            <div className="booking-request-meta">

              <div className="booking-meta-item">
                <span className="booking-meta-label">
                  Appointment Date
                </span>
                <span className="booking-meta-value">
                  {istDay(request.bookingDate)}
                </span>
              </div>

              <div className="booking-meta-item">
                <span className="booking-meta-label">
                  Appointment Time
                </span>
                <span className="booking-meta-value">
                  {clock(request.bookingTime)}
                </span>
              </div>

              <div className="booking-meta-item">
                <span className="booking-meta-label">
                  Barber
                </span>
                <span className="booking-meta-value">
                  <Scissors size={14} />
                  {request.barberName || "Any barber"}
                </span>
              </div>

              <div className="booking-meta-item">
                <span className="booking-meta-label">
                  Estimated Total
                </span>
                <span className="booking-meta-value booking-total">
                  <IndianRupee size={15} />
                  {money(total)}
                </span>
              </div>

            </div>

            {/* SERVICES */}
            <div className="booking-services">
              <div className="booking-services-heading">
                Requested Services
                <span>{services.length} items</span>
              </div>

              {services.length > 0 ? (
                <div className="booking-services-list">
                  {services.map((item, index) => (
                    <div
                      className="booking-service-row"
                      key={item.serviceId || index}
                    >
                      <div className="booking-service-name">
                        <span className="booking-service-number">
                          {index + 1}
                        </span>
                        {item.serviceName || "Service"}
                      </div>

                      <div className="booking-service-price">
                        {money(item.price)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="booking-empty-services">
                  No services recorded on this request.
                </div>
              )}
            </div>
          </div>

          {/* LIFECYCLE */}
          <div className="booking-info-card booking-lifecycle-card">

            <div className="booking-section-heading">
              <div className="booking-section-icon lifecycle">
                <Clock3 size={17} />
              </div>

              <div>
                <div>Request Lifecycle</div>
                <div className="booking-section-description">
                  Track the complete history of this request
                </div>
              </div>
            </div>

            <div className="booking-timeline">
              {events.map((event, index) => {
                const EventIcon = event.Icon;

                return (
                  <div
                    className={`booking-timeline-item ${event.tone}`}
                    key={index}
                  >
                    <div className="booking-timeline-indicator">
                      <EventIcon size={16} />
                    </div>

                    <div className="booking-timeline-content">
                      <div className="booking-timeline-title">
                        {event.title}
                      </div>

                      <div className="booking-timeline-description">
                        {event.description}
                      </div>

                      <div className="booking-timeline-date">
                        {istDate(event.date)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RESPONSE TIME */}
            {request.responseSeconds !== null &&
              request.responseSeconds !== undefined && (
                <div className="booking-response-time">
                  <div className="booking-response-label">
                    <Timer size={16} />
                    Response Time
                  </div>

                  <div className="booking-response-value">
                    {seconds(request.responseSeconds)}
                  </div>
                </div>
              )}

            {/* BOOKING CONVERSION */}
            <div
              className={`booking-conversion ${request.bookingId ? "converted" : ""
                }`}
            >
              {request.bookingId ? (
                <>
                  <CheckCircle2 size={18} />

                  <div>
                    <div className="booking-conversion-title">
                      Booking Created Successfully
                    </div>

                    <div className="booking-conversion-description">
                      This request became booking #
                      {String(request.bookingId)
                        .slice(0, 8)
                        .toUpperCase()}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Ticket size={18} />

                  <div>
                    <div className="booking-conversion-title">
                      No Booking Created
                    </div>

                    <div className="booking-conversion-description">
                      This request never became a booking.
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>

        </Modal.Body>

        {/* FOOTER */}
        <Modal.Footer className="booking-detail-footer">
          <div className="booking-readonly-note">
            <Ban size={14} />
            Read-only · Managed by the salon
          </div>

          <Button
            variant="dark"
            className="booking-close-btn"
            onClick={onHide}
          >
            Close
          </Button>
        </Modal.Footer>

      </Modal>
    </>
  );
};

export default BookingRequestDetailModal;
