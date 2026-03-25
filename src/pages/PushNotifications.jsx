import { useState, useEffect } from "react";
import Layout from "../components/Layout.jsx";
import Loader from "../components/Loader.jsx";
// import StatusConfirmModal from "../components/StatusConfirmModal.jsx";
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

    // Modal states
    const [showAddForm, setShowAddForm] = useState(false); // To toggle between list and form
    const [showSendModal, setShowSendModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ show: false, ids: [], loading: false });

    const [formData, setFormData] = useState({
        targetType: "users",
        title: "",
        body: "",
        data: "{}"
    });

    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await notificationAPI.getNotifications({
                page: currentPage,
                limit: ITEMS_PER_PAGE,
                search: search
            });
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
    }, [currentPage, search]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSendNotification = async () => {
        try {
            setDeleteModal(prev => ({ ...prev, loading: true }));
            const res = await notificationAPI.sendNotification(formData);
            if (res.success) {
                setFormData({ targetType: "users", title: "", body: "", data: "{}" });
                setShowSendModal(false);
                setShowAddForm(false); // Go back to list
                fetchNotifications();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setDeleteModal(prev => ({ ...prev, loading: false }));
        }
    };

    return (
        <Layout>
            <div className="container-fluid px-3 px-md-4 mt-2 mt-md-4 thin-scrollbar">
                <div className="row">
                    <div className="col-12">
                        {/* Header without "Send New" button */}
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
                                            <select
                                                className="form-select"
                                                name="targetType"
                                                value={formData.targetType}
                                                onChange={handleInputChange}
                                            >
                                                <option value="users">Users </option>
                                                <option value="salons"> Salons</option>
                                                <option value="salons">All (Users & Salons)</option>

                                            </select>
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
                                        </div>
                                        <div className="col-12">
                                            <button
                                                className="btn-sm buttoncolor px-3 text-nowrap"
                                                disabled={!formData.title || !formData.body}
                                                onClick={() => setShowSendModal(true)}
                                            >
                                                <FaPaperPlane className="me-2" /> Send Notification
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* LIST UI */
                            <div className="card shadow-sm">
                                <div className="card-body p-0">
                                    <div className="p-3 border-bottom bg-light">
                                        <div className="row align-items-center">
                                            <div className="col-md-4">
                                                <SearchInput
                                                    value={search}
                                                    onChange={(val) => { setSearch(val); setCurrentPage(1); }}
                                                    placeholder="Search notifications..."
                                                />
                                            </div>
                                            <div className="col-md-8 d-flex justify-content-end align-items-center gap-3">

                                                <button
                                                    className="btn btn-sm buttoncolor px-3 text-nowrap btn-outline-secondary d-flex align-items-center gap-2"
                                                    onClick={() => setShowAddForm(true)}
                                                >
                                                    <FaPlus size={14} /> Send New
                                                </button>
                                                <Pagination
                                                    currentPage={currentPage}
                                                    totalPages={totalPages}
                                                    onPageChange={setCurrentPage}
                                                    size="sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0 align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th className="px-4 py-3">No.</th>
                                                    <th className="px-4 py-3">Target</th>
                                                    <th className="px-4 py-3">Content</th>
                                                    <th className="px-4 py-3">Date</th>
                                                    <th className="px-4 py-3 text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan={5} className="text-center py-5">
                                                            <Loader fullScreen={false} size="sm" />
                                                        </td>
                                                    </tr>
                                                ) : recentNotifications.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="text-center py-5 text-muted">
                                                            No history found
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    recentNotifications.map((notif, idx) => {
                                                        const serialNumber = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                                                        return (
                                                            <tr key={notif.id}>
                                                                <td className="px-4 fw-medium">{serialNumber}</td>
                                                                <td className="px-4">
                                                                    <span
                                                                        className={`badge ${notif.targetType === "users" ? "bg-primary" : "bg-success"
                                                                            }`}
                                                                    >
                                                                        {notif.targetType}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4">
                                                                    <div className="fw-bold text-truncate" style={{ maxWidth: "250px" }}>
                                                                        {notif.title}
                                                                    </div>
                                                                    <div
                                                                        className="small text-muted text-truncate"
                                                                        style={{ maxWidth: "300px" }}
                                                                    >
                                                                        {notif.body}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 text-muted small">
                                                                    {new Date(notif.createdAt).toLocaleDateString()}
                                                                </td>
                                                                <td className="text-center">
                                                                    <button
                                                                        className="btn btn-sm text-danger"
                                                                        onClick={() =>
                                                                            setDeleteModal({ show: true, ids: [notif.id], loading: false })
                                                                        }
                                                                    >
                                                                        <FaTrash />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {/* <StatusConfirmModal
                show={showSendModal}
                onHide={() => setShowSendModal(false)}
                onConfirm={handleSendNotification}
                loading={deleteModal.loading}
                type="notification"
                title="Confirm Push"
                message="Are you sure you want to send this to everyone?"
            /> */}

            <SendNotificationModal
                show={showSendModal}
                onHide={() => setShowSendModal(false)}
                onConfirm={handleSendNotification}
                loading={deleteModal.loading}
            />

            <DeleteConfirmModal
                show={deleteModal.show}
                onHide={() => setDeleteModal({ show: false, ids: [], loading: false })}
                onConfirm={() => { /* add delete logic */ }}
                count={deleteModal.ids.length}
            />
        </Layout>
    );
};

export default Notifications;