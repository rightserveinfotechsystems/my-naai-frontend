import { useState, useEffect } from "react";
import Layout from "../components/Layout.jsx";
import Loader from "../components/Loader.jsx";
import DeleteConfirmModal from "../components/DeleteConfirmModal.jsx";
import SearchInput from "../components/SearchInput.jsx";
import Pagination from "../components/Pagination.jsx";
import { FaPaperPlane, FaTrash, FaPlus } from "react-icons/fa";
import { notificationAPI } from "../services/communication.jsx";
import { useNavigate } from "react-router-dom";
import SendNotificationModal from "../components/sendNotificationModal.jsx";

const ITEMS_PER_PAGE = 20;

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

    const [formData, setFormData] = useState({
        targetType: "",
        title: "",
        body: "",
        data: "{}"
    });

    const navigate = useNavigate();

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
                debouncedSearch
            );
            if (res.success) {
                setRecentNotifications(res.data.notifications || []);
                setTotalPages(res.data.pagination?.totalPages || 1);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [currentPage, debouncedSearch]);

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

                                                                        <span className={`badge px-2 ${notif.targetType === "ALL_USERS" ? "bg-primary-subtle text-black" :
                                                                            notif.targetType === "ALL_SALONS" ? "bg-secondary" : "bg-dark"
                                                                            }`} style={{ fontSize: "16px" }}>
                                                                            {notif.targetType === "ALL_USERS" ? "Users" :
                                                                                notif.targetType === "ALL_SALONS" ? "Salons" : "All"}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 text-truncate" style={{ maxWidth: "300px" }}>
                                                                        <div className="fw-bold text-capitalize">{notif.title}</div>
                                                                        <div className="small text-muted text-capitalize">{notif.body}</div>
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
                                                                    <span className={`badge px-2 py-1 ${notif.targetType === "ALL_USERS" ? "bg-primary-subtle text-black" :
                                                                            notif.targetType === "ALL_SALONS" ? "bg-secondary" : "bg-dark"
                                                                        }`} style={{ fontSize: "12px" }}>
                                                                        {notif.targetType === "ALL_USERS" ? "Users" :
                                                                            notif.targetType === "ALL_SALONS" ? "Salons" : "All"}
                                                                    </span>

                                                                </div>

                                                                <div className="mb-1">
                                                                    <h6 className="fw-bold mb-0 text-truncate" style={{ fontSize: "13px" }}>{notif.title}</h6>
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