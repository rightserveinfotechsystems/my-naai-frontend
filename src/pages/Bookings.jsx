import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import Layout from "../components/Layout.jsx";
import PageHeader from "../components/PageHeader.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Pagination from "../components/Pagination.jsx";
import SearchInput from "../components/SearchInput.jsx";
import { bookingAPI } from "../services/communication.jsx";
import Loader from "../components/Loader.jsx";

const ITEMS_PER_PAGE = 20;

// Date formatting helper to show in dd/mm/yyyy format
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';

  try {
    // If it's already in the desired format, return as is
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
      return dateString;
    }

    // Handle ISO date strings like "2026-01-03T11:29:00.602Z"
    let date;
    if (dateString.includes('T') && dateString.includes('Z')) {
      date = new Date(dateString);
    } else {
      // Try parsing other formats
      date = new Date(dateString);
    }

    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() returns 0-based month
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }

    // If parsing fails, return original
    return dateString;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// Time formatting helper to extract time from various formats (12-hour format)
const formatTime = (dateString, booking) => {
  // First try to get time from booking.time field
  if (booking && booking.time) {
    try {
      // Parse time string like "14:30" or "2:30 PM"
      const timeStr = booking.time.toString();

      // If already in 12-hour format, return as is
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        return timeStr;
      }

      // Parse 24-hour format
      const timeParts = timeStr.split(':');
      if (timeParts.length >= 2) {
        let hours = parseInt(timeParts[0]);
        const minutes = timeParts[1].padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';

        // Convert to 12-hour format
        hours = hours % 12;
        hours = hours ? hours : 12;

        return `${hours}:${minutes} ${ampm}`;
      }
    } catch (error) {
      console.error('Error parsing booking.time:', error);
    }
  }

  // Fallback to parsing from date string
  if (!dateString) return 'N/A';

  try {
    let date;

    // Handle ISO date strings like "2026-01-03T11:29:00.602Z"
    if (dateString.includes('T') && dateString.includes('Z')) {
      date = new Date(dateString);
    } else {
      // Try parsing other date formats
      date = new Date(dateString);
    }

    if (!isNaN(date.getTime())) {
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';

      // Convert to 12-hour format
      hours = hours % 12;
      hours = hours ? hours : 12;

      return `${hours}:${minutes} ${ampm}`;
    }

    return 'N/A';
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'N/A';
  }
};

