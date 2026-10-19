import { useState, useEffect, useCallback } from "react";
import { shopOrderAPI } from "../services/communication";
import Loader from "../components/Loader.jsx";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Truck, LogOut, Store, Package, Search, ChevronLeft, ChevronRight, Eye, CheckCircle2, XCircle, Ban, MessageSquare } from "lucide-react";
import { Modal, Button, Spinner } from "react-bootstrap";
import { INTERNAL_STATUS_META } from "../pages/ShopOrders.jsx";

const money = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `₹${num.toLocaleString("en-IN")}`;
};

const dateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

const STATUS_BADGES = {
  AWAITING_ACCEPTANCE: "bg-info-subtle text-info-emphasis",
  ASSIGNED: "bg-primary-subtle text-primary-emphasis",
  PICKED: "bg-warning-subtle text-warning-emphasis",
  SHIPPED: "bg-primary-subtle text-primary-emphasis",
  DELIVERED: "bg-success-subtle text-success-emphasis",
  CANCELLED: "bg-danger-subtle text-danger-emphasis"
};

const STATUS_LABELS = {
  AWAITING_ACCEPTANCE: "Needs your reply",
  ASSIGNED: "Accepted — pick up",
  PICKED: "Picked up",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled"
};

const EVENT_META = {
  ORDER_PLACED: { icon: Package, color: "#0d6efd", label: "Order placed" },
  PAYMENT_CONFIRMED: { icon: CheckCircle2, color: "#198754", label: "Payment confirmed" },
  ASSIGNED: { icon: Truck, color: "#6f42c1", label: "Assigned to you" },
  ACCEPTED: { icon: CheckCircle2, color: "#198754", label: "Accepted" },
  REJECTED: { icon: XCircle, color: "#dc3545", label: "Rejected" },
  STATUS_CHANGED: { icon: Truck, color: "#0d6efd", label: "Status changed" },
  CANCELLED: { icon: Ban, color: "#dc3545", label: "Order cancelled" }
};

const ACTOR_LABELS = {
  ADMIN: "MyNaai Admin",
  DISTRIBUTOR: "Distributor",
  SALON: "Salon",
  SYSTEM: "System"
};

const actorName = (ev) => {
  if (!ev.actor) return ACTOR_LABELS[ev.actorType] || "System";
  const name = ev.actor.name || ev.actor.phone || ev.actor.email;
  return name ? name : ACTOR_LABELS[ev.actorType] || "System";
};

