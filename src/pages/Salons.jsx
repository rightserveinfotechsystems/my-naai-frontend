import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SearchInput from "../components/SearchInput.jsx";
import Pagination from "../components/Pagination.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import SalonEditModal from "../components/SalonEditModal.jsx";
import StatusConfirmModal from "../components/StatusConfirmModal.jsx";
import { salonAPI } from "../services/communication.jsx";
import Loader from "../components/Loader.jsx";
import { toast } from 'react-toastify';
const backendURL = import.meta.env.VITE_BACKEND_URL

const ITEMS_PER_PAGE = 20;

// Helper function to get the first image for salon card display
const getSalonFirstImage = (salon) => {
  // First check for dedicated main image fields (these are NOT part of imagesArray)
  const mainImageFields = ['imageUrl', 'shopLogo', 'mainImage', 'primaryImage'];

  for (const field of mainImageFields) {
    if (salon[field]) {
      const imageUrl = salon[field];
      if (typeof imageUrl === 'string') {
        return imageUrl.startsWith('http') ? imageUrl : `${backendURL}/getFiles${imageUrl}`;
      }
    }
  }

  // Fallback: if no dedicated main image, use first image from imagesArray
  const imageFields = ['images', 'imagesArray', 'salonImages', 'imageUrls', 'photos', 'pictures'];

  for (const field of imageFields) {
    if (salon[field] && Array.isArray(salon[field]) && salon[field].length > 0) {
      const firstImage = salon[field][0];
      if (typeof firstImage === 'string') {
        return firstImage.startsWith('http') ? firstImage : `${backendURL}/getFiles${firstImage}`;
      } else if (firstImage && typeof firstImage === 'object') {
        const imageUrl = firstImage.url || firstImage.imageUrl || firstImage.photoUrl || firstImage.src || firstImage.path;
        return imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${backendURL}/getFiles${imageUrl}`) : null;
      }
    }
  }

  return null; // No image found
};

const Salons = () => {
  const navigate = useNavigate();

  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPagesFromAPI, setTotalPagesFromAPI] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingSalonId, setEditingSalonId] = useState(null);

  // Toggle modal states
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState(null);


  const fetchSalons = useCallback(async () => {
    setScrollPosition(window.pageYOffset || document.documentElement.scrollTop);
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found, redirecting to login");
      navigate("/login");
      setLoading(false);
      return;
    }

    const apiParams = {
      page: currentPage,
      searchString: debouncedSearch,
      cityFilter: cityFilter === 'all' ? undefined : cityFilter,
      statusFilter: statusFilter === 'all' ? undefined : statusFilter
    };

    console.log("Making salon API call with params:", apiParams);

    let result;
    try {
      result = await salonAPI.getSalons(apiParams);
      console.log("Salon API result:", result);
    } catch (error) {
      console.error("Salon API error caught:", error);
      result = {
        success: false,
        message: error.response?.data?.message || "Network error",
        error: error.response?.data
      };
    }

    if (result.success) {
      console.log("Setting salons data:", result.data.barberShops);
      console.log("Pagination data:", result.data.pagination);
      setSalons(result.data.barberShops || []);
      if (result.data.pagination) {
        setTotalItems(result.data.pagination.total || 0);
        setTotalPagesFromAPI(result.data.pagination.totalPages || 1);
      } else {
        setTotalItems(result.data.barberShops?.length || 0);
        setTotalPagesFromAPI(Math.ceil((result.data.barberShops?.length || 0) / ITEMS_PER_PAGE));
      }
    } else {
      const isAuthError = result.message === "Invalid token payload" ||
        result.message?.includes("token") ||
        result.message?.includes("unauthorized") ||
        result.message?.includes("authenticate") ||
        result.error?.status === 401;

      if (isAuthError) {
        console.error("Authentication error, redirecting to login");
        localStorage.removeItem("token");
        alert("Session expired. Please login again.");
        navigate("/login");
      } else {
        console.error("API Error:", result.message, result.error);
        setSalons([]);
        console.warn("Could not load salons. Using empty list.");
      }
    }

    setLoading(false);
  }, [navigate, currentPage, debouncedSearch, cityFilter, statusFilter]);

  useEffect(() => {
    fetchSalons();
  }, [fetchSalons]);

  // Debug: Monitor salons state changes
  useEffect(() => {
    console.log('Salons state changed:', salons.length, 'salons');
    salons.forEach((salon, index) => {
      const salonId = salon.salonId || salon.barberId || salon.id;
      console.log(`Salon ${index + 1}: ID=${salonId}, Active=${salon.isActive}`);
    });
  }, [salons]);

  useEffect(() => {
    if (!loading && scrollPosition > 0) {
      const timeoutId = setTimeout(() => {
        window.scrollTo({
          top: scrollPosition,
          behavior: 'instant'
        });
        setScrollPosition(0);
      }, 150);

      return () => clearTimeout(timeoutId);
    }
  }, [loading, scrollPosition]);


  const filtered = useMemo(() => {
    return salons.filter((salon) => {
      const status = salon.isActive ? "active" : "inactive";
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      return matchesStatus;
    });
  }, [salons, statusFilter]);

  // Use server-side pagination data
  const totalPages = totalPagesFromAPI;
  const paginated = filtered;

  // Modal Handlers
  const handleAddSalon = () => {
    setModalMode("add");
    setEditingSalonId(null);
    setShowModal(true);
  };

  const handleEditSalon = (salon) => {
    setModalMode("edit");
    setEditingSalonId(salon.salonId || salon.barberId || salon.id);
    setShowModal(true);
  };

  const handleToggleClick = (salon) => {
    setSelectedSalon(salon);
    setShowToggleModal(true);
  };

  const confirmToggleSalonStatus = async () => {
    const salon = selectedSalon;
    if (!salon) return;

    const salonId = salon.salonId || salon.barberId || salon.id;
    const currentStatus = salon.isActive;
    const newStatus = !currentStatus;

    console.log('Toggle confirmed:', { salonId, currentStatus, newStatus });

    // Immediate visual feedback
    setSalons(prev => {
      return prev.map(s => {
        const sId = s.salonId || s.barberId || s.id;
        if (sId === salonId) {
          console.log(`Updating salon ${sId} from ${s.isActive} to ${newStatus}`);
          // Create a completely new object to ensure re-render
          return {
            ...s,
            isActive: newStatus
          };
        }
        return s;
      });
    });

    try {
      const result = await salonAPI.toggleSalonStatus(salonId, newStatus);

      if (result.success) {
        console.log('API success, keeping new status');
        toast.success(`Salon ${newStatus ? 'activated' : 'deactivated'} successfully!`);
        setShowToggleModal(false);
        setSelectedSalon(null);
      } else {
        console.log('API failed, reverting to:', currentStatus);
        setSalons(prev => prev.map(s => {
          const sId = s.salonId || s.barberId || s.id;
          return sId === salonId ? { ...s, isActive: currentStatus } : s;
        }));
        toast.error(`Failed to ${newStatus ? 'activate' : 'deactivate'} salon`);
      }
    } catch (error) {
      console.log('Error occurred, reverting to:', currentStatus);
      setSalons(prev => prev.map(s => {
        const sId = s.salonId || s.barberId || s.id;
        return sId === salonId ? { ...s, isActive: currentStatus } : s;
      }));
      console.error('Toggle salon status error:', error);
      toast.error('Failed to update salon status');
    }
  };
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);


  return (
    <Layout>
      <div className="page-content min-vh-100 d-flex flex-column gap-2 gap-md-3 p-2 p-md-3">
        {/* FILTERS + PAGINATION - STICKY HEADER */}
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
                        placeholder="Search by name or address..."
                      />
                    </div>
                    <div className="col-12 col-md-3">
                      <select className="form-select form-select-sm" value={cityFilter} onChange={(e) => { setCityFilter(e.target.value); setCurrentPage(1); }}>
                        <option value="all">All Cities</option>
                        {["Katol", "Warud"].map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-3">
                      <select className="form-select form-select-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-lg-6 d-flex flex-column flex-sm-row gap-2 justify-content-end align-items-end">
                  <div className="d-flex justify-content-end align-items-center flex-wrap gap-2 gap-md-3 w-100 w-sm-auto">
                    <div className="flex-grow-1 flex-shrink-0 min-w-0" style={{ minWidth: '200px' }}>
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        size="sm"
                      />
                    </div>
                    <button className="btn btn-sm buttoncolor px-3 text-nowrap" onClick={handleAddSalon}>
                      + Add Salon
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* MOBILE LAYOUT */}
            <div className="d-md-none">
              <div className="d-flex flex-column gap-2">
                <div className="row g-2 align-items-center">
                  <div className="col-auto">
                    <button
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                      onClick={() => setShowMobileFilters(!showMobileFilters)}
                      type="button"
                      style={{ minWidth: 'auto', padding: '0.25rem 0.5rem' }}
                      disabled={loading}
                    >
                      <i className="fa-solid fa-filter"></i>
                      {(cityFilter !== "all" || statusFilter !== "all") ? (
                        <span className="badge bg-secondary ms-1" style={{ fontSize: '0.65rem', padding: '0.15rem 0.3rem' }}>!</span>
                      ) : null}
                    </button>
                  </div>
                  <div className="col">
                    <SearchInput
                      value={search}
                      onChange={(val) => { setSearch(val); setCurrentPage(1); }}
                      placeholder="Search..."
                      disabled={loading}
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
                            value={cityFilter}
                            onChange={(e) => { setCityFilter(e.target.value); setCurrentPage(1); }}
                            disabled={loading}
                          >
                            <option value="all">All Cities</option>
                            {["Katol", "Warud"].map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="form-label small mb-1 fw-semibold">Status</label>
                          <select
                            className="form-select form-select-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            disabled={loading}
                          >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
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
                    <button className="btn btn-sm buttoncolor ms-2" onClick={handleAddSalon} disabled={loading}>
                      Add
                    </button>
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
                      disabled={loading}
                    >
                      <i className="fa-solid fa-filter"></i>
                      {(cityFilter !== "all" || statusFilter !== "all") ? (
                        <span className="badge bg-secondary ms-1" style={{ fontSize: '0.65rem', padding: '0.15rem 0.3rem' }}>!</span>
                      ) : null}
                    </button>
                  </div>
                  <div className="col">
                    <SearchInput
                      value={search}
                      onChange={(val) => { setSearch(val); setCurrentPage(1); }}
                      placeholder="Search..."
                      disabled={loading}
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
                            value={cityFilter}
                            onChange={(e) => { setCityFilter(e.target.value); setCurrentPage(1); }}
                            disabled={loading}
                          >
                            <option value="all">All Cities</option>
                            {["Katol", "Warud"].map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="form-label small mb-1 fw-semibold">Status</label>
                          <select
                            className="form-select form-select-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            disabled={loading}
                          >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
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

        {/* DESKTOP CARDS - SCROLLABLE */}
        <div
          className="d-none d-md-block bg-white bookings-table-scroll"
          style={{
            maxHeight: 'calc(100dvh - 160px)',
            // maxHeight: 'calc(100vh - 160px)',
            overflow: 'auto',
            padding: '1rem'
          }}
        >
          <div style={{ minHeight: '320px' }}>
            {loading ? (
              <div className="d-flex justify-content-center align-items-center py-5">
                <Loader fullScreen={false} size="sm" text="Loading..." />
              </div>
            ) : paginated.length === 0 ? (
              <div className="alert alert-light text-center py-5 shadow-sm border-0">
                <i className="bi bi-search mb-2 fs-1 text-muted"></i>
                <p className="mb-0 text-muted">No salons found matching your criteria.</p>
              </div>
            ) : (
                  <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-3">
                {paginated.map((salon, index) => (
                  <div className="col" key={`${salon.barberId || salon.id || salon.salonId || index}-${salon.isActive}`}>
                    <div
                      className="card h-100 shadow-sm border-0 hover-lift-sm transition-all"
                      style={{ cursor: 'pointer', borderRadius: '12px', overflow: 'hidden' }}
                      onClick={() => navigate(`/salons/${salon.salonId || salon.barberId || salon.id}`)}
                    >
                      <div className="ratio ratio-16x9 bg-light">
                        <img
                          src={getSalonFirstImage(salon) || ""}
                          className="card-img-top"
                          alt={salon.shopName || salon.salonName || salon.name}
                          style={{ objectFit: "cover" }}
                          onError={(e) => {
                            e.target.src = "";
                          }}
                        />
                      </div>

                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="card-title mb-0 fw-bold text-truncate" style={{ maxWidth: '75%' }}>
                            {salon.shopName || salon.salonName || salon.name}
                          </h6>
                          <span className="badge bg-warning-subtle text-dark border-0">
                            ★ {salon.ratingAverage || "5.0"}
                          </span>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <p className="text-muted small mb-0 text-truncate">
                            <i className="bi bi-geo-alt-fill me-1 text-primary"></i> {salon.city}
                          </p>
                          <div
                            className="form-check form-switch mb-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleClick(salon);
                            }}
                          >
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`status-toggle-${salon.salonId || salon.barberId || salon.id}`}
                              checked={Boolean(salon.isActive)}
                              readOnly
                              style={{
                                width: '40px',
                                height: '20px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                backgroundColor: salon.isActive ? '#198754' : '#6c757d',
                                borderColor: salon.isActive ? '#198754' : '#6c757d'
                              }}
                            />
                            <label
                              className="form-check-label visually-hidden"
                              htmlFor={`status-toggle-${salon.salonId || salon.barberId || salon.id}`}
                            >
                              Toggle salon status
                            </label>
                          </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-1">
                            <i className={`bi ${salon.isActive ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'}`}></i>
                            <StatusBadge status={salon.isActive ? "active" : "inactive"} size="sm" />
                          </div>
                          <span className="small text-muted">
                            {salon.genderType ?? salon.gender ?? "Unisex"}
                          </span>
                        </div>
                      </div>

                      <div className="card-footer bg-transparent border-0 p-3 pt-0">
                        <button
                          className="btn w-100 btn-sm d-flex align-items-center justify-content-center gap-1"
                          style={{ backgroundColor: '#e1b378', color: '#000', fontWeight: '500' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSalon(salon);
                          }}
                        >
                          <i className="bi bi-pencil-square"></i> Edit Salon
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* MOBILE CARDS - SCROLLABLE */}
        <div
          className="d-md-none bg-white bookings-mobile-cards"
          style={{
            overflow: 'auto',
            padding: '1rem'
          }}
        >
          <div style={{ minHeight: '320px' }}>
            {loading ? (
              <div className="d-flex justify-content-center align-items-center py-5">
                <Loader fullScreen={false} size="sm" text="Loading..." />
              </div>
            ) : paginated.length === 0 ? (
              <div className="alert alert-light text-center py-5 shadow-sm border-0">
                <i className="bi bi-search mb-2 fs-1 text-muted"></i>
                <p className="mb-0 text-muted">No salons found matching your criteria.</p>
              </div>
            ) : (
              <div className="row row-cols-1 row-cols-sm-2 g-3"> {/* Mobile: 1-2 cols */}
                {paginated.map((salon, index) => (
                  <div className="col" key={`${salon.barberId || salon.id || salon.salonId || index}-${salon.isActive}`}>
                    {/* EXACT SAME CARD AS DESKTOP */}
                    <div
                      className="card h-100 shadow-sm border-0 hover-lift-sm transition-all"
                      style={{ cursor: 'pointer', borderRadius: '12px', overflow: 'hidden' }}
                      onClick={() => navigate(`/salons/${salon.salonId || salon.barberId || salon.id}`)}
                    >
                      <div className="ratio ratio-16x9 bg-light">
                        <img
                          src={getSalonFirstImage(salon) || ""}
                          className="card-img-top"
                          alt={salon.shopName || salon.salonName || salon.name}
                          style={{ objectFit: "cover" }}
                          onError={(e) => {
                            e.target.src = ""; // Ya placeholder add karo
                          }}
                        />
                      </div>

                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="card-title mb-0 fw-bold text-truncate" style={{ maxWidth: '75%' }}>
                            {salon.shopName || salon.salonName || salon.name}
                          </h6>
                          <span className="badge bg-warning-subtle text-dark border-0">
                            ★ {salon.ratingAverage || "5.0"}
                          </span>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <p className="text-muted small mb-0 text-truncate">
                            <i className="bi bi-geo-alt-fill me-1 text-primary"></i> {salon.city}
                          </p>
                          <div
                            className="form-check form-switch mb-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleClick(salon);
                            }}
                          >
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`status-toggle-${salon.salonId || salon.barberId || salon.id}`}
                              checked={Boolean(salon.isActive)}
                              readOnly
                              style={{
                                width: '40px',
                                height: '20px',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                backgroundColor: salon.isActive ? '#198754' : '#6c757d',
                                borderColor: salon.isActive ? '#198754' : '#6c757d'
                              }}
                            />
                            <label
                              className="form-check-label visually-hidden"
                              htmlFor={`status-toggle-${salon.salonId || salon.barberId || salon.id}`}
                            >
                              Toggle salon status
                            </label>
                          </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-1">
                            <i className={`bi ${salon.isActive ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'}`}></i>
                            <StatusBadge status={salon.isActive ? "active" : "inactive"} size="sm" />
                          </div>
                          <span className="small text-muted">
                            {salon.genderType ?? salon.gender ?? "Unisex"}
                          </span>
                        </div>
                      </div>

                      <div className="card-footer bg-transparent border-0 p-3 pt-0">
                        <button
                          className="btn w-100 btn-sm d-flex align-items-center justify-content-center gap-1"
                          style={{ backgroundColor: '#e1b378', color: '#000', fontWeight: '500' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditSalon(salon);
                          }}
                        >
                          <i className="bi bi-pencil-square"></i> Edit Salon
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
      {/* TOGGLE MODAL */}
      <StatusConfirmModal
        show={showToggleModal}
        onHide={() => setShowToggleModal(false)}
        onConfirm={confirmToggleSalonStatus}
        currentStatus={selectedSalon?.isActive}
        loading={loading}
        type="salon"
      />

      {/* MODAL COMPONENT */}
      {showModal && <SalonEditModal
        showModal={showModal}
        setShowModal={setShowModal}
        modalMode={modalMode}
        editingSalonId={editingSalonId}
        onSuccess={fetchSalons}
      />
      }
    </Layout>
  );
};

export default Salons;