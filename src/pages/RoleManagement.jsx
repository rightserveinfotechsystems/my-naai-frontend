import { useState, useEffect } from "react";
import Layout from "../components/Layout.jsx";
import SearchInput from "../components/SearchInput.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Pagination from "../components/Pagination.jsx";
import { FaTrash } from "react-icons/fa";
import { adminPanelUsersAPI } from "../services/communication.jsx";
import DeleteConfirmModal from "../components/DeleteConfirmModal.jsx";
import Loader from "../components/Loader.jsx";
import UserEditModal from "../components/UserEditModal.jsx";
import { TabArray } from "../utils/TabArray.js";
import StatusConfirmModal from "../components/StatusConfirmModal.jsx";
import { toast } from "react-toastify";


const ITEMS_PER_PAGE = 20;

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const RoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingUserId, setEditingUserId] = useState(null);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [selectedToggleUser, setSelectedToggleUser] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: null,
    loading: false
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminPanelUsersAPI.getAdminPanelUsers({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        searchString: search
      });

      if (res.success) {
        setUsers(res.data.admins);
        setTotalPages(res.data.totalPages);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Fetch users error:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // User selection
  const handleUserSelect = (id) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleAddUser = () => {
    setModalMode("add");
    setEditingUserId(null);
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setModalMode("edit");
    setEditingUserId(user.id);
    setShowModal(true);
  };

  // const handleToggleClick = (user) => {
  //   setEditingUserId(user.id);
  //   setShowModal(true);
  // };

  const handleToggleClick = (user) => {
    setSelectedToggleUser(user);
    setShowToggleModal(true);
  };

  const confirmToggleUserStatus = async () => {
    if (!selectedToggleUser) return;
    try {
      const res = await adminPanelUsersAPI.toggleAdminUsersStatus(
        String(selectedToggleUser.id),
        !selectedToggleUser.isActive
      );
      if (res.success) {
        toast.success(
          `User ${!selectedToggleUser.isActive ? "activated" : "deactivated"} successfully`
        );
        fetchUsers();
      } else {
        toast.error(res.message || "Status update failed");
      }
    } catch (error) {
      console.error("Toggle status error:", error);
      toast.error("Something went wrong");
    } finally {
      setShowToggleModal(false);
      setSelectedToggleUser(null);
    }
  };


  // Confirm delete
  const handleConfirmDelete = async () => {
    try {
      setDeleteModal(prev => ({ ...prev, loading: true }));
      const res = await adminPanelUsersAPI.deleteAdminPanelUser({
        userId: String(deleteModal.id) // must be sent as object
      });

      if (res.success) {
        await fetchUsers();
        setSelectedUsers([]);
        setDeleteModal({ show: false, id: null, loading: false });
      } else {
        alert(res.message || "Delete failed");
        setDeleteModal(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Something went wrong while deleting");
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 500);
    return () => clearTimeout(timer);
  }, [search, currentPage]);

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4 mt-2 mt-md-4 thin-scrollbar">
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body p-0">
                {/* Header: Search + Pagination + Add */}
                <div className="p-2 p-md-3 border1 border-bottom bg-light">
                  <div className="row g-2 g-md-3 align-items-center">
                    <div className="col-12 col-md-auto" style={{ flex: '1 1 auto', minWidth: '200px', maxWidth: '30%' }}>
                      <SearchInput
                        value={search}
                        onChange={(val) => {
                          setSearch(val);
                          setCurrentPage(1);
                        }}
                        placeholder="Search by name, email or phone..."
                      />
                    </div>
                    <div className="col-12 col-md d-flex align-items-center justify-content-md-end gap-2 flex-wrap mt-2">
                      <div className="mt-0">
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={setCurrentPage}
                          size="sm"
                        />
                      </div>
                      <button className="btn btn-sm buttoncolor px-3 text-nowrap" onClick={handleAddUser}>
                        + Add User
                      </button>
                    </div>
                  </div>
                </div>

                {/* Users Table (Desktop Only) */}
                <div className="table-responsive d-none d-md-block"
                  style={{ maxHeight: '83vh', overflowY: 'auto' }}>
                  <table className="table table-hover mb-0 align-middle">
                    <thead className="table-light position-sticky top-0 bg-white border-bottom z-10">
                      <tr>
                        <th className="px-3 py-2 text-center">No.</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Tab Access</th>
                        <th className="px-3 py-2">Phone</th>
                        <th className="px-3 py-2 text-center">Email</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="text-center py-5">
                            <Loader fullScreen={false} size="sm" text="Loading users..." />
                          </td>
                        </tr>
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center text-muted py-5">No users found</td>
                        </tr>
                      ) : users.map((user, index) => (
                        <tr key={user.id}>
                          <td className="px-3 py-2 text-center">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                          <td className="fw-semibold px-3 py-2">{user.name}</td>
                          <td className="px-3 py-2">
                            {user?.accessTab?.length
                              ? user.accessTab.map(tab => TabArray.find(t => t.key === tab)?.label || tab).join(", ")
                              : "—"}
                          </td>
                          <td className="px-3 py-2">{user.mobile}</td>
                          <td className="px-3 py-2 text-center">{user.email}</td>
                          <td className="px-3 py-2 text-center">
                            <StatusBadge status={user.isActive ? "active" : "inactive"} />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="d-inline-flex align-items-center gap-2">
                              <button className="btn btn-md" onClick={() => handleEditUser(user)}>
                                <i className="bi bi-pencil-square"></i>
                              </button>
                              <div className="form-check form-switch m-0">
                                <input className="form-check-input" type="checkbox" checked={!!user.isActive} onChange={() => handleToggleClick(user)} />
                              </div>
                              <button
                                className="btn btn-sm fontcolor px-3 py-1 d-inline-flex align-items-center gap-1"
                                onClick={() => setDeleteModal({ show: true, id: String(user.id), loading: false })}
                              >
                                <FaTrash size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Users List (Mobile Only) */}
                <div className="d-block d-md-none">
                  {loading ? (
                    <div className="text-center py-5">
                      <Loader fullScreen={false} size="sm" text="Loading users..." />
                    </div>
                  ) : users && users.length === 0 ? (
                    <div className="text-center text-muted py-5">No users found</div>
                  ) : (
                    <div className="user-list-mobile">
                      {users && users.map((user, index) => (
                        <div key={user.id} className="card mb-2 shadow-sm">
                          <div className="card-body p-2 d-flex flex-column gap-1">
                            <div className="fw-semibold">{user.name}</div>
                            <div className="small text-muted">{user.email}</div>
                            <div className="small">Phone: {user.mobile}</div>
                            <div className="small">Tab Access: {user?.accessTab?.length
                              ? user.accessTab.map(tab => TabArray.find(t => t.key === tab)?.label || tab).join(", ")
                              : "—"}</div>
                            <div className="d-flex align-items-center gap-2 mt-1">
                              <StatusBadge status={user.isActive ? "active" : "inactive"} />
                              <button className="btn btn-sm btn-light px-2 py-1" onClick={() => handleEditUser(user)}>
                                <i className="bi bi-pencil-square"></i>
                              </button>
                              <button className="btn btn-sm fontcolor px-2 py-1" onClick={() => setDeleteModal({ show: true, id: String(user.id), loading: false })}>
                                <FaTrash size={14} />
                              </button>
                              <div className="form-check form-switch m-0">
                                <input className="form-check-input" type="checkbox" checked={!!user.isActive} onChange={() => handleToggleClick(user)} />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteConfirmModal
        show={deleteModal.show}
        loading={deleteModal.loading}
        count={deleteModal.id ? 1 : 0}
        onHide={() => setDeleteModal({ show: false, id: null, loading: false })}
        onConfirm={handleConfirmDelete}
      />

      {/* User Edit Modal */}
      {showModal && (
        <UserEditModal
          showModal={showModal}
          setShowModal={setShowModal}
          modalMode={modalMode}
          editingUserId={editingUserId}
          onSuccess={fetchUsers}
        />
      )}

       {/* TOGGLE MODAL */}
            <StatusConfirmModal
              show={showToggleModal}
              onHide={() => {
                setShowToggleModal(false);
                setSelectedToggleUser(null);
              }}
              onConfirm={confirmToggleUserStatus}
              currentStatus={selectedToggleUser?.isActive}
              loading={loading}
              type="admin"
            />
      
    </Layout>
  );
};

export default RoleManagement;
