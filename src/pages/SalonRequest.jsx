import { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
// import PageHeader from "../components/PageHeader.jsx";
import Pagination from "../components/Pagination.jsx";
import SearchInput from "../components/SearchInput.jsx";
import { salonRequestAPI } from "../services/communication.jsx";
import DeleteConfirmModal from "../components/DeleteConfirmModal.jsx";
import Loader from "../components/Loader.jsx";


const sampleSalons = [
  { id: "all", name: "All Salons" },
  { id: "1", name: "" },
  { id: "2", name: "" }
];

const ITEMS_PER_PAGE = 20;

const formatDate = (dateString) => {
  if (!dateString) return { date: "N/A", time: "" };
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  hours = String(hours).padStart(2, '0');
  return {
    date: `${day}/${month}/${year}`,
    time: `${hours}:${minutes} ${ampm}`
  };
};


const SalonRequest = () => {
  const navigate = useNavigate();
  const [salonFilter, setSalonFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [bookings, setBookings] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    requestIds: [],
    loading: false
  });


  // Simulate loading on mount and filter changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [salonFilter, dateFilter, search, currentPage]);


  const handleSelectAll = useCallback((e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      const selectedIds = new Set(bookings.map(b => b.requestId));
      setSelectedBookings(selectedIds);
    } else {
      setSelectedBookings(new Set());
    }
  }, [bookings]);

  // Individual checkbox
  const handleSelectBooking = useCallback((bookingId, checked) => {
    setSelectedBookings(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(bookingId);
      } else {
        newSet.delete(bookingId);
      }
      setSelectAll(newSet.size === bookings.length && bookings.length > 0);
      return newSet;
    });
  }, [bookings.length]);

  // Bulk Delete
  const handleBulkDelete = useCallback(() => {
    if (selectedBookings.size === 0) {
      alert('Please select at least one salon request to delete.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedBookings.size} salon request(s)?`)) {
      setIsLoading(true);
      // API call for bulk delete
      setTimeout(() => {
        setSelectedBookings(new Set());
        setSelectAll(false);
        setIsLoading(false);
      }, 1000);
    }
  }, [selectedBookings.size]);




  const handleFilterChange = useCallback((setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
    setSelectedBookings(new Set());
    setSelectAll(false);
    setCurrentPage(1);

  }, []);

  const handleDateChange = useCallback((e) => {
    setDateFilter(e.target.value);
    setCurrentPage(1);
    setSelectedBookings(new Set());
    setSelectAll(false);
    setCurrentPage(1);

  }, []);

  const handleClearFilters = useCallback(() => {
    setSalonFilter("all");
    setDateFilter("");
    setSearch("");
    setCurrentPage(1);
    setSelectedBookings(new Set());
    setSelectAll(false);
  }, []);

  const selectedCount = selectedBookings.size;

  const fetchSalonRequests = useCallback(async () => {
    setIsLoading(true);

    // Check for JWT token
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found, redirecting to login");
      navigate("/login");
      setIsLoading(false);
      return;
    }

    try {
      const response = await salonRequestAPI.getSalonRequests({
        page: currentPage,
        salonNameFilter: salonFilter !== "all" ? salonFilter : "",
        requestDate: dateFilter,
        searchString: debouncedSearch
      });

      if (response.success) {
        setBookings(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
      } else {
        // Check for authentication errors
        const isAuthError = response.message === "Invalid token payload" ||
          response.message?.includes("token") ||
          response.message?.includes("unauthorized") ||
          response.message?.includes("authenticate");

        if (isAuthError) {
          console.error("Authentication error, redirecting to login");
          localStorage.removeItem("token");
          alert("Session expired. Please login again.");
          navigate("/login");
          return;
        }

        console.warn("API returned success=false for salon requests:", response.message);
        setBookings([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching salon requests:", error);

      // Check for 401 unauthorized errors
      if (error.response?.status === 401) {
        console.error("Authentication error, redirecting to login");
        localStorage.removeItem("token");
        alert("Session expired. Please login again.");
        navigate("/login");
        return;
      }

      setBookings([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, salonFilter, dateFilter, debouncedSearch, navigate]);

  useEffect(() => {
    fetchSalonRequests();
  }, [fetchSalonRequests]);


  const handleConfirmDelete = async () => {
    setDeleteModal(prev => ({ ...prev, loading: true }));


    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found, redirecting to login");
      localStorage.removeItem("token");
      navigate("/login");
      setDeleteModal(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const res = await salonRequestAPI.deleteSalonRequests(
        deleteModal.requestIds
      );

      if (res.success) {
        await fetchSalonRequests();

        setSelectedBookings(new Set());
        setSelectAll(false);

        setDeleteModal({
          show: false,
          requestIds: [],
          loading: false
        });
      } else {
        // Check for authentication errors
        const isAuthError = res.message === "Invalid token payload" ||
          res.message?.includes("token") ||
          res.message?.includes("unauthorized") ||
          res.message?.includes("authenticate");

        if (isAuthError) {
          console.error("Authentication error, redirecting to login");
          localStorage.removeItem("token");
          alert("Session expired. Please login again.");
          navigate("/login");
          return;
        }

        alert(res.message || "Delete failed");
        setDeleteModal(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error("Error deleting salon requests:", error);

      // Check for 401 unauthorized errors
      if (error.response?.status === 401) {
        console.error("Authentication error, redirecting to login");
        localStorage.removeItem("token");
        alert("Session expired. Please login again.");
        navigate("/login");
        return;
      }

      alert(error.response?.data?.message || "Delete failed");
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
      setSelectedBookings(new Set());
      setSelectAll(false);
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [search]);



  return (
    <Layout>
      <div className="page-content min-vh-100 d-flex flex-column gap-2 gap-md-3 p-2">

        {/* FILTERS + PAGINATION + BULK ACTIONS */}
        <div className="card shadow-sm mb-1 mb-md-3 bg-white d-none d-md-block bookings-filter-sticky">
          <div className="card-body p-2 p-md-3">
            {/* DESKTOP LAYOUT */}
            <div className="d-none d-md-block">
              <div className="row g-2 g-md-3 align-items-end">
                <div className="col-12 col-lg-6">
                  <div className="row g-2">
                    <div className="col-12 col-md-6">
                      <SearchInput
                        value={search}
                        onChange={(val) => setSearch(val)}
                        placeholder="Search by salon name or owner..."
                      />
                    </div>

                    {/* <div className="col-12 col-md-3">
                      <select
                        className="form-select form-select-sm"
                        value={salonFilter}
                        onChange={handleFilterChange(setSalonFilter)}
                      >
                        {sampleSalons.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div> */}
                    {/* <div className="col-12 col-md-3">
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={dateFilter}
                        onChange={handleDateChange}
                      />
                    </div> */}
                  </div>
                </div>

                <div className="col-12 col-lg-6 d-flex flex-column flex-sm-row justify-content-end align-items-end">
                  <div className="d-flex gap-1 flex-wrap align-items-center"></div>
                  {/* Bulk Actions */}
                  {selectedBookings.size > 0 && (
                    <button
                      className="btn btn-sm btn-danger d-flex align-items-center gap-1 mb-1"
                      onClick={() =>
                        setDeleteModal({
                          show: true,
                          requestIds: Array.from(selectedBookings),
                          loading: false
                        })
                      }
                    >
                      <i className="fa-solid fa-trash"></i>
                      <span>({selectedBookings.size})</span>
                    </button>
                  )}


                  <div className="d-none d-md-block border-start mx-1 mb-2" style={{ height: '24px' }}></div>
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

            {/* MOBILE LAYOUT */}
            <div className="d-md-none">
              <div className="d-flex flex-column gap-2">
                <div className="row g-2 align-items-center">
                  {/* <div className="col-auto">
                    <button
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                      onClick={() => setShowMobileFilters(!showMobileFilters)}
                      type="button"
                      style={{ minWidth: 'auto', padding: '0.25rem 0.5rem' }}
                      disabled={isLoading}
                    >
                      <i className="fa-solid fa-filter"></i>
                      {(salonFilter !== "all" || dateFilter) ? (
                        <span className="badge bg-secondary ms-1" style={{ fontSize: '0.65rem', padding: '0.15rem 0.3rem' }}>!</span>
                      ) : null}
                    </button>
                  </div> */}
                  <div className="col">
                    <SearchInput
                      value={search}
                      onChange={(val) => {
                        setSearch(val);
                        setCurrentPage(1);
                        setSelectedBookings(new Set());
                        setSelectAll(false);
                      }}
                      placeholder="Search..."
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Mobile Bulk Actions */}
                {selectedBookings.size > 0 && (
                  <button
                    className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                    onClick={() =>
                      setDeleteModal({
                        show: true,
                        requestIds: Array.from(selectedBookings),
                        loading: false
                      })
                    }
                  >
                    <i className="fa-solid fa-trash"></i>
                    <span>({selectedBookings.size})</span>
                  </button>
                )}


                {/* {showMobileFilters && (
                  <div className="card border bg-light mt-2">
                    <div className="card-body p-3">
                      <div className="d-flex flex-column gap-2">
                        <div>
                          <label className="form-label small mb-1 fw-semibold">All Salons</label>
                          <select
                            className="form-select form-select-sm"
                            value={salonFilter}
                            onChange={handleFilterChange(setSalonFilter)}
                            disabled={isLoading}
                          >
                            {sampleSalons.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="form-label small mb-1 fw-semibold">Date</label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={dateFilter}
                            onChange={handleDateChange}
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )} */}

                <div className="row g-2">
                  <div className="col-12 d-flex justify-content-end">
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
          </div>
        </div>

        {/* MOBILE FILTERS - NON-STICKY */}
        <div className="d-md-none mb-3">
          <div className="card shadow-sm bg-white">
            <div className="card-body p-2 p-md-3">
              <div className="d-flex flex-column gap-2">
                <div className="row g-2 align-items-center">
                  <div className="col-auto">
                    <button
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                      onClick={() => setShowMobileFilters(!showMobileFilters)}
                      type="button"
                      style={{ minWidth: 'auto', padding: '0.25rem 0.5rem' }}
                      disabled={isLoading}
                    >
                      <i className="fa-solid fa-filter"></i>
                      {(salonFilter !== "all" || dateFilter) ? (
                        <span className="badge bg-secondary ms-1" style={{ fontSize: '0.65rem', padding: '0.15rem 0.3rem' }}>!</span>
                      ) : null}
                    </button>
                  </div>
                  <div className="col">
                    <SearchInput
                      value={search}
                      onChange={(val) => { setSearch(val); setCurrentPage(1); }}
                      placeholder="Search..."
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {showMobileFilters && (
                  <div className="card border bg-light mt-2">
                    <div className="card-body p-3">
                      <div className="d-flex flex-column gap-2">
                        <div>
                          <label className="form-label small mb-1 fw-semibold">City</label>
                          <select
                            className="form-select form-select-sm"
                            value={salonFilter}
                            onChange={(e) => { setSalonFilter(e.target.value); setCurrentPage(1); }}
                            disabled={isLoading}
                          >
                            <option value="all">All Cities</option>
                            <option value="Katol">Katol</option>
                            <option value="Warud">Warud</option>
                          </select>
                        </div>
                        <div>
                          <label className="form-label small mb-1 fw-semibold">Date</label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={dateFilter}
                            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="row g-2">
                  <div className="col-12 d-flex justify-content-end">
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
          </div>
        </div>

        {/* DESKTOP TABLE - SCROLLABLE AREA BELOW STICKY FILTERS */}
        <div
          className="table-responsive d-none d-md-block mb-2 mb-md-3 bg-white bookings-table-scroll"
          style={{
                          scrollbarWidth: 'thin',

            maxHeight: 'calc(100dvh - 160px)',
            // maxHeight: 'calc(100vh - 160px)',
            overflow: 'auto'
          }}
        >
          <div style={{ minHeight: '320px', backgroundColor: 'white' }}>
            <table className="table table-hover mb-0 align-middle text-nowrap">
              <thead className="table-light position-sticky top-0 bg-white border-bottom z-10">
              <tr>
                <th style={{ width: '50px' }} className="px-2 py-2 border-bottom text-center">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    disabled={isLoading}
                  />
                </th>
                <th style={{ width: '60px' }} className="px-2 py-2 border-bottom text-center fw-medium">No.</th>
                <th style={{ width: '160px' }} className="px-1 px-md-2 px-lg-3 py-2 border-bottom">Salon Owner</th>
                <th style={{ width: '150px' }} className="px-1 px-md-2 px-lg-3 py-2 border-bottom">Salon Name</th>
                <th style={{ width: '220px' }} className="px-1 px-md-2 px-lg-3 py-2 border-bottom">Address</th>
                <th style={{ width: '140px' }} className="px-1 px-md-2 px-lg-3 py-2 border-bottom">City</th>
                <th style={{ width: '140px' }} className="px-1 px-md-2 px-lg-3 py-2 border-bottom">Mobile</th>
                <th style={{ width: '200px' }} className="px-1 px-md-2 px-lg-3 py-2 border-bottom text-center">Created</th>
                <th style={{ width: '80px' }} className="px-1 px-md-2 px-lg-3 py-2 border-bottom text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-5"><Loader fullScreen={false} size="sm" text="Loading..." /></td></tr>
              ) : (
                <>
                  {bookings.map((booking, index) => (
                    <tr key={booking.requestId || index}>
                      <td className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedBookings.has(booking.requestId)}
                          onChange={(e) =>
                            handleSelectBooking(booking.requestId, e.target.checked)
                          }
                          disabled={isLoading}
                        />
                      </td>
                      <td className="px-2 py-2 text-center fw-medium text-muted small">
                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                      </td>
                      <td className="fw-semibold px-2 px-md-3 py-2 text-truncate" style={{ maxWidth: '160px' }}>
                        {booking.fullName || 'N/A'}
                      </td>
                      <td className="px-2 px-md-3 py-2 text-truncate" style={{ maxWidth: '150px' }}>
                        {booking.salonName}
                      </td>
                      <td className="px-2 px-md-3 py-2 text-truncate" style={{ maxWidth: '220px' }}>
                        {booking.address || 'N/A'}
                      </td>
                      <td className="px-2 px-md-3 py-2 text-truncate" style={{ maxWidth: '220px' }}>
                        {booking.city || 'N/A'}
                      </td>
                      <td className="fw-semibold px-2 px-md-3 py-2 text-truncate " style={{ maxWidth: '140px' }}>
                        {booking.phoneNumber || 'N/A'}
                      </td>
                      <td className="px-2 px-md-3 py-2 text-center">
                        <div className="d-flex flex-column align-items-center gap-1">
                          <div className="text-center">
                            <div className="fw-medium small">{formatDate(booking.createdAt).date}</div>
                            {/* <div className="text-muted small">{formatDate(booking.createdAt).time}</div> */}
                          </div>
                        </div>
                      </td>
                      <td className="text-center px-2 px-md-3 py-2">
                        <button
                          className="btn fontcolor btn-sm"
                          onClick={() =>
                            setDeleteModal({
                              show: true,
                              requestIds: [booking.requestId]
                            })
                          }
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>

                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-5 bg-white">
                        No Request found
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* MOBILE CARDS */}
        <div
          className="d-md-none bg-white bookings-mobile-cards"
          style={{
            overflow: 'auto',
            padding: '1rem'
          }}
        >
          {isLoading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <Loader fullScreen={false} size="sm" text="Loading..." />
            </div>
          ) : (
            <>
              {bookings.map((booking, index) => (
                <div key={booking.requestId || index} className="mb-3">
                  {/* Number Badge */}
                  <div className="d-flex align-items-center mb-2">
                    <span className="badge bg-light text-dark fw-medium small me-2">
                      #{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </span>
                  </div>
                  <div className="card shadow-sm border-0 bg-white">
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="form-check me-3">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedBookings.has(booking.requestId)}
                            onChange={(e) => handleSelectBooking(booking.requestId, e.target.checked)}
                            id={`mobile-${booking.requestId}`}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="flex-grow-1 pe-2 min-w-0">
                          <div className="fw-semibold text-truncate">{booking.salonName}</div>
                          <div className="text-muted small text-truncate">Owner: {booking.fullName || 'N/A'}</div>
                        </div>
                        <button
                          className="btn fontcolor btn-sm"
                          onClick={() =>
                            setDeleteModal({
                              show: true,
                              requestIds: [booking.requestId]
                            })
                          }
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>

                      </div>
                      <div className="text-muted small mb-2 text-truncate">{booking.address || 'N/A'}</div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="small text-truncate">{booking.phoneNumber || 'N/A'}</div>
                      </div>
                      <div className="small">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <i className="bi bi-calendar-plus text-primary" style={{ fontSize: '0.8rem' }}></i>
                          <span><strong>Created:</strong></span>
                        </div>
                        <div className="ms-3 mb-1">
                          <div className="fw-medium small">{formatDate(booking.createdAt).date}</div>
                          <div className="text-muted small">{formatDate(booking.createdAt).time}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {bookings.length === 0 && (
                <div className="alert alert-light border mb-0 text-center py-4 bg-white">
                  No bookings found
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <DeleteConfirmModal
        show={deleteModal.show}
        loading={deleteModal.loading}
        count={deleteModal.requestIds.length}
        onHide={() =>
          setDeleteModal({ show: false, requestIds: [], loading: false })
        }
        onConfirm={handleConfirmDelete}
      />

    </Layout>
  );
};

export default SalonRequest;
