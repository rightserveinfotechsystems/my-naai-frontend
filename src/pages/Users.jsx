import { useMemo, useState } from "react";
import Layout from "../components/Layout.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SearchInput from "../components/SearchInput.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Pagination from "../components/Pagination.jsx";
import { FaTrash } from "react-icons/fa";
import { users as initialUsers } from "../data/mockData.js";

const ITEMS_PER_PAGE = 20;

const Users = () => {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "", status: "active" });
  const [selectedUsers, setSelectedUsers] = useState([]);

  const filtered = useMemo(() => {
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.phone.includes(search)
    );
  }, [users, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const showPagination = totalPages > 1;

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(paginated.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectAllMobile = (e) => {
    if (e.target.checked) {
      setSelectedUsers(filtered.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const deleteSelectedUsers = () => {
    setUsers(users.filter(user => !selectedUsers.includes(user.id)));
    setSelectedUsers([]);
    setCurrentPage(1);
  };

  const deleteUser = (id) => {
    setUsers(users.filter((u) => u.id !== id));
    setSelectedUsers(prev => prev.filter(selectedId => selectedId !== id));
  };

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
                      checked={selectedUsers.length === filtered.length && filtered.length > 0}
                      onChange={handleSelectAllMobile}
                    />
                    <label className="form-check-label small fw-medium mb-0">
                      Select all ({filtered.length})
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
                    <div className="col-12 col-md-auto" style={{ flex: '1 1 auto', minWidth: '200px', maxWidth: '30%  ' }}>
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

                      {/* Bulk Actions (Select All, Delete & Clear) */}
                      <div className="d-flex gap-1 flex-wrap align-items-center">
                        {/* <button
                          className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                          onClick={() => {
                            if (selectedUsers.length === paginated.length && paginated.length > 0) {
                              setSelectedUsers([]);
                            } else {
                              setSelectedUsers(paginated.map(user => user.id));
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            className="form-check-input me-1 mt-0"
                            checked={selectedUsers.length === paginated.length && paginated.length > 0}
                            readOnly
                          />
                          Select All
                        </button> */}

                        <button
                          className={`btn btn-sm btn-danger d-flex align-items-center gap-1 ${selectedUsers.length > 0 ? '' : 'opacity-50 cursor-not-allowed'
                            }`}
                          onClick={selectedUsers.length > 0 ? deleteSelectedUsers : undefined}
                          disabled={selectedUsers.length === 0}
                        >
                          <FaTrash size={14} />
                          <span className="d-none d-sm-inline">({selectedUsers.length})</span>
                        </button>

                        <button
                          className={`btn btn-sm btn-outline-secondary ${selectedUsers.length > 0 ? '' : 'opacity-50 cursor-not-allowed'
                            }`}
                          onClick={selectedUsers.length > 0 ? () => setSelectedUsers([]) : undefined}
                          disabled={selectedUsers.length === 0}
                        >
                          Clear
                        </button>
                      </div>

                      {/* Vertical Divider (Optional - Sirf desktop par dikhega) */}
                      <div className="d-none d-md-block border-start mx-1" style={{ height: '24px' }}></div>

                      {/* Pagination - Ab ye bilkul right corner mein push ho jayega */}
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
                    <thead className="table-light position-sticky  top-0 bg-white border-bottom z-10">
                      <tr>
                        <th scope="col" className="py-2 ps-4 pe-2 w-auto">
                          <div className="form-check m-0">
                            <input
                              className="form-check-input shadow-none"
                              type="checkbox"
                              id="selectAll"
                              checked={selectedUsers.length === paginated.length && paginated.length > 0}
                              onChange={handleSelectAll}
                            />
                          </div>
                        </th>
                        <th scope="col" className="py-2 ps-3 pe-2 w-auto ">No.</th>
                        <th scope="col" className="py-2 pe-3 text-nowrap">Name</th>
                        <th scope="col" className="py-2 pe-3 text-nowrap">Email / Phone</th>
                        <th scope="col" className="py-2 pe-2 text-nowrap">Status</th>
                        <th scope="col" className="py-2 pe-5 text-end ">Created</th>
                        <th scope="col" className="py-2 pe-4 text-end text-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((user, index) => (
                        <tr key={user.id} className="align-middle">
                           <td className="ps-4 pe-2">
                            <div className="form-check m-0">
                              <input
                                className="form-check-input shadow-none"
                                type="checkbox"
                                checked={selectedUsers.includes(user.id)}
                                onChange={() => handleUserSelect(user.id)}
                              />
                            </div>
                          </td>
                          <td className="ps-3 pe-2 fw-medium text-muted">
                            {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                          </td>
                         
                          <td className="fw-semibold pe-3">
                            <div className="text-truncate" style={{ maxWidth: '180px' }}>
                              {user.name}
                            </div>
                          </td>
                          <td className="pe-3">
                            <div className="small fw-medium text-truncate" style={{ maxWidth: '220px' }}>
                              {user.email}
                            </div>
                            <div className="text-muted small text-truncate">{user.phone}</div>
                          </td>
                          <td className="pe-1">
                            <StatusBadge status={user.status} />
                          </td>
                          <td className="text-muted text-end small pe-5 ">
                            {user.createdAt}
                          </td>
                          <td className="text-end pe-4">
                            <button
                              className="btn btn-sm btn-outline-danger px-3 py-1 d-inline-flex align-items-center gap-1"
                              onClick={() => deleteUser(user.id)}
                            >
                              <FaTrash size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {paginated.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-5">
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE CARDS */}
                <div className="d-md-none px-3 pb-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  <div className="row g-3">
                    {paginated.map((user) => (
                      <div key={user.id} className="col-12">
                        <div className="card border-0 shadow-sm">
                          <div className="card-body py-3 px-3">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div className="d-flex align-items-start gap-2 flex-grow-1">
                                <div className="form-check mt-1">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={selectedUsers.includes(user.id)}
                                    onChange={() => handleUserSelect(user.id)}
                                  />
                                </div>
                                <div className="flex-grow-1 pe-2">
                                  <h6 className="mb-1 fw-semibold text-truncate">{user.name}</h6>
                                  <div className="text-muted small text-truncate">{user.email}</div>
                                  <small className="text-muted d-block text-truncate">{user.phone}</small>
                                </div>
                              </div>
                              <StatusBadge status={user.status} />
                            </div>
                            <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                              <small className="text-muted">{user.createdAt}</small>
                              <button
                                className="btn btn-sm btn-outline-danger px-3 py-1 d-inline-flex align-items-center gap-1"
                                onClick={() => deleteUser(user.id)}
                              >
                                <FaTrash size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {paginated.length === 0 && (
                      <div className="col-12 text-center py-5 text-muted">
                        No users found
                      </div>
                    )}
                  </div>
                </div>


              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Users;
