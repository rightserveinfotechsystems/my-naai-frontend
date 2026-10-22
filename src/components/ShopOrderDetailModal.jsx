import { useState, useEffect } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import { shopOrderAPI, distributorAPI, API_BASE_URL } from "../services/communication";
import { toast } from "react-toastify";
import { Plus, CreditCard, UserPlus, CheckCircle2, XCircle, Truck, Ban, Store, MessageSquare, Eye, Edit3, MapPin, Route, Crosshair } from "lucide-react";
import { INTERNAL_STATUS_META, buyerOf } from "../pages/ShopOrders.jsx";
import LocationField from "./LocationField.jsx";
import LocationMap from "./LocationMap.jsx";
import {
  formatCoordinates,
  formatKm,
  locationAgeLabel,
  mapsUrl,
  sortByDistance,
  toPoint
} from "../utils/geo";

const money = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `₹${num.toLocaleString("en-IN")}`;
};

const dateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const EVENT_META = {
  ORDER_PLACED: { icon: Plus, color: "#0d6efd", label: "Order placed" },
  PAYMENT_CONFIRMED: { icon: CreditCard, color: "#198754", label: "Payment confirmed" },
  ASSIGNED: { icon: UserPlus, color: "#6f42c1", label: "Distributor requested" },
  ACCEPTED: { icon: CheckCircle2, color: "#198754", label: "Distributor accepted" },
  REJECTED: { icon: XCircle, color: "#dc3545", label: "Distributor rejected" },
  STATUS_CHANGED: { icon: Truck, color: "#0d6efd", label: "Status changed" },
  DELIVERY_LOCATION_SET: { icon: MapPin, color: "#0d6efd", label: "Delivery location set" },
  CANCELLED: { icon: Ban, color: "#dc3545", label: "Order cancelled" }
};

const ACTOR_LABELS = {
  ADMIN: "MyNaai Admin",
  DISTRIBUTOR: "Distributor",
  SALON: "Salon",
  CUSTOMER: "Customer",
  SYSTEM: "System"
};

const actorName = (ev) => {
  if (!ev.actor) return ACTOR_LABELS[ev.actorType] || "System";
  const name = ev.actor.name || ev.actor.phone || ev.actor.email;
  return name ? name : ACTOR_LABELS[ev.actorType] || "System";
};

