import { useState, useEffect } from "react";
import Layout from "../components/Layout.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SearchInput from "../components/SearchInput.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Pagination from "../components/Pagination.jsx";
import { FaTrash } from "react-icons/fa";
import { userAPI } from "../services/communication.jsx";
import ToggelModal from "../components/ToggelModal.jsx";
import DeleteConfirmModal from "../components/DeleteConfirmModal.jsx";
import Loader from "../components/Loader.jsx";

const ITEMS_PER_PAGE = 20;

// Helper function to format date and time as dd/mm/yyyy hh:mm AM/PM
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  hours = String(hours).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
};
const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    userIds: [],
    loading: false
  });



  const fetchUsers = async () => {
    try {
      setLoading(true);

      const res = await userAPI.getUsers({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        searchString: search
      });



      if (res.success) {
        setUsers(res.data.users);
        setTotalUsers(res.data.pagination.totalUsers);
        setTotalPages(res.data.pagination.totalPages);
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



  // useEffect(() => {
  //   fetchUsers();
  // }, [currentPage, search]);



  // const filtered = useMemo(() => {
  //   return users.filter(
  //     (user) =>
  //       (user.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
  //       (user.email || "").toLowerCase().includes(search.toLowerCase()) ||
  //       (user.phoneNumber || "").includes(search)
  //   );
  // }, [users, search]);

  // const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  // const paginated = filtered.slice(
  //   (currentPage - 1) * ITEMS_PER_PAGE,
  //   currentPage * ITEMS_PER_PAGE
  // );

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(users.map(user => user.userId));
    } else {
      setSelectedUsers([]);
    }
  };


  const handleSelectAllMobile = (e) => {
    if (e.target.checked) {
      setSelectedUsers(users.map(u => u.userId));
    } else {
      setSelectedUsers([]);
    }
  };



  const confirmStatusChange = async () => {
    try {
      setLoading(true);

      const res = await userAPI.changeUserStatus(selectedUser.userId);

      if (res.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.userId === selectedUser.userId
              ? { ...u, isActive: !u.isActive }
              : u
          )
        );
      }

      setShowModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const handleToggleClick = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };





  const handleConfirmDelete = async () => {
    setDeleteModal(prev => ({ ...prev, loading: true }));

    const res = await userAPI.deleteUsers(deleteModal.userIds);

    if (res.success) {
      await fetchUsers();

      setSelectedUsers([]);

      setDeleteModal({
        show: false,
        userIds: [],
        loading: false
      });
    } else {
      alert(res.message || "Delete failed");
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };


  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, currentPage]);


  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4 mt-2 mt-md-4 thin-scrollbar">
        <div className="row">
          <div className="col-12">

            {/* MOBILE SELECT ALL */}
            <div className="d-md-none mb-3">
              <div className="card shadow-sm">
                <div className="card-body p-2">
                  <div className="form-check mb-1">
                    <input
                      className="form-check-input shadow-none me-2"
                      type="checkbox"
                      id="selectAllMobile"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={handleSelectAllMobile}
                    />
                    <label className="form-check-label small fw-medium mb-0">
                      Select all ({users.length})
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN CONTENT CARD */}
            <div className="card shadow-sm">
              <div className="card-body p-0">

                <div className="p-2 p-md-3 border1 border-bottom bg-light">
                  <div className="row g-2 g-md-3 align-items-center">

                    {/* LEFT: Search */}
                    <div className="col-12 col-md-auto" style={{ flex: '1 1 auto', minWidth: '200px', maxWidth: '30% ' }}>
                      <SearchInput
                        value={search}
                        onChange={(val) => {
                          setSearch(val);
                          setCurrentPage(1);
                        }}
                        placeholder="Search by name, email or phone..."
                      />

                    </div>

                    {/* RIGHT END: Actions + Pagination */}
                    <div className="col-12 col-md d-flex align-items-center justify-content-md-end gap-2 flex-wrap mt-2">
                      <div className="d-flex gap-1 flex-wrap align-items-center">
                        <button
                          className={`btn btn-sm btn-danger d-flex align-items-center gap-1 ${selectedUsers.length > 0 ? "" : "opacity-50 cursor-not-allowed"
                            }`}
                          onClick={() =>
                            selectedUsers.length > 0 &&
                            setDeleteModal({
                              show: true,
                              userIds: selectedUsers,
                              loading: false
                            })
                          }
                          disabled={selectedUsers.length === 0}
                        >
                          <FaTrash size={14} />
                          <span className="d-none d-sm-inline">
                            ({selectedUsers.length})
                          </span>
                        </button>



                        {/* <button
                          className={`btn btn-sm btn-outline-secondary ${selectedUsers.length > 0 ? '' : 'opacity-50 cursor-not-allowed'}`}
                          onClick={selectedUsers.length > 0 ? () => setSelectedUsers([]) : undefined}
                          disabled={selectedUsers.length === 0}
                        >
                          Clear
                        </button> */}
                      </div>

                      <div className="d-none d-md-block border-start mx-1" style={{ height: '24px' }}></div>

                      <div className="mt-0">
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={setCurrentPage}
                          size="sm"
                        />

                      </div>
                    </div>
                  </div>
                </div>

                {/* DESKTOP TABLE */}
                <div className="table-responsive d-none d-md-block"
                  style={{ maxHeight: '83vh', overflowY: 'auto' }}>
                  <table className="table table-hover mb-0 align-middle">
                    <thead className="table-light position-sticky top-0 bg-white border-bottom z-10">
                      <tr>
                        <th style={{ width: "5%" }} className="px-3 py-2">
                          <input
                            className="form-check-input shadow-none"
                            type="checkbox"
                            id="selectAll"
                            checked={selectedUsers.length === users.length && users.length > 0}
                            onChange={handleSelectAll}
                          />
                        </th>

                        <th style={{ width: "6%" }} className="px-3 py-2  text-center">No.</th>
                        <th style={{ width: "18%" }} className="px-3 py-2  ">Name</th>
                        <th style={{ width: "22%" }} className="px-3 py-2 ">Email / Phone</th>
                        <th style={{ width: "10%" }} className="px-3 py-2  text-center">Status</th>
                        <th style={{ width: "14%" }} className="px-3 py-2 text-center">Created</th>
                        <th style={{ width: "15%" }} className="px-3 py-2 text-center">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        <tr><td colSpan={7} className="text-center py-5"><Loader fullScreen={false} size="sm" text="Loading users..." /></td></tr>
                      ) : users.map((user, index) => (
                        <tr key={user.userId} className="align-middle">
                          <td className="ps-3 pe-2 text-center">
                            <div className="form-check m-0">
                              <input
                                className="form-check-input shadow-none"
                                type="checkbox"
                                checked={selectedUsers.includes(user.userId)}
                                onChange={() => handleUserSelect(user.userId)}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center fw-medium text-muted">
                            {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                          </td>

                          <td className="fw-semibold px-3 py-2 ">
                            <div className="text-truncate" style={{ maxWidth: '180px' }}>
                              {user.fullName}
                            </div>
                          </td>
                          <td className="px-3 py-2 ">
                            <div className="small fw-medium text-truncate " style={{ maxWidth: '220px' }}>
                              {user.email}
                            </div>
                            <div className="text-muted small text-truncate">{user.phoneNumber}</div>
                          </td>
                          <td className="px-3 py-2 text-center ">
                            <StatusBadge status={user.isActive ? "active" : "inactive"} />
                          </td>
                          <td className="text-muted text-center small px-3 py-2">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="d-inline-flex align-items-center gap-2">

                              {/* Toggle Switch */}
                             <div className="form-check form-switch m-0">
  <input
    className="form-check-input switch-green"
    type="checkbox"
    checked={!!user.isActive}
    onChange={() => handleToggleClick(user)}
  />
</div>




                              {/* Delete Button */}
                              <button
                                className="btn btn-sm fontcolor px-3 py-1 d-inline-flex align-items-center gap-1"
                                onClick={() =>
                                  setDeleteModal({
                                    show: true,
                                    userIds: [user.userId],
                                    loading: false
                                  })
                                }
                              >
                                <FaTrash size={14} />
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))}
                      {!loading && users.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-5">No users found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE CARDS */}
                <div className="d-md-none px-3 pb-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  <div className="row g-3">
                    {users.map((user) => (
                      <div key={user.userId} className="col-12">
                        <div className="card border-0 shadow-sm">
                          <div className="card-body py-3 px-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div className="d-flex align-items-start gap-2 flex-grow-1">
                                <div className="form-check mt-1">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={selectedUsers.includes(user.userId)}
                                    onChange={() => handleUserSelect(user.userId)}
                                  />
                                </div>
                                <div className="flex-grow-1 pe-2">
                                  <h6 className="mb-1 fw-semibold text-truncate">{user.fullName}</h6>
                                  <div className="text-muted small text-truncate">{user.email}</div>
                                  <small className="text-muted d-block text-truncate">{user.phoneNumber}</small>
                                </div>
                              </div>
                              <StatusBadge status={user.isActive ? "active" : "inactive"} />
                            </div>
                            <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                              <small className="text-muted">{formatDate(user.createdAt)}</small>
                              <div className="form-check form-switch m-0">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={!!user.isActive}
                                  onChange={() => handleToggleClick(user)}
                                />
                              </div>
                              <button
                                className="btn btn-sm fontcolor px-3 py-1 d-inline-flex align-items-center gap-1"
                                onClick={() =>
                                  setDeleteModal({
                                    show: true,
                                    userIds: [user.userId],
                                    loading: false
                                  })
                                }
                              >
                                <FaTrash size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
      <ToggelModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onConfirm={confirmStatusChange}
        currentStatus={selectedUser?.isActive}
        loading={loading}
        entityType="user"
      />

      <DeleteConfirmModal
        show={deleteModal.show}
        loading={deleteModal.loading}
        count={deleteModal.userIds.length}
        onHide={() =>
          setDeleteModal({ show: false, userIds: [], loading: false })
        }
        onConfirm={handleConfirmDelete}
      />


    </Layout>
  );
};

export default Users;