const Bookings = () => {
  // console.log("🏗️ Bookings component rendered");

  const [bookings, setBookings] = useState([]);
  const [salons, setSalons] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ salons: [], statuses: [] });
  const [loading, setLoading] = useState(true);
  const [salonFilter, setSalonFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(""); // Initialize with empty string
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [allBookings, setAllBookings] = useState([]);


  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("🔍 Search debounced:", search);
      setDebouncedSearch(search);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when debounced search changes
  useEffect(() => {
    console.log("📄 Search changed, resetting page. debouncedSearch:", debouncedSearch);
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Initial load
  useEffect(() => {
    console.log("🏁 Initial component mount - calling fetchBookings");
    fetchBookings();
  }, []); // Empty dependency array for initial load

  // Fetch bookings from API
  const fetchBookings = useCallback(async () => {
    console.log("🚀 fetchBookings STARTED with:", {
      search: search,
      debouncedSearch: debouncedSearch,
      salonFilter: salonFilter,
      statusFilter: statusFilter,
      currentPage: currentPage,
      dateFilter: dateFilter
    });

    setLoading(true);

    // Check for JWT token
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found, redirecting to login");
      setLoading(false);
      return;
    }

    try {
      const apiParams = {
        page: currentPage,
        search: debouncedSearch,
        status: statusFilter !== "all" ? statusFilter : undefined,
        salonId: salonFilter !== "all" ? salonFilter : undefined,
        dateFrom: dateFilter || undefined
      };

      console.log("🎯 API Parameters:", apiParams);
      console.log("📋 Final request will be:", {
        page: apiParams.page,
        searchString: apiParams.search || '',
        statusFilter: apiParams.status || '',
        salonId: apiParams.salonId || '',
        createdDate: apiParams.dateFrom || ''
      });

      console.log("🏪 Salon filter debugging:", {
        salonFilter,
        salonFilterType: typeof salonFilter,
        apiParamsSalonId: apiParams.salonId,
        apiParamsSalonIdType: typeof apiParams.salonId
      });

      const result = await bookingAPI.getBookings(apiParams);

      if (result.success) {
        console.log("📋 API result data:", result.data);
        console.log("📋 First booking sample:", result.data?.[0]);
        console.log("📋 All salon IDs in bookings:", result.data?.map(b => {
          // Try to find salon ID in booking data
          const salonId = b.salonId || b.salon_id || b.salon?.id || b.salon?.salonId;
          return { id: salonId, name: b.salonName, fullBooking: b };
        }));
        setBookings(result.data || []);
        setAllBookings(result.data || []);
        setTotalItems(result.pagination?.total || 0);
        setTotalPages(result.pagination?.totalPages || 1);
        console.log("✅ Bookings loaded:", result.data?.length || 0, "Total:", result.pagination?.total || 0);
      } else {
        // Check for authentication errors
        const isAuthError = result.message === "Invalid token payload" ||
          result.message?.includes("token") ||
          result.message?.includes("unauthorized") ||
          result.message?.includes("authenticate");

        if (isAuthError) {
          console.error("Authentication error, redirecting to login");
          localStorage.removeItem("token");
          alert("Session expired. Please login again.");
          window.location.href = "/login";
          return;
        }

        console.error("❌ Failed to fetch bookings:", result.message);
        setBookings([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);

      // Check for 401 unauthorized errors
      if (error.response?.status === 401) {
        console.error("Authentication error, redirecting to login");
        localStorage.removeItem("token");
        alert("Session expired. Please login again.");
        window.location.href = "/login";
        return;
      }

      setBookings([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, salonFilter, statusFilter, dateFilter]);

  // Fetch filter options from filter-list API
  // const fetchFilterList = useCallback(async () => {
  //   try {
  //     const result = await bookingAPI.getFilterList();
  //     if (result.success) {
  //       console.log("✅ Filter list fetched:", result.data);

  //       // Normalize salon data - handle different field names
  //       let salonData = [];
  //       if (result.data?.salons && Array.isArray(result.data.salons)) {
  //         salonData = result.data.salons;
  //       } else if (result.data?.salonList && Array.isArray(result.data.salonList)) {
  //         salonData = result.data.salonList;
  //       }

  //       // Transform salon data to have consistent structure (id and name)
  //       const normalizedSalons = salonData.map(salon => {
  //         console.log("🔍 Salon data from API:", salon);
  //         return {
  //         id: salon.id || salon.salonId || salon._id,
  //         name: salon.name || salon.salonName || salon.salon_name || 'Unknown Salon'
  //         };
  //       });

  //       setSalons(normalizedSalons);
  //       // Store all filter options
  //       setFilterOptions(result.data || { salons: [], statuses: [] });
  //     } else {
  //       console.warn("API failed for filter list:", result.message);
  //       setSalons([]);
  //       setFilterOptions({ salons: [], statuses: [] });
  //     }
  //   } catch (error) {
  //     console.error("Error fetching filter list:", error);
  //     setSalons([]);
  //     setFilterOptions({ salons: [], statuses: [] });
  //   }
  // }, []);

  // useEffect(() => {
  //   fetchFilterList();
  // }, [fetchFilterList]);

  // Handle parameter changes (skip initial render)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    console.log(" Parameters changed, fetching bookings:", {
      currentPage,
      debouncedSearch,
      salonFilter,
      statusFilter,
      dateFilter
    });
    fetchBookings();
  }, [fetchBookings, currentPage, debouncedSearch, salonFilter, statusFilter, dateFilter]);

  // Since filtering and pagination is now handled in fetchBookings, we use bookings directly
  const filtered = bookings;


  const handleFilterChange = useCallback((setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleDateChange = useCallback((e) => {
    setDateFilter(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = () => {
    setStatusFilter("all");
    setSalonFilter("all");
    setSearchTerm("");
    setCurrentPage(1);

    setBookings(allBookings);
  };



  // Debug logging
  console.log("🔍 Bookings component render:", {
    loading,
    bookingsCount: bookings.length,
    filteredCount: filtered.length,
    currentPage,
    totalPages,
    totalItems
  });

  const fetchFilterList = useCallback(async () => {
    try {
      const result = await bookingAPI.getBookingFilterList();



      if (result.success && Array.isArray(result.data)) {
        // Agar future me salon list mile to handle
        const uniqueSalons = [
          ...new Map(
            result.data
              .filter(b => b.salonName)
              .map(b => [b.salonName, { id: b.salonName, name: b.salonName }])
          ).values()
        ];

        setSalons(uniqueSalons);
        setFiltersLoaded(true);
      }
    } catch (error) {
      console.error("❌ Filter list error:", error);
    }
  }, []);


  useEffect(() => {

    console.log("🧪 BOOKINGS RAW DATA:", bookings);
    if (!bookings.length)

      return;

    // Unique salons
    const uniqueSalons = [
      ...new Map(
        bookings
          .filter(b => b.salonName)
          .map(b => [b.salonName, { id: b.salonName, name: b.salonName }])
      ).values()
    ];

    // Unique statuses
    const uniqueStatuses = [
      ...new Set(bookings.map(b => b.bookingStatus).filter(Boolean))
    ];


    setSalons(uniqueSalons);
    setFilterOptions(prev => ({
      ...prev,
      statuses: uniqueStatuses
    }));

  }, [bookings]);
  useEffect(() => {
    let filtered = [...allBookings];

    if (statusFilter !== "all") {
      filtered = filtered.filter(b => b.bookingStatus === statusFilter);
    }

    if (salonFilter !== "all") {
      filtered = filtered.filter(b => b.salonName === salonFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        b =>
          b.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.userPhone?.includes(searchTerm)
      );
    }

    setBookings(filtered);
  }, [statusFilter, salonFilter, searchTerm, allBookings]);


  return (
    <Layout>
      {/* MAIN WRAPPER - Responsive spacing */}
      <div className="page-content min-vh-100 d-flex flex-column gap-2 gap-md-3 p-2 p-md-3">

        {/* FILTERS + PAGINATION - WHITE BACKGROUND CARD (STICKY) */}
        <div className="card shadow-sm mb-1 mb-md-3 bg-white d-none d-md-block bookings-filter-sticky">
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
                        onChange={setSearch}
                        placeholder="Search by user, salon or service..."
                      />
                    </div>

                    <div className="col-12 col-md-2">
                      <select
                        className="form-select form-select-sm"
                        value={salonFilter}
                        onChange={handleFilterChange(setSalonFilter)}
                        onFocus={() => {
                          if (!filtersLoaded) {
                            fetchFilterList();
                          }
                        }}
                      >
                        <option value="all">All Salons</option>
                        {salons.map(s => (
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
                        onFocus={() => {
                          if (!filtersLoaded) {
                            fetchFilterList();
                          }
                        }}
                      >
                        <option value="all">All Status</option>
                        {filterOptions.statuses.map(status => (
                          <option key={status} value={status}>
                            {status.toUpperCase()}
                          </option>
                        ))}
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
                      onChange={setSearch}
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
                            <option key="all-mobile" value="all">All Status</option>
                            <option key="pending-mobile" value="pending">Pending</option>
                            <option key="confirmed-mobile" value="confirmed">Confirmed</option>
                            <option key="completed-mobile" value="completed">Completed</option>
                            <option key="cancelled-mobile" value="cancelled">Cancelled</option>
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
                    >
                      <i className="fa-solid fa-filter"></i>
                      {(salonFilter !== "all" || statusFilter !== "all" || dateFilter) ? (
                        <span className="badge bg-secondary ms-1" style={{ fontSize: '0.65rem', padding: '0.15rem 0.3rem' }}>!</span>
                      ) : null}
                    </button>
                  </div>
                  <div className="col">
                    <SearchInput
                      value={search}
                      onChange={setSearch}
                      placeholder="Search..."
                    />
                  </div>
                </div>

                {showMobileFilters && (
                  <div className="card border bg-light mt-2">
                    <div className="card-body p-3">
                      <div className="d-flex flex-column gap-2">
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
                        <div>
                          <label className="form-label small mb-1 fw-semibold">All Status</label>
                          <select
                            className="form-select form-select-sm"
                            value={statusFilter}
                            onChange={handleFilterChange(setStatusFilter)}
                          >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
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

                <div className="row g-2">
                  <div className="col-12 d-flex justify-content-end">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      size="sm"
                    />
                    <button
                      className="btn btn-outline-secondary btn-sm px-md-3 ms-2"
                      onClick={handleClearFilters}
                    >
                      Clear
                    </button>
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
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-5"><Loader fullScreen={false} size="sm" text="Loading..." /></td></tr>
                ) : (
                  <>
                    {filtered.map((booking, index) => (
                      <tr key={booking.id}>
                        <td className="fw-medium text-center px-2 px-md-3 py-2 text-muted">
                          {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </td>
                        <td className="fw-semibold px-2 px-md-3 py-2 text-truncate" style={{ maxWidth: '140px' }}>{booking.userName}</td>
                        <td className="px-2 px-md-3 py-2 text-truncate" style={{ maxWidth: '150px' }}>{booking.salonName}</td>
                        <td className="px-2 px-md-3 py-2 text-truncate" style={{ maxWidth: '130px' }}>{booking.serviceName}</td>
                        <td className="px-2 px-md-3 py-2">
                          <div className="small">
                            <div>{formatDate(booking.createdAt || booking.date)}</div>
                            <div className="text-muted">{formatTime(booking.createdAt || booking.date, booking)}</div>
                          </div>
                        </td>
                        <td className="fw-semibold text-black px-2 px-md-3 py-2 ">₹{booking.totalAmount}</td>
                        <td className="px-2 px-md-3 py-2"><StatusBadge status={booking.status} /></td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center text-muted py-5 bg-white">
                          No bookings found
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
          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <Loader fullScreen={false} size="sm" text="Loading..." />
            </div>
          ) : (
            <>
              {filtered.map((booking) => (
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
                        <div>{formatDate(booking.createdAt || booking.date)}</div>
                        <div className="text-muted">{formatTime(booking.createdAt || booking.date, booking)}</div>
                      </div>
                      <div className="fw-semibold text-primary fs-6 flex-shrink-0 ms-2">₹{booking.totalAmount}</div>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="alert alert-light border mb-0 text-center py-4 bg-white">
                  No bookings found
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Bookings;