const ShopOrderDetailModal = ({ order, onClose, onStatusChange, onAssign, onRecordDecision, onRefresh }) => {
  const [showAssign, setShowAssign] = useState(false);
  const [distributors, setDistributors] = useState([]);
  const [distributorLoading, setDistributorLoading] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState(false);

  // Image Preview Lightbox State
  const [previewImage, setPreviewImage] = useState(null);

  // Direct Status Override State
  const [manualStatus, setManualStatus] = useState("");

  // Delivery location: the pin the admin/dispatcher sees, and the origin of
  // every "how far?" number on this screen.
  const [showLocationEditor, setShowLocationEditor] = useState(false);
  const [draftLocation, setDraftLocation] = useState(null);
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    setShowAssign(false);
    setShowReject(false);
    setRejectReason("");
    setSelectedDistributor("");
    setShowLocationEditor(false);
    setDraftLocation(null);
    if (order) setManualStatus(order.status || "");
  }, [order]);

  if (!order) return null;

  const meta = INTERNAL_STATUS_META[order.status] || { label: order.status, badge: "bg-secondary-subtle text-secondary" };
  // Who bought it — a salon or a customer; every label below reads from here.
  const buyer = buyerOf(order);
  const items = order.items || [];
  const events = [...(order.events || [])].reverse();

  // The order's delivery location — the point every partner's KM is measured
  // from. `order.deliveryLocation` is computed server-side from the order's
  // snapshot (falling back to the salon's coordinates).
  const deliveryPoint = toPoint(order.deliveryLocation) || toPoint(order.address) || toPoint(order.salon);

  const loadDistributors = async () => {
    setDistributorLoading(true);
    try {
      // Sending the delivery point makes the server answer nearest-first with
      // `distanceKm` on every row, so a partner 40 km away can never be shown
      // above one 2 km away just because their name starts with "A".
      const first = await distributorAPI.list({
        page: 1,
        latitude: deliveryPoint?.latitude,
        longitude: deliveryPoint?.longitude,
        sortBy: deliveryPoint ? "distance" : "name"
      });
      if (!first.success) {
        toast.error(first.message || "Failed to load distributors");
        return;
      }
      let rows = first.data?.distributors || [];
      const totalPages = first.data?.pagination?.totalPages || 1;
      const extra = Math.min(totalPages, 5) - 1;
      if (extra > 0) {
        const pages = await Promise.all(
          Array.from({ length: extra }, (_, i) =>
            distributorAPI.list({
              page: i + 2,
              latitude: deliveryPoint?.latitude,
              longitude: deliveryPoint?.longitude,
              sortBy: deliveryPoint ? "distance" : "name"
            })
          )
        );
        rows = rows.concat(...pages.filter((p) => p.success).map((p) => p.data?.distributors || []));
      }
      // Belt and braces: sort again locally so an older API build (or a page
      // fetched without coordinates) still reads nearest-first.
      setDistributors(deliveryPoint ? sortByDistance(rows, deliveryPoint) : rows);
    } catch {
      toast.error("Failed to load distributors");
    } finally {
      setDistributorLoading(false);
    }
  };

  const openAssign = () => {
    setShowAssign(true);
    if (distributors.length === 0) loadDistributors();
  };

  const confirmAssign = async () => {
    if (!selectedDistributor) { toast.error("Choose a distributor"); return; }
    setAssigning(true);
    try {
      await onAssign(order.orderId, selectedDistributor);
    } finally {
      setAssigning(false);
    }
  };

  const saveDeliveryLocation = async () => {
    const point = toPoint(draftLocation);
    if (!point) { toast.error("Pick a point on the map first"); return; }
    setSavingLocation(true);
    try {
      const result = await shopOrderAPI.setDeliveryLocation({
        orderId: order.orderId,
        latitude: point.latitude,
        longitude: point.longitude
      });
      if (result.success) {
        toast.success("Delivery location saved — distances updated");
        setShowLocationEditor(false);
        // The parent re-fetches the order by id, so the panel (and the list
        // behind it) never keeps a stale copy of the old pin or its KM.
        await onRefresh?.(order.orderId);
      } else {
        toast.error(result.message || "Could not save the delivery location");
      }
    } finally {
      setSavingLocation(false);
    }
  };

  const recordAccept = async () => {
    setBusy(true);
    try { await onRecordDecision(order.orderId, "accept"); }
    finally { setBusy(false); }
  };

  const recordReject = async () => {
    if (rejectReason.trim().length < 3) { toast.error("A rejection reason is required (min 3 characters)"); return; }
    setBusy(true);
    try { await onRecordDecision(order.orderId, "reject", rejectReason.trim()); }
    finally { setBusy(false); }
  };

  const changeStatus = (status) => {
    if (status === "CANCELLED" && !window.confirm("Cancel this order? The salon customer will see it as cancelled.")) return;
    setBusy(true);
    onStatusChange(order.orderId, status);
  };

  const handleManualStatusSave = () => {
    if (!manualStatus || manualStatus === order.status) return;
    if (window.confirm(`Change order status to ${INTERNAL_STATUS_META[manualStatus]?.label || manualStatus}?`)) {
      setBusy(true);
      onStatusChange(order.orderId, manualStatus);
      setBusy(false);
    }
  };

  const statusActionButtons = () => {
    const s = order.status;
    const btns = [];
    if (s === "PENDING_ASSIGNMENT") {
      btns.push(<Button key="assign" variant="success" size="sm" onClick={openAssign} disabled={busy} className="d-flex align-items-center gap-1"><UserPlus size={14} />Assign Distributor</Button>);
    }
    if (s === "AWAITING_ACCEPTANCE") {
      btns.push(<Button key="acc" variant="success" size="sm" onClick={recordAccept} disabled={busy} className="d-flex align-items-center gap-1"><CheckCircle2 size={14} />Record Accept</Button>);
      btns.push(
        <Button key="rej" variant="outline-danger" size="sm" onClick={() => setShowReject((v) => !v)} disabled={busy} className="d-flex align-items-center gap-1">
          <XCircle size={14} />Record Reject
        </Button>
      );
    }
    if (s === "ASSIGNED") {
      btns.push(<Button key="pick" variant="primary" size="sm" onClick={() => changeStatus("PICKED")} disabled={busy} className="d-flex align-items-center gap-1"><Truck size={14} />Mark Picked Up</Button>);
    }
    if (s === "PICKED") {
      btns.push(<Button key="ship" variant="primary" size="sm" onClick={() => changeStatus("SHIPPED")} disabled={busy} className="d-flex align-items-center gap-1"><Truck size={14} />Mark Shipped</Button>);
    }
    if (s === "SHIPPED") {
      btns.push(<Button key="del" variant="success" size="sm" onClick={() => changeStatus("DELIVERED")} disabled={busy} className="d-flex align-items-center gap-1"><CheckCircle2 size={14} />Mark Delivered</Button>);
    }
    if (s !== "CANCELLED" && s !== "DELIVERED") {
      btns.push(<Button key="cancel" variant="outline-danger" size="sm" onClick={() => changeStatus("CANCELLED")} disabled={busy} className="d-flex align-items-center gap-1"><Ban size={14} />Cancel</Button>);
    }
    return btns;
  };

  return (
    <>
      <Modal show={Boolean(order)} onHide={onClose} centered size="xl" backdrop="static">
        <Modal.Header closeButton style={{ borderBottom: "1px solid #e2e8f0", padding: "20px 24px" }}>
          <Modal.Title className="fw-bold d-flex align-items-center gap-2 text-dark" style={{ fontSize: "1.15rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(13, 110, 253, 0.1)", color: "#0d6efd", borderRadius: "8px", width: "36px", height: "36px" }}>
              <Store size={18} />
            </div>
            Order #{order.orderId?.slice(0, 8)}
            <span className={`badge ${meta.badge}`} style={{ fontSize: "0.8rem", padding: "6px 10px" }}>{meta.label}</span>
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body style={{ padding: "24px", background: "#f8f9fa" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "flex-start" }}>
            
            {/* Left Column: Details + Timeline */}
            <div style={{ flex: "1 1 480px", minWidth: 0, display: "flex", flexDirection: "column", gap: "20px", boxSizing: "border-box" }}>
              
              {/* Contact & Address Card */}
              <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px", boxSizing: "border-box" }}>
                <div className="row g-3 mb-3">
                  <div className="col-sm-6">
                    {/* A salon order shows its salon; a customer order has no
                        salon at all, so the same block shows the person. */}
                    <div className="small text-muted mb-1 fw-semibold">
                      {buyer.isCustomer ? "ORDERED BY (CUSTOMER)" : "ORDERED BY (SALON)"}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold text-dark">{buyer.name}</span>
                      {buyer.isCustomer && (
                        <span className="badge bg-info-subtle text-info-emphasis" style={{ fontSize: "0.7rem" }}>Customer</span>
                      )}
                    </div>
                    <div className="text-muted small">{buyer.phone}</div>
                  </div>
                  <div className="col-sm-6">
                    <div className="small text-muted mb-1 fw-semibold">DELIVERY CONTACT</div>
                    <div className="fw-bold text-dark">{order.address?.name || "—"}</div>
                    <div className="text-muted small">{order.address?.phone || ""}</div>
                  </div>
                </div>

                {order.address && (
                  <div className="pt-2 border-top">
                    <div className="small text-muted mb-1 fw-semibold">DELIVERY ADDRESS</div>
                    <div className="text-secondary small" style={{ lineHeight: "1.4", wordBreak: "break-word" }}>
                      {order.address.line1}{order.address.city ? `, ${order.address.city}` : ""}{order.address.state ? `, ${order.address.state}` : ""} – {order.address.pincode || ""}
                    </div>
                  </div>
                )}

                {/* Delivery location on the map — the point the distributor
                    drives to and every KM on this screen is measured from. */}
                <div className="pt-3 mt-3 border-top">
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                    <div>
                      <div className="small text-muted fw-semibold d-flex align-items-center gap-1">
                        <MapPin size={13} /> DELIVERY LOCATION
                      </div>
                      <div className="small text-dark">
                        {deliveryPoint ? formatCoordinates(deliveryPoint) : "No coordinates on file for this delivery"}
                      </div>
                      {order.deliveryLocation?.source === "SALON" && (
                        <div className="text-muted" style={{ fontSize: "0.76rem" }}>Taken from the salon profile</div>
                      )}
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {mapsUrl(deliveryPoint) && (
                        <a className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" href={mapsUrl(deliveryPoint)} target="_blank" rel="noopener noreferrer">
                          <MapPin size={13} /> Open in Maps
                        </a>
                      )}
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="d-flex align-items-center gap-1"
                        onClick={() => {
                          setDraftLocation(deliveryPoint || null);
                          setShowLocationEditor((v) => !v);
                        }}
                        disabled={busy || order.status === "DELIVERED" || order.status === "CANCELLED"}
                      >
                        <Crosshair size={13} /> {showLocationEditor ? "Close pin editor" : deliveryPoint ? "Adjust pin" : "Set pin"}
                      </Button>
                    </div>
                  </div>

                  {showLocationEditor ? (
                    <>
                      <LocationField
                        label="Pin the exact delivery point"
                        helper="Drop the pin on the gate / building the parcel goes to. Every distributor's KM is measured from here."
                        value={draftLocation}
                        onChange={setDraftLocation}
                        height={230}
                        disabled={savingLocation}
                      />
                      <div className="d-flex gap-2 mt-2">
                        <Button variant="success" size="sm" onClick={saveDeliveryLocation} disabled={savingLocation || !toPoint(draftLocation)}>
                          {savingLocation ? "Saving…" : "Save delivery location"}
                        </Button>
                        <Button variant="outline-secondary" size="sm" onClick={() => setShowLocationEditor(false)} disabled={savingLocation}>Cancel</Button>
                      </div>
                    </>
                  ) : (
                    <LocationMap
                      value={deliveryPoint}
                      height={190}
                      readOnly
                      fit={Boolean(order.distributor)}
                      markers={
                        order.distributor && toPoint(order.distributor)
                          ? [{
                              latitude: order.distributor.latitude,
                              longitude: order.distributor.longitude,
                              color: "#6f42c1",
                              label: `${order.distributor.name}${Number.isFinite(Number(order.distributor.distanceKm)) ? ` — ${formatKm(order.distributor.distanceKm)} away` : ""}`
                            }]
                          : []
                      }
                      ariaLabel="Delivery location map"
                    />
                  )}
                  {order.distributor && (
                    <div className="d-flex flex-wrap gap-3 mt-2 small text-muted">
                      <span className="d-flex align-items-center gap-1">
                        <span className="d-inline-block rounded-circle" style={{ width: 9, height: 9, background: "#0d6efd" }} /> Delivery point
                      </span>
                      <span className="d-flex align-items-center gap-1">
                        <span className="d-inline-block rounded-circle" style={{ width: 9, height: 9, background: "#6f42c1" }} /> {order.distributor.name}
                      </span>
                      {Number.isFinite(Number(order.distributor.distanceKm)) && (
                        <span className="fw-semibold text-dark">{formatKm(order.distributor.distanceKm)} apart</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table Card */}
              <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px", boxSizing: "border-box" }}>
                <div className="small text-muted mb-3 fw-semibold text-uppercase" style={{ letterSpacing: "0.4px" }}>
                  Items ({order.amounts?.itemCount ?? items.length})
                </div>
                <div className="table-responsive">
                  <table className="table table-sm mb-0 align-middle" style={{ fontSize: "0.87rem" }}>
                    <thead>
                      <tr className="text-muted small border-bottom">
                        <th style={{ paddingBottom: "10px" }}>Item</th>
                        <th className="text-center" style={{ paddingBottom: "10px" }}>Qty</th>
                        <th className="text-end" style={{ paddingBottom: "10px" }}>Price</th>
                        <th className="text-end" style={{ paddingBottom: "10px" }}>Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => {
                        const qty = Number(it.qty || 1);
                        const price = Number(it.price || 0);
                        const imageUrl = it.image ? `${API_BASE_URL}/getFiles${it.image}` : null;
                        return (
                          <tr key={it.productId || idx} style={{ borderBottom: "1px solid #f1f3f5" }}>
                            <td className="pe-2 py-2" style={{ maxWidth: "240px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                {imageUrl && (
                                  <div 
                                    onClick={() => setPreviewImage(imageUrl)}
                                    title="Click to preview image"
                                    style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}
                                  >
                                    <img src={imageUrl} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: "6px", border: "1px solid #dee2e6" }} />
                                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }} className="img-hover-overlay">
                                      <Eye size={14} color="#fff" />
                                    </div>
                                  </div>
                                )}
                                <span className="fw-semibold text-dark text-truncate">{it.name}</span>
                              </div>
                            </td>
                            <td className="text-center py-2">{qty}</td>
                            <td className="text-end py-2">{money(it.price)}</td>
                            <td className="text-end fw-semibold text-dark py-2">{money(price * qty)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Amount Breakdown Summary */}
                <div className="d-flex flex-wrap gap-3 pt-3 mt-3 border-top small text-secondary">
                  <div><span className="text-muted">Items:</span> <strong className="text-dark">{money(order.amounts?.itemTotal)}</strong></div>
                  <div><span className="text-muted">Delivery:</span> <strong className="text-dark">{Number(order.amounts?.deliveryFee) === 0 ? "Free" : money(order.amounts?.deliveryFee)}</strong></div>
                  <div><span className="text-muted">Total:</span> <strong className="text-dark">{money(order.amounts?.total)}</strong></div>
                  {Number(order.amounts?.savings) > 0 && (
                    <div><span className="text-muted">{buyer.isCustomer ? "Customer saved:" : "Salon saved:"}</span> <strong className="text-success">{money(order.amounts?.savings)}</strong></div>
                  )}
                  <div>
                    <span className="text-muted">Payment: </span>
                    {order.payment?.status === "PAID" 
                      ? <span className="badge bg-success-subtle text-success">{order.payment.method} Paid {order.payment.paymentId ? "(Razorpay)" : ""}</span>
                      : <span className="badge bg-secondary-subtle text-secondary">{order.payment?.method || "COD"} Unpaid</span>
                    }
                  </div>
                  <div><span className="text-muted">Placed:</span> <span className="text-dark">{dateTime(order.createdAt)}</span></div>
                </div>
              </div>

              {/* Timeline Section */}
              <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px", boxSizing: "border-box" }}>
                <div className="small text-muted mb-3 fw-semibold text-uppercase" style={{ letterSpacing: "0.4px" }}>Full Order History</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0", width: "100%" }}>
                  {events.map((ev, idx) => {
                    const evMeta = EVENT_META[ev.action] || { icon: Truck, color: "#6c757d", label: ev.action };
                    const Icon = evMeta.icon;
                    const isRejected = ev.action === "REJECTED";
                    return (
                      <div key={ev.id || idx} style={{ display: "flex", gap: "14px", position: "relative", width: "100%" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                          <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: `${evMeta.color}1a`, color: evMeta.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Icon size={14} />
                          </div>
                          {idx < events.length - 1 && <div style={{ width: "2px", flex: 1, minHeight: "20px", backgroundColor: "#e2e8f0", margin: "4px 0" }} />}
                        </div>
                        <div style={{ paddingBottom: "20px", flex: "1 1 auto", width: "calc(100% - 42px)", boxSizing: "border-box", overflow: "hidden" }}>
                          <div className="fw-semibold text-dark" style={{ fontSize: "0.9rem", wordBreak: "break-word" }}>{evMeta.label}</div>
                          <div className="text-muted small mb-2" style={{ fontSize: "0.8rem", wordBreak: "break-word" }}>
                            {actorName(ev)} • {dateTime(ev.createdAt)}
                            {ev.fromStatus && ev.toStatus && (
                              <> <span className="text-muted">•</span> {INTERNAL_STATUS_META[ev.fromStatus]?.label || ev.fromStatus} → {INTERNAL_STATUS_META[ev.toStatus]?.label || ev.toStatus}</>
                            )}
                          </div>
                          
                          {/* Note Box */}
                          {ev.note && (
                            <div 
                              style={{ 
                                background: isRejected ? "#fdf2f2" : "#f8f9fa",
                                borderLeft: `3px solid ${isRejected ? "#dc3545" : "#0d6efd"}`,
                                borderTop: "1px solid #e9ecef",
                                borderRight: "1px solid #e9ecef",
                                borderBottom: "1px solid #e9ecef",
                                borderRadius: "0 8px 8px 0",
                                padding: "10px 14px",
                                fontSize: "0.85rem",
                                color: isRejected ? "#842029" : "#495057",
                                width: "100%",
                                wordBreak: "break-word",
                                overflowWrap: "anywhere",
                                boxSizing: "border-box",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "8px"
                              }}
                            >
                              <MessageSquare size={14} style={{ marginTop: "3px", flexShrink: 0, opacity: 0.6 }} />
                              <span>{ev.note}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {events.length === 0 && <div className="text-muted small">No events recorded yet.</div>}
                </div>
              </div>

            </div>

            {/* Right Column: Distributor & Actions */}
            <div style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: "20px", boxSizing: "border-box" }}>
              
              {/* Distributor Card */}
              <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px", boxSizing: "border-box" }}>
                <div className="small text-muted mb-2 fw-semibold text-uppercase" style={{ letterSpacing: "0.4px" }}>Assigned Distributor</div>
                {order.distributor ? (
                  <div className="mb-3" style={{ wordBreak: "break-word" }}>
                    <div className="fw-bold text-dark">{order.distributor.name}</div>
                    <div className="small text-muted">{order.distributor.phone}{order.distributor.area ? ` • ${order.distributor.area}` : ""}</div>
                    {order.distributor.deliveryCapability && <div className="small text-muted mt-1">Capability: {order.distributor.deliveryCapability}</div>}
                    <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
                      {Number.isFinite(Number(order.distributor.distanceKm)) ? (
                        <span className="badge bg-success-subtle text-success-emphasis d-inline-flex align-items-center gap-1">
                          <Route size={12} /> {formatKm(order.distributor.distanceKm)} from delivery
                        </span>
                      ) : (
                        <span className="badge bg-warning-subtle text-warning-emphasis">Location not shared</span>
                      )}
                      {order.distributor.locationUpdatedAt && (
                        <span className="text-muted" style={{ fontSize: "0.76rem" }}>
                          pin updated {locationAgeLabel(order.distributor.locationUpdatedAt)}
                        </span>
                      )}
                      {mapsUrl(order.distributor) && (
                        <a className="small" href={mapsUrl(order.distributor)} target="_blank" rel="noopener noreferrer">Map</a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted small mb-3">Not assigned yet</div>
                )}
                <Button variant="success" size="sm" onClick={openAssign} disabled={busy} className="w-100 d-flex align-items-center justify-content-center gap-1 fw-semibold">
                  <UserPlus size={15} />
                  {order.distributor ? "Re-assign / Request Another" : "Assign Distributor"}
                </Button>
              </div>

              {/* Actions Panel */}
              <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px", boxSizing: "border-box" }}>
                <div className="small text-muted mb-3 fw-semibold text-uppercase" style={{ letterSpacing: "0.4px" }}>Workflow Actions</div>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {statusActionButtons()}
                </div>

                {/* Direct Status Override Selector */}
                <div className="pt-3 border-top">
                  <div className="small text-muted mb-2 fw-semibold d-flex align-items-center gap-1">
                    <Edit3 size={13} /> Change Status Manually
                  </div>
                  <div className="input-group input-group-sm">
                    <select 
                      className="form-select form-select-sm"
                      value={manualStatus}
                      onChange={(e) => setManualStatus(e.target.value)}
                    >
                      {Object.keys(INTERNAL_STATUS_META).map((stKey) => (
                        <option key={stKey} value={stKey}>
                          {INTERNAL_STATUS_META[stKey]?.label || stKey}
                        </option>
                      ))}
                    </select>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={handleManualStatusSave}
                      disabled={busy || manualStatus === order.status}
                    >
                      Update
                    </Button>
                  </div>
                </div>

                {showReject && (
                  <div className="mt-3 border rounded-3 p-3 bg-danger-subtle" style={{ borderColor: "#f1c1c6", boxSizing: "border-box" }}>
                    <div className="small fw-semibold mb-2 text-danger-emphasis">Rejection Reason (recorded on history)</div>
                    <textarea
                      className="form-control form-control-sm mb-2"
                      rows={3}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="e.g. Out of stock, cannot deliver to this pincode..."
                    />
                    <div className="d-flex gap-2">
                      <Button variant="danger" size="sm" onClick={recordReject} disabled={busy}>{busy ? "Saving..." : "Confirm Rejection"}</Button>
                      <Button variant="outline-secondary" size="sm" onClick={() => { setShowReject(false); setRejectReason(""); }} disabled={busy}>Cancel</Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Assign Distributor Inline Section */}
              {showAssign && (
                <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #0d6efd", padding: "20px", boxShadow: "0 0.25rem 0.5rem rgba(13, 110, 253, 0.15)", boxSizing: "border-box" }}>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <div className="fw-bold text-dark">Choose a Distributor</div>
                      <div className="text-muted" style={{ fontSize: "0.78rem" }}>
                        {deliveryPoint
                          ? `Nearest first — distance from the delivery location (${formatCoordinates(deliveryPoint, 4)})`
                          : "No delivery pin yet: distances are unavailable. Set the pin above to sort nearest first."}
                      </div>
                    </div>
                    <Button variant="link" size="sm" className="p-0 text-decoration-none" onClick={() => setShowAssign(false)}>Close</Button>
                  </div>
                  {distributorLoading ? (
                    <div className="text-center py-3"><Spinner size="sm" /></div>
                  ) : distributors.length === 0 ? (
                    <div className="text-muted small py-2">No active distributors found. Add them in the Distributors tab first.</div>
                  ) : (
                    <div style={{ maxHeight: "240px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }} className="pe-1">
                      {distributors.map((d) => (
                        <button
                          key={d.distributorId}
                          className="w-100 text-start border rounded-3 p-2 small transition-all"
                          style={{
                            backgroundColor: selectedDistributor === d.distributorId ? "#eaf7ee" : "#f8f9fa",
                            borderColor: selectedDistributor === d.distributorId ? "#198754" : "#e2e8f0",
                            cursor: "pointer",
                            boxSizing: "border-box"
                          }}
                          onClick={() => setSelectedDistributor(d.distributorId)}
                        >
                          <div className="d-flex justify-content-between align-items-start gap-2">
                            <div className="fw-bold text-dark">{d.name}</div>
                            {Number.isFinite(Number(d.distanceKm)) ? (
                              <span className="badge bg-success-subtle text-success-emphasis text-nowrap">{formatKm(d.distanceKm)}</span>
                            ) : (
                              <span className="badge bg-light text-secondary border text-nowrap">No pin</span>
                            )}
                          </div>
                          <div className="text-muted small">{d.phone} • {d.area || "no area set"}</div>
                          {d.deliveryCapability && <div className="text-muted" style={{ fontSize: "0.78rem" }}>{d.deliveryCapability}</div>}
                          {d.locationUpdatedAt && (
                            <div className="text-muted" style={{ fontSize: "0.74rem" }}>Location updated {locationAgeLabel(d.locationUpdatedAt)}</div>
                          )}
                          {!d.isActive && <div className="text-danger" style={{ fontSize: "0.78rem" }}>Disabled — cannot log in</div>}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-3">
                    <Button variant="success" size="sm" onClick={confirmAssign} disabled={assigning || !selectedDistributor} className="w-100 fw-semibold">
                      {assigning ? "Requesting..." : "Send to Distributor (Awaiting Accept/Reject)"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="alert small mb-0 border" style={{ backgroundColor: "#f1f8f5", borderColor: "#c3e6cb", color: "#155724", width: "100%", boxSizing: "border-box", wordBreak: "break-word" }}>
                <strong>How the flow works:</strong> Assigning an order places it in <em>Awaiting Distributor</em> status. The distributor checks it in their portal and accepts or rejects it. You can also record decisions manually here.
              </div>

            </div>

          </div>
        </Modal.Body>
      </Modal>

      {/* Image Preview Lightbox Modal */}
      <Modal show={Boolean(previewImage)} onHide={() => setPreviewImage(null)} centered size="md">
        <Modal.Header closeButton style={{ borderBottom: "none", paddingBottom: "0" }}>
          <Modal.Title className="small fw-bold text-muted">Product Image Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-4">
          {previewImage && (
            <img 
              src={previewImage} 
              alt="Product Preview" 
              style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: "8px", boxShadow: "0 0.5rem 1rem rgba(0,0,0,0.15)" }} 
            />
          )}
        </Modal.Body>
      </Modal>

      <style>{`
        div:hover > .img-hover-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </>
  );
};

export default ShopOrderDetailModal;