// Distributor Order Detail Modal with Fixed Rejection Layout & Acceptance Gate
const DistributorOrderDetailModal = ({ order, onClose, onAccept, onReject, onAdvance, busy }) => {
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedNewStatus, setSelectedNewStatus] = useState("");

  useEffect(() => {
    if (order) {
      setSelectedNewStatus(order.status || "");
      setShowReject(false);
      setRejectReason("");
    }
  }, [order]);

  if (!order) return null;

  const meta = INTERNAL_STATUS_META[order.status] || { label: order.status, badge: "bg-secondary-subtle text-secondary" };
  const items = order.items || [];
  const events = [...(order.events || [])].reverse();
  const awaiting = order.status === "AWAITING_ACCEPTANCE";

  const submitReject = () => {
    if (rejectReason.trim().length < 3) {
      toast.error("Please provide a rejection reason (min 3 characters)");
      return;
    }
    onReject(order.orderId, rejectReason.trim());
  };

  const handleManualStatusChange = () => {
    if (!selectedNewStatus || selectedNewStatus === order.status) return;
    if (window.confirm(`Update order status to ${INTERNAL_STATUS_META[selectedNewStatus]?.label || selectedNewStatus}?`)) {
      onAdvance(order.orderId, selectedNewStatus);
    }
  };

  return (
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
          
          {/* Left Column: Order details & Full Audit History */}
          <div style={{ flex: "1 1 480px", minWidth: 0, display: "flex", flexDirection: "column", gap: "20px", boxSizing: "border-box" }}>
            
            {/* Salon & Address Card */}
            <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px", boxSizing: "border-box" }}>
              <div className="row g-3 mb-3">
                <div className="col-sm-6">
                  <div className="small text-muted mb-1 fw-semibold">ORDERED BY (SALON)</div>
                  <div className="fw-bold text-dark">{order.salon?.salonName || "—"}</div>
                  <div className="text-muted small">{order.salon?.phoneNumber || ""}</div>
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
            </div>

            {/* Items Summary Table */}
            <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px", boxSizing: "border-box" }}>
              <div className="small text-muted mb-3 fw-semibold text-uppercase" style={{ letterSpacing: "0.4px" }}>
                Order Items ({items.length})
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
                      return (
                        <tr key={it.productId || idx} style={{ borderBottom: "1px solid #f1f3f5" }}>
                          <td className="pe-2 py-2 fw-semibold text-dark">{it.name}</td>
                          <td className="text-center py-2">{qty}</td>
                          <td className="text-end py-2">{money(it.price)}</td>
                          <td className="text-end fw-semibold text-dark py-2">{money(price * qty)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="d-flex flex-wrap gap-3 pt-3 mt-3 border-top small text-secondary">
                <div><span className="text-muted">Total:</span> <strong className="text-dark">{money(order.amounts?.total)}</strong></div>
                <div>
                  <span className="text-muted">Payment: </span>
                  {order.payment?.status === "PAID" 
                    ? <span className="badge bg-success-subtle text-success">Paid</span>
                    : <span className="badge bg-secondary-subtle text-secondary">{order.payment?.method || "COD"} Unpaid</span>
                  }
                </div>
                <div><span className="text-muted">Placed:</span> <span className="text-dark">{dateTime(order.createdAt)}</span></div>
              </div>
            </div>

            {/* Detailed Full Order History */}
            <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px", boxSizing: "border-box" }}>
              <div className="small text-muted mb-3 fw-semibold text-uppercase" style={{ letterSpacing: "0.4px" }}>Full Action History & Audit Log</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0", width: "100%" }}>
                {events.map((ev, idx) => {
                  const evMeta = EVENT_META[ev.action] || { icon: Truck, color: "#6c757d", label: ev.action };
                  const Icon = evMeta.icon;
                  const isRejected = ev.action === "REJECTED";
                  return (
                    <div key={ev.id || idx} style={{ display: "flex", gap: "14px", position: "relative", width: "100%" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignSelf: "stretch", alignItems: "center", flexShrink: 0 }}>
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
                {events.length === 0 && <div className="text-muted small">No history actions recorded yet.</div>}
              </div>
            </div>

          </div>

          {/* Right Column: Fulfillment Actions & Status Change Control */}
          <div style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: "20px", boxSizing: "border-box" }}>
            
            <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px", boxSizing: "border-box" }}>
              <div className="small text-muted mb-3 fw-semibold text-uppercase" style={{ letterSpacing: "0.4px" }}>Fulfillment Actions</div>
              
              {awaiting ? (
                <div className="d-flex flex-column gap-3 mb-3" style={{ width: "100%", boxSizing: "border-box" }}>
                  <div className="d-flex gap-2">
                    <Button variant="success" size="sm" onClick={() => onAccept(order.orderId)} disabled={busy} className="flex-grow-1 py-2 fw-semibold">
                      <CheckCircle2 size={16} className="me-1" /> Accept Order
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => setShowReject((v) => !v)} disabled={busy} className="flex-grow-1 py-2 fw-semibold">
                      <XCircle size={16} className="me-1" /> Reject Order
                    </Button>
                  </div>

                  {showReject && (
                    <div className="border rounded-3 p-3 bg-danger-subtle w-100" style={{ borderColor: "#f1c1c6", boxSizing: "border-box" }}>
                      <div className="small fw-semibold mb-2 text-danger-emphasis">Reason for Rejection</div>
                      <textarea
                        className="form-control form-control-sm mb-2 w-100"
                        rows={3}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="e.g. Out of stock, cannot service this area..."
                        style={{ boxSizing: "border-box" }}
                      />
                      <div className="d-flex gap-2">
                        <Button variant="danger" size="sm" onClick={submitReject} disabled={busy}>{busy ? "Submitting..." : "Confirm Rejection"}</Button>
                        <Button variant="outline-secondary" size="sm" onClick={() => setShowReject(false)} disabled={busy}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-3">
                  {order.status === "ASSIGNED" && (
                    <Button variant="primary" size="sm" onClick={() => onAdvance(order.orderId, "PICKED")} disabled={busy} className="w-100 py-2 fw-semibold mb-2">
                      <Truck size={16} className="me-1" /> Mark Picked Up
                    </Button>
                  )}

                  {order.status === "PICKED" && (
                    <Button variant="primary" size="sm" onClick={() => onAdvance(order.orderId, "SHIPPED")} disabled={busy} className="w-100 py-2 fw-semibold mb-2">
                      <Truck size={16} className="me-1" /> Mark Shipped
                    </Button>
                  )}

                  {order.status === "SHIPPED" && (
                    <Button variant="success" size="sm" onClick={() => onAdvance(order.orderId, "DELIVERED")} disabled={busy} className="w-100 py-2 fw-semibold mb-2">
                      <CheckCircle2 size={16} className="me-1" /> Mark Delivered
                    </Button>
                  )}

                  {/* Manual Direct Status Switcher for Distributor (Only available after acceptance) */}
                  <div className="pt-3 border-top mt-3">
                    <div className="small text-muted mb-2 fw-semibold">Change Order Status Manually</div>
                    <div className="input-group input-group-sm">
                      <select
                        className="form-select form-select-sm"
                        value={selectedNewStatus}
                        onChange={(e) => setSelectedNewStatus(e.target.value)}
                      >
                        <option value="ASSIGNED">Assigned</option>
                        <option value="PICKED">Picked Up</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={busy || selectedNewStatus === order.status}
                        onClick={handleManualStatusChange}
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {order.status === "DELIVERED" && (
                <div className="text-success small fw-semibold d-flex align-items-center gap-1 mt-3">
                  <CheckCircle2 size={16} /> Order successfully delivered!
                </div>
              )}
            </div>

          </div>

        </div>
      </Modal.Body>
    </Modal>
  );
};

const DistributorPortal = () => {
  const [tab, setTab] = useState("queue");
  const [orders, setOrders] = useState([]);
  const [queueCount, setQueueCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const navigate = useNavigate();
  const userData = localStorage.getItem("userData") ? JSON.parse(localStorage.getItem("userData")) : {};

  useEffect(() => {
    if (localStorage.getItem("role") !== "distributor") {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = { page, limit: 15 };

      if (tab === "queue") {
        params.status = "AWAITING_ACCEPTANCE";
      } else if (statusFilter) {
        params.status = statusFilter;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const result = await shopOrderAPI.distributorOrders(params);
      if (result.success) {
        setOrders(result.data?.orders || []);
        setTotalPages(result.data?.pagination?.totalPages || 1);
        setTotalCount(result.data?.pagination?.totalOrders || result.data?.orders?.length || 0);

        if (tab !== "queue") {
          const q = await shopOrderAPI.distributorOrders({ status: "AWAITING_ACCEPTANCE", limit: 1 });
          if (q.success) {
            setQueueCount(q.data?.pagination?.totalOrders || (q.data?.orders || []).length);
          }
        } else {
          setQueueCount(result.data?.pagination?.totalOrders || (result.data?.orders || []).length);
        }
      } else {
        toast.error(result.message || "Failed to load orders");
      }
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, [tab, page, statusFilter, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setPage(1);
    setStatusFilter("");
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleAccept = async (orderId) => {
    if (!window.confirm("Accept this order? The salon will see it as confirmed.")) return;
    setBusy(true);
    try {
      const result = await shopOrderAPI.accept(orderId);
      if (result.success) {
        toast.success("Order accepted successfully!");
        setSelectedOrder(null);
        fetchOrders();
      } else {
        toast.error(result.message || "Failed to accept order");
      }
    } catch {
      toast.error("Failed to accept order");
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (orderId, reason) => {
    setBusy(true);
    try {
      const result = await shopOrderAPI.reject({ orderId, reason });
      if (result.success) {
        toast.success("Order rejected and returned to admin queue.");
        setSelectedOrder(null);
        fetchOrders();
      } else {
        toast.error(result.message || "Failed to reject order");
      }
    } catch {
      toast.error("Failed to reject order");
    } finally {
      setBusy(false);
    }
  };

  const handleAdvance = async (orderId, nextStatus) => {
    setBusy(true);
    try {
      const result = await shopOrderAPI.distributorUpdateStatus({ orderId, status: nextStatus });
      if (result.success) {
        const verb = nextStatus === "PICKED" ? "marked picked up" : nextStatus === "SHIPPED" ? "marked shipped" : "marked delivered";
        toast.success(`Order ${verb}.`);
        setSelectedOrder(null);
        fetchOrders();
      } else {
        toast.error(result.message || "Could not update the order status");
      }
    } catch {
      toast.error("Could not update the order status");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: "#f8f9fa" }}>
      
      {/* Top Navbar */}
      <nav className="navbar border-bottom px-3 px-md-4 py-3 bg-white shadow-xs sticky-top">
        <div className="container-fluid max-w-1400 px-0 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center justify-content-center rounded-3 bg-success text-white shadow-sm" style={{ width: 42, height: 42, flexShrink: 0 }}>
              <Truck size={22} />
            </div>
            <div>
              <h5 className="mb-0 fw-bold text-dark text-truncate">Distributor Portal</h5>
              <div className="text-muted small text-truncate">{userData?.name || "Authorized Partner"}</div>
            </div>
          </div>
          <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 fw-semibold px-3 py-2 rounded-3 flex-shrink-0" onClick={handleLogout}>
            <LogOut size={16} /> <span className="d-none d-sm-inline">Logout</span>
          </button>
        </div>
      </nav>

      <div className="container-fluid px-3 px-md-4 py-4" style={{ maxWidth: "1300px" }}>
        
        {/* Navigation Tabs & Search Toolbar */}
        <div className="card border-0 shadow-sm mb-4 bg-white" style={{ borderRadius: "16px" }}>
          <div className="card-body p-3 p-md-4">
            <div className="row g-3 align-items-center">
              
              {/* Tab Switchers */}
              <div className="col-12 col-md-auto">
                <div className="d-flex gap-2">
                  <button
                    className={`btn btn-sm px-3 py-2 d-flex align-items-center gap-2 fw-semibold rounded-3 ${tab === "queue" ? "btn-success shadow-sm" : "btn-outline-secondary border-0 bg-light text-secondary"}`}
                    onClick={() => handleTabChange("queue")}
                  >
                    <Package size={16} />
                    Needs Reply
                    {queueCount > 0 && (
                      <span className={`badge rounded-pill ${tab === "queue" ? "bg-white text-success" : "bg-success"}`}>{queueCount}</span>
                    )}
                  </button>
                  <button
                    className={`btn btn-sm px-3 py-2 d-flex align-items-center gap-2 fw-semibold rounded-3 ${tab === "all" ? "btn-success shadow-sm" : "btn-outline-secondary border-0 bg-light text-secondary"}`}
                    onClick={() => handleTabChange("all")}
                  >
                    <Store size={16} />
                    All Orders ({totalCount})
                  </button>
                </div>
              </div>

              {/* Search Bar & Status Filter */}
              <div className="col-12 col-md">
                <div className="d-flex flex-wrap align-items-center gap-2 justify-content-md-end">
                  <div className="input-group input-group-sm bg-light rounded-3 overflow-hidden border" style={{ maxWidth: "320px", flex: "1 1 200px" }}>
                    <span className="input-group-text bg-transparent border-0 text-muted ps-3">
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-0 bg-transparent shadow-none py-2"
                      placeholder="Search ID or Salon..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                  </div>

                  {tab === "all" && (
                    <select
                      className="form-select form-select-sm bg-light border py-2 rounded-3"
                      style={{ width: "150px" }}
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    >
                      <option value="">All Statuses</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="PICKED">Picked Up</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Orders Content View */}
        {isLoading ? (
          <div className="text-center py-5 my-5">
            <Loader size="md" />
            <p className="text-muted mt-3 small">Loading orders database...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="card border-0 shadow-sm text-center py-5 bg-white" style={{ borderRadius: "16px" }}>
            <div className="py-4">
              <Truck size={48} className="text-muted opacity-25 mb-3" />
              <h5 className="fw-bold text-dark">No orders found</h5>
              <p className="text-muted small mb-0">
                {searchQuery || statusFilter 
                  ? "Try adjusting your search query or status filters." 
                  : tab === "queue" ? "No orders waiting for your response right now." : "You have no assigned orders yet."}
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-muted small mb-3 px-1 d-flex justify-content-between align-items-center">
              <span>Showing page <strong className="text-dark">{page}</strong> of <strong className="text-dark">{totalPages}</strong> ({totalCount} total orders)</span>
            </div>

            {/* Responsive Card Grid */}
            <div className="d-flex flex-column gap-3">
              {orders.map((o) => {
                const itemCount = (o.items || []).reduce((acc, item) => acc + Number(item.qty || 1), 0);
                const events = o.events || [];
                const lastEvent = events.length > 0 ? events[events.length - 1] : null;
                const lastActionDate = lastEvent?.createdAt || o.updatedAt || o.createdAt;

                return (
                  <div 
                    key={o.orderId} 
                    className="card border-0 shadow-sm bg-white p-3 p-md-4 transition-all"
                    style={{ borderRadius: "14px", cursor: "pointer" }}
                    onClick={() => setSelectedOrder(o)}
                  >
                    <div className="row g-3 align-items-center justify-content-between">
                      
                      <div className="col-12 col-md-3">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="fw-bold text-dark" style={{ fontSize: "1.05rem" }}>#{o.orderId?.slice(0, 8)}</span>
                          <span className={`badge ${STATUS_BADGES[o.status] || "bg-secondary-subtle text-secondary"}`} style={{ fontSize: "0.75rem" }}>
                            {STATUS_LABELS[o.status] || o.status}
                          </span>
                        </div>
                        <div className="text-muted small">Last Activity: {dateTime(lastActionDate)}</div>
                      </div>

                      <div className="col-12 col-md-3">
                        <div className="small text-uppercase text-muted fw-semibold mb-1 d-md-none">Salon & Customer</div>
                        <div className="fw-bold text-dark">{o.salon?.salonName || "—"}</div>
                        <div className="text-muted small">{o.address?.name || o.salon?.phoneNumber || "—"}</div>
                      </div>

                      <div className="col-6 col-md-2">
                        <div className="small text-uppercase text-muted fw-semibold mb-1 d-md-none">Amount</div>
                        <div className="fw-bold text-dark">{money(o.amounts?.total)}</div>
                        <div className="text-muted small">{itemCount} item(s)</div>
                      </div>

                      <div className="col-6 col-md-4 text-end">
                        <button 
                          className="btn btn-sm btn-outline-primary px-3 py-2 d-inline-flex align-items-center gap-2 fw-semibold rounded-3 text-nowrap"
                          onClick={(e) => { e.stopPropagation(); setSelectedOrder(o); }}
                        >
                          <Eye size={15} /> Preview & Take Action
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-4 p-3 bg-white rounded-3 shadow-sm">
                <button
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 fw-semibold"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                
                <span className="small fw-semibold text-muted">
                  Page {page} of {totalPages}
                </span>

                <button
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 fw-semibold"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}

          </div>
        )}

      </div>

      {selectedOrder && (
        <DistributorOrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onAccept={handleAccept}
          onReject={handleReject}
          onAdvance={handleAdvance}
          busy={busy}
        />
      )}

    </div>
  );
};

export default DistributorPortal;