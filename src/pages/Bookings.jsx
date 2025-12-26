import { useMemo, useState, useCallback } from "react";
import Layout from "../components/Layout.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Pagination from "../components/Pagination.jsx";
import SearchInput from "../components/SearchInput.jsx";
import { bookings as bookingData, salons } from "../data/mockData.js";

const ITEMS_PER_PAGE = 20;

const Bookings = () => {
  const [salonFilter, setSalonFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filtered = useMemo(() => {
    const result = bookingData.filter((booking) => {
      const matchesSalon = salonFilter === "all" || booking.salonId === salonFilter;
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
      const matchesDate = !dateFilter || booking.date === dateFilter;
      const matchesSearch = !search || 
        booking.userName.toLowerCase().includes(search.toLowerCase()) ||
        booking.salonName.toLowerCase().includes(search.toLowerCase()) ||
        booking.serviceName.toLowerCase().includes(search.toLowerCase());
      return matchesSalon && matchesStatus && matchesDate && matchesSearch;
    });
    // console.log(" FILTERED:", result.length, "bookings");
    return result;
  }, [salonFilter, statusFilter, dateFilter, search]);

  const totalPages = Math.max(Math.ceil(filtered.length / ITEMS_PER_PAGE), 1);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // console.log(" PAGINATION:", { filtered: filtered.length, totalPages, currentPage, ITEMS_PER_PAGE });

  const handleFilterChange = useCallback((setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleDateChange = useCallback((e) => {
    setDateFilter(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSalonFilter("all");
    setStatusFilter("all");
    setDateFilter("");
    setSearch("");
    setCurrentPage(1);
  }, []);

  return (
    <Layout>
      {/* MAIN WRAPPER - Responsive spacing */}
      <div className="page-content min-vh-100 d-flex flex-column gap-2 gap-md-3 p-2 p-md-3">
        
        {/* FILTERS + PAGINATION - WHITE BACKGROUND CARD (STICKY) */}
        <div className="card shadow-sm mb-1 mb-md-3 bg-white bookings-filter-sticky">
          <div className="card-body p-2 p-md-3">
            {/* DESKTOP LAYOUT */}
            <div className="d-none d-md-block">
              <div className="row g-2 g-md-3 align-items-end">
                
                {/* LEFT SIDE - Search + Filters */}
                <div className="col-12 col-lg-7">
                  <div className="row g-2">
                    {/* Search */}
                    <div className="col-12 col-md-6">
                      <SearchInput
                        value={search}
                        onChange={(val) => {
                          setSearch(val);
                          setCurrentPage(1);
                        }}
                        placeholder="Search by user, salon or service..."
                      />
                    </div>
                    
                    <div className="col-12 col-md-2">
                      <select
                        className="form-select form-select-sm"
                        value={salonFilter}
                        onChange={handleFilterChange(setSalonFilter)}
                      >
                        <option value="all">All Salons</option>
                        {salons.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-2">
                      <select
                        className="form-select form-select-sm"
                        value={statusFilter}
                        onChange={handleFilterChange(setStatusFilter)}
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-2">
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={dateFilter}
                        onChange={handleDateChange}
                      />
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE - Pagination + Clear */}
                <div className="col-12 col-lg-5 d-flex flex-column flex-sm-row gap-2 justify-content-end align-items-end">
                  <div className="d-flex justify-content-end align-items-center flex-wrap gap-2 gap-md-3 w-100 w-sm-auto">
                    <div className="text-muted small flex-shrink-0 d-none d-md-block">
                      {/* Showing {paginated.length} of {filtered.length}  */}
                    </div>
                    
                    {/* PAGINATION */}
                    <div className="flex-grow-1 flex-shrink-0 min-w-0" style={{ minWidth: '200px' }}>
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        size="sm"
                      />
                    </div>
                    
                    <button
                      className="btn btn-outline-secondary btn-sm px-md-3 flex-shrink-0"
                      onClick={handleClearFilters}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* MOBILE LAYOUT */}
            <div className="d-md-none">
              <div className="d-flex flex-column gap-2">
                {/* Row 1: Filter Button (small) | Search (flex-grow) */}
                <div className="row g-2 align-items-center">
                  <div className="col-auto">
                    <button
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                      onClick={() => setShowMobileFilters(!showMobileFilters)}
                      type="button"
                      style={{ minWidth: 'auto', padding: '0.25rem 0.5rem' }}
                    >
                      <i className="fa-solid fa-filter"></i>
                      {(salonFilter !== "all" || statusFilter !== "all" || dateFilter) ? (
                        <span className="badge bg-secondary ms-1" style={{ fontSize: '0.65rem', padding: '0.15rem 0.3rem' }}>!</span>
                      ) : null}
                      {/* <i className={`bi bi-chevron-${showMobileFilters ? 'up' : 'down'} ms-1`}></i> */}
                    </button>
                  </div>
                  <div className="col">
                    <SearchInput
                      value={search}
                      onChange={(val) => {
                        setSearch(val);
                        setCurrentPage(1);
                      }}
                      placeholder="Search..."
                    />
                  </div>
                </div>

                {/* Collapsible Filters */}
                {showMobileFilters && (
                  <div className="card border bg-light mt-2">
                    <div className="card-body p-3">
                      <div className="d-flex flex-column gap-2">
                        {/* All Salons */}
                        <div>
                          <label className="form-label small mb-1 fw-semibold">All Salons</label>
                          <select
                            className="form-select form-select-sm"
                            value={salonFilter}
                            onChange={handleFilterChange(setSalonFilter)}
                          >
                            <option value="all">All Salons</option>
                            {salons.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* All Status */}
                        <div>
                          <label className="form-label small mb-1 fw-semibold">All Status</label>
                          <select
                            className="form-select form-select-sm"
                            value={statusFilter}
                            onChange={handleFilterChange(setStatusFilter)}
                          >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>

                        {/* Date */}
                        <div>
                          <label className="form-label small mb-1 fw-semibold">Date</label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={dateFilter}
                            onChange={handleDateChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Row 2: Pagination */}
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
            maxHeight: 'calc(100dvh - 160px)',
            maxHeight: 'calc(100vh - 160px)', /* Fallback */
            overflow: 'auto'
          }}
        >
          <div style={{ minHeight: '320px', backgroundColor: 'white' }}>
            <table className="table table-hover mb-0" >
              <thead className="table-light position-sticky top-0 bg-white border-bottom z-10">
                <tr>
                  <th style={{ minWidth: '50px', maxWidth: '60px' }} className="px-1 px-md-2 px-lg-3 py-2 border-bottom text-center">No.</th>
                  <th style={{ minWidth: '120px', maxWidth: '140px' }} className="px-1 px-md-2 px-lg-3 py-2 border-bottom">User</th>
                  <th style={{ minWidth: '120px', maxWidth: '150px' }} className="px-1 px-md-2 px-lg-3 py-2 border-bottom">Salon</th>
                  <th style={{ minWidth: '100px', maxWidth: '130px' }} className="px-1 px-md-2 px-lg-3 py-2 border-bottom">Service</th>
                  <th style={{ minWidth: '130px', maxWidth: '160px' }} className="px-1 px-md-2 px-lg-3 py-2 border-bottom">Date & Time</th>
                  <th style={{ minWidth: '80px', maxWidth: '110px' }} className="px-1 px-md-2 px-lg-3 py-2 border-bottom ">Amount</th>
                  <th style={{ minWidth: '100px', maxWidth: '120px' }} className="px-1 px-md-2 px-lg-3 py-2 border-bottom">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((booking, index) => (
                  <tr key={booking.id}>
                    <td className="fw-medium text-center px-2 px-md-3 py-2 text-muted">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="fw-semibold px-2 px-md-3 py-2 text-truncate" style={{ maxWidth: '140px' }}>{booking.userName}</td>
                    <td className="px-2 px-md-3 py-2 text-truncate" style={{ maxWidth: '150px' }}>{booking.salonName}</td>
                    <td className="px-2 px-md-3 py-2 text-truncate" style={{ maxWidth: '130px' }}>{booking.serviceName}</td>
                    <td className="px-2 px-md-3 py-2">
                      <div className="small">
                        <div>{booking.date}</div>
                        <div className="text-muted">{booking.time}</div>
                      </div>
                    </td>
                    <td className="fw-semibold text-black px-2 px-md-3 py-2 ">₹{booking.totalAmount}</td>
                    <td className="px-2 px-md-3 py-2"><StatusBadge status={booking.status} /></td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-5 bg-white">
                      No bookings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MOBILE CARDS */}
        <div className="d-md-none bg-white bookings-mobile-cards">
          {paginated.map((booking) => (
            <div key={booking.id} className="card shadow-sm border-0 bg-white">
              <div className="card-body p-2 p-md-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="flex-grow-1 pe-2 min-w-0">
                    <div className="fw-semibold text-truncate">{booking.userName}</div>
                    <div className="text-muted small text-truncate">{booking.salonName}</div>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
                <div className="text-muted small mb-2 text-truncate">{booking.serviceName}</div>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="small">
                    <div>{booking.date}</div>
                    <div className="text-muted">{booking.time}</div>
                  </div>
                  <div className="fw-semibold text-primary fs-6 flex-shrink-0 ms-2">₹{booking.totalAmount}</div>
                </div>
              </div>
            </div>
          ))}
          {paginated.length === 0 && (
            <div className="alert alert-light border mb-0 text-center py-4 bg-white">
              No bookings found
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Bookings;
