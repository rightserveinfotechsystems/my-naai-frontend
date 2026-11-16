import { useState, useEffect } from "react";
import Layout from "../components/Layout.jsx";
import Loader from "../components/Loader.jsx";
import DeleteConfirmModal from "../components/DeleteConfirmModal.jsx";
import SearchInput from "../components/SearchInput.jsx";
import Pagination from "../components/Pagination.jsx";
import { FaPaperPlane, FaTrash, FaPlus, FaExternalLinkAlt } from "react-icons/fa";
import { notificationAPI } from "../services/communication.jsx";
import { useNavigate } from "react-router-dom";
import SendNotificationModal from "../components/sendNotificationModal.jsx";

const ITEMS_PER_PAGE = 20;

// The backend now also writes the panel's own event rows: a new shop order, a
// new salon registration, a subscription renewal, a delivery-partner action and
// a new booking request. They arrive with targetType ADMINS (internal — they are
// never sent to salons or customers), so they must not be labelled "All".
const targetBadge = (targetType) => {
    if (targetType === "ALL_USERS") return { label: "Users", className: "bg-primary-subtle text-black" };
    if (targetType === "ALL_SALONS") return { label: "Salons", className: "bg-secondary" };
    if (targetType === "ADMINS") return { label: "Event", className: "bg-warning-subtle text-black" };
    return { label: "All", className: "bg-dark" };
};

// The event rows the API writes are the panel's "what just happened" feed. Each
// one belongs to a tab, so opening it from the inbox lands on the record it is
// about (the API copy is set by services/eventNotification.service.js).
const eventLinkFor = (title = "") => {
    const text = String(title).toLowerCase();
    if (/order|delivery partner/.test(text)) return "/shop-orders";
    if (/salon registration/.test(text)) return "/salons";
    if (/subscription|renewal/.test(text)) return "/plans";
    if (/booking request/.test(text)) return "/booking-requests";
    return "";
};

const isEvent = (notification) => notification?.targetType === "ADMINS";

const Notifications = () => {
    const [loading, setLoading] = useState(false);
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ show: false, ids: [], loading: false });
    // The inbox shows two feeds in one list: the API's own events and the pushes
    // an admin sent. "All" is the default so an admin never misses either.
    const [feed, setFeed] = useState("all");

    const [formData, setFormData] = useState({
        targetType: "",
        title: "",
        body: "",
        data: "{}"
    });

    const navigate = useNavigate();

    // The tab is a role-access key (see utils/TabArray.js). Role management
    // (`user`) sees it too, which is what lets the super admin open the inbox
    // without first granting themselves the new key. A direct URL by anyone else
    // is refused, exactly like the Booking Requests tab.
    const canOpen = Boolean(
        (() => {
            const tabs = JSON.parse(localStorage.getItem("accessTab") || "null") || [];
            return tabs.includes("notifications") || tabs.includes("user");
        })()
    );

    //debouncing
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setCurrentPage(1);
        }, 1000);

        return () => clearTimeout(handler);
    }, [search]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await notificationAPI.getNotifications(
                currentPage,
                debouncedSearch,
                feed === "all" ? "" : feed
            );
            if (res.success) {
                setRecentNotifications(res.data?.notifications || []);
                setTotalPages(res.data?.pagination?.totalPages || 1);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [currentPage, debouncedSearch, feed]);

    // Event rows (orders, registrations, renewals, delivery actions, booking
    // requests) are written by the API, not by this screen, so the list refreshes
    // itself while it is open.
    useEffect(() => {
        const timer = setInterval(() => { fetchNotifications(); }, 60000);
        return () => clearInterval(timer);
    }, [currentPage, debouncedSearch, feed]);

    // Opening the inbox is reading it: the badge in the sidebar clears on the
    // first successful load, and `notifications:read` tells the Layout so it does
    // not wait for its next poll.
    const markAllRead = async ({ silent = false } = {}) => {
        const res = await notificationAPI.markAllNotificationsRead();
        if (res.success) {
            window.dispatchEvent(new Event("notifications:read"));
            if (!silent) fetchNotifications();
        }
    };

    useEffect(() => {
        if (!canOpen) return;
        markAllRead({ silent: true });
        // Runs once per visit; the badge is a convenience, not state.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSendNotification = async () => {
        try {
            setDeleteModal(prev => ({ ...prev, loading: true }));
            const res = await notificationAPI.sendNotification(formData);
            if (res.success) {
                setFormData({ targetType: "", title: "", body: "", data: "{}" });
                setShowSendModal(false);
                setShowAddForm(false);
                fetchNotifications();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setDeleteModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleDelete = async () => {
        try {
            setDeleteModal(prev => ({ ...prev, loading: true }));
            const res = await notificationAPI.deleteNotification(deleteModal.ids[0]);

            if (res.success) {
                // Modal closse and referesh list
                setDeleteModal({ show: false, ids: [], loading: false });
                fetchNotifications();
            }
        } catch (error) {
            console.error("Delete error:", error);
        } finally {
            setDeleteModal(prev => ({ ...prev, loading: false }));
        }
    };
    if (!canOpen) {
        return (
            <Layout>
                <div className="container-fluid px-2 px-md-4 mt-2 mt-md-4">
                    <div className="card shadow-sm border-0">
                        <div className="card-body text-center py-5">
                            <h5 className="fw-bold mb-2">No access to notifications</h5>
                            <p className="text-muted mb-0">
                                Ask the super admin to grant the <strong>Notifications</strong> tab to your role.
                            </p>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container-fluid px-2 px-md-4 mt-2 mt-md-4 thin-scrollbar">
                <div className="row">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4 className="mb-0 fw-bold">Notifications</h4>
                        </div>

                        {showAddForm ? (
                            /* FORM UI (When Add is clicked) */
                            <div className="card shadow-sm border-0 animate__animated animate__fadeIn">
                                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">Compose Notification</h5>
                                    <button className="btn btn-link text-muted" onClick={() => setShowAddForm(false)}>Cancel</button>
                                </div>
                                <div className="card-body p-4">
                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <label className="form-label fw-semibold">Target</label>
                                            {/* <p className="text-primary small">Debug: Sending {formData.targetType}</p> */}
                                            <select
                                                className="form-select"
                                                name="targetType"
                                                autoComplete="off"
                                                value={formData.targetType}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">-- Select Target --</option>
                                                <option value="ALL_USERS">Users</option>
                                                <option value="ALL_SALONS">Salons</option>
                                                <option value="ALL">All(Users & Salons)</option>
                                            </select>
                                            {!formData.targetType && (
                                                <div className="text-danger mt-1" style={{ fontSize: '12px' }}>
                                                    <i className="bi bi-exclamation-circle me-1"></i> Please select a target.
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-md-8">
                                            <label className="form-label fw-semibold">Title *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleInputChange}
                                                placeholder="Urgent: Special Offer!"
                                            />
                                            {!formData.title && (
                                                <div className="text-danger mt-1" style={{ fontSize: '12px' }}>
                                                    <i className="bi bi-exclamation-circle me-1"></i> Notification title is required.
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-12">
                                            <label className="form-label fw-semibold">Message Body *</label>
                                            <textarea
                                                className="form-control"
                                                name="body"
                                                rows="4"
                                                value={formData.body}
                                                onChange={handleInputChange}
                                                placeholder="Write your message here..."
                                            />
                                            {!formData.body && (
                                                <div className="text-danger mt-1" style={{ fontSize: '12px' }}>
                                                    <i className="bi bi-exclamation-circle me-1"></i> Please enter the message content.
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-12">
                                            <button
                                                className="btn-sm buttoncolor px-3 text-nowrap"
                                                disabled={!formData.title || !formData.body || !formData.targetType}
                                                onClick={() => setShowSendModal(true)}
                                            >
                                                <FaPaperPlane className="me-2" /> Send Notification
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* --- LIST UI --- */
                            <div className="card shadow-sm border-0">
                                <div className="card-body p-0">

                                    {/* --- DYNAMIC TOOLBAR (Responsive) --- */}
                                    <div className="p-2 p-md-3 border-bottom bg-light">
                                        {/* The two feeds that share this list. An event is
                                            something that happened in the business; a sent
                                            push was written by an admin. */}
                                        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                                            {[
                                                { key: "all", label: "All" },
                                                { key: "events", label: "Events" },
                                                { key: "sent", label: "Sent by admin" },
                                            ].map((chip) => (
                                                <button
                                                    key={chip.key}
                                                    type="button"
                                                    className={`btn btn-sm ${feed === chip.key ? "buttoncolor" : "btn-outline-secondary"} px-3`}
                                                    onClick={() => { setFeed(chip.key); setCurrentPage(1); }}
                                                >
                                                    {chip.label}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-link ms-auto text-decoration-none"
                                                onClick={() => markAllRead()}
                                            >
                                                Mark all read
                                            </button>
                                        </div>
                                        <div className="d-flex flex-column flex-md-row gap-2">
                                            {/* 1. Search Bar */}
                                            <div className="flex-grow-1">
                                                <SearchInput
                                                    value={search}
                                                    onChange={(val) => { setSearch(val); setCurrentPage(1); }}
                                                    placeholder="Search..."
                                                />
                                            </div>

                                            {/* 2. Pagination & Button Group */}
                                            <div className="d-flex flex-column flex-md-row align-items-center gap-2">
                                                <div className="order-1 order-md-2">
                                                    <Pagination
                                                        currentPage={currentPage}
                                                        totalPages={totalPages}
                                                        onPageChange={setCurrentPage}
                                                        size="sm"
                                                    />
                                                </div>
                                                <button
                                                    className="btn btn-sm buttoncolor px-3 w-100 w-md-auto d-flex align-items-center justify-content-center gap-2 order-2 order-md-1"
                                                    onClick={() => setShowAddForm(true)}
                                                >
                                                    <FaPlus size={12} /> Send New
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {loading ? (
                                        <div className="text-center py-5"><Loader fullScreen={false} size="sm" /></div>
                                    ) : (
                                        <>
                                            {/* --- DESKTOP VIEW (Table) --- */}
                                            <div className="table-responsive d-none d-md-block">
                                                <table className="table table-hover mb-0 align-middle">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th className="px-2 py-3">No.</th>
                                                            <th className="px-4 py-3">Target</th>
                                                            <th className="px-6 py-3">Content</th>
                                                            <th className="px-2 py-3  text-center">Date</th>
                                                            <th className="px-1 py-3 text-center">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {recentNotifications.length > 0 ? (
                                                            recentNotifications.map((notif, idx) => (
                                                                <tr key={notif.id}>
                                                                    <td className="px-4 fw-medium">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                                                                    <td className="px-4">
                                                                        {/* <span className={`badge ${notif.targetType === "users" ? "bg-primary" : "bg-secondary"}`}>
                                                                        {notif.targetType}
                                                                    </span> */}

                                                                        <span className={`badge px-2 ${targetBadge(notif.targetType).className}`} style={{ fontSize: "16px" }}>
                                                                            {targetBadge(notif.targetType).label}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 text-truncate" style={{ maxWidth: "300px" }}>
                                                                        {(() => {
                                                                            // An API event belongs to a tab: clicking it opens the
                                                                            // record it is about (order → Shop Orders, registration →
                                                                            // Salons, renewal → Plans, lead → Booking Requests).
                                                                            const link = isEvent(notif) ? eventLinkFor(notif.title) : "";
                                                                            return (
                                                                                <>
                                                                                    <div
                                                                                        className={`fw-bold text-capitalize d-flex align-items-center gap-1 ${link ? "text-primary" : ""}`}
                                                                                        style={link ? { cursor: "pointer" } : undefined}
                                                                                        onClick={link ? () => navigate(link) : undefined}
                                                                                    >
                                                                                        <span className="text-truncate">{notif.title}</span>
                                                                                        {link && <FaExternalLinkAlt size={10} title="Open the related tab" />}
                                                                                    </div>
                                                                                    <div className="small text-muted text-capitalize">{notif.body}</div>
                                                                                </>
                                                                            );
                                                                        })()}
                                                                    </td>
                                                                    <td className="px-4 text-muted text-center small">{new Date(notif.createdAt).toLocaleDateString('en-GB')}</td>
                                                                    <td className="text-center">
                                                                        <button className="btn btn-sm text-danger" onClick={() => setDeleteModal({ show: true, ids: [notif.id], loading: false })}>
                                                                            <FaTrash />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="5" className="text-center py-4 text-muted" style={{ fontSize: "20px" }}>
                                                                    No notifications found
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* --- COMPACT MOBILE VIEW (Cards) --- */}
                                            <div className="d-md-none p-2 bg-light">
                                                {recentNotifications.length === 0 ? (
                                                    <div className="text-center py-4 text-muted small">No notifications found</div>
                                                ) : (
                                                    recentNotifications.map((notif, idx) => (
                                                        <div key={notif.id} className="card shadow-sm mb-2 border-0" style={{ borderRadius: "8px" }}>
                                                            <div className="card-body p-2">
                                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                                    <small className="text-muted fw-bold" style={{ fontSize: "14px" }}>
                                                                        {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                                                                    </small>
                                                                    <span className={`badge px-2 py-1 ${targetBadge(notif.targetType).className}`} style={{ fontSize: "12px" }}>
                                                                        {targetBadge(notif.targetType).label}
                                                                    </span>

                                                                </div>

                                                                <div
                                                                    className="mb-1"
                                                                    style={isEvent(notif) && eventLinkFor(notif.title) ? { cursor: "pointer" } : undefined}
                                                                    onClick={isEvent(notif) && eventLinkFor(notif.title) ? () => navigate(eventLinkFor(notif.title)) : undefined}
                                                                >
                                                                    <h6 className="fw-bold mb-0 text-truncate d-flex align-items-center gap-1" style={{ fontSize: "13px" }}>
                                                                        <span className="text-truncate">{notif.title}</span>
                                                                        {isEvent(notif) && eventLinkFor(notif.title) && <FaExternalLinkAlt size={9} className="text-primary" />}
                                                                    </h6>
                                                                    <p className="text-muted mb-0 text-truncate" style={{ fontSize: "11px" }}>{notif.body}</p>
                                                                </div>

                                                                <div className="d-flex justify-content-between align-items-center pt-1 border-top mt-1">
                                                                    <span className="text-secondary" style={{ fontSize: "9px" }}>
                                                                        {new Date(notif.createdAt).toLocaleDateString('en-GB')}
                                                                    </span>
                                                                    <button
                                                                        className="btn btn-sm text-danger p-0 border-0"
                                                                        onClick={() => setDeleteModal({ show: true, ids: [notif.id], loading: false })}
                                                                    >
                                                                        <FaTrash size={12} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <SendNotificationModal
                show={showSendModal}
                onHide={() => setShowSendModal(false)}
                onConfirm={handleSendNotification}
                loading={deleteModal.loading}
            />

            <DeleteConfirmModal
                show={deleteModal.show}
                onHide={() => setDeleteModal({ show: false, ids: [], loading: false })}
                onConfirm={handleDelete}
                count={deleteModal.ids.length}
            />
        </Layout>
    );
};

export default Notifications;