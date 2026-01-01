import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SearchInput from "../components/SearchInput.jsx";
import Pagination from "../components/Pagination.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import SalonEditModal from "../components/SalonEditModal.jsx";
import { salonAPI } from "../services/communication.jsx";

const ITEMS_PER_PAGE = 20;

const Salons = () => {
  const navigate = useNavigate();

  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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
      searchString: search,
      cityFilter: cityFilter === 'all' ? undefined : cityFilter
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
  }, [navigate, currentPage, search, cityFilter, statusFilter]);

  useEffect(() => {
    fetchSalons();
  }, [fetchSalons]);

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

  return (
    <Layout>
      <div className="pb-4 p-md-4">
        {/* TOP FILTERS & SEARCH */}
        <div className="card shadow-sm border-0 mb-3 mb-md-4 sticky-top" style={{ top: '10px', zIndex: '1020' }}>
          <div className="card-body p-2 p-md-3">

            {/* Desktop Layout (md and up) */}
            <div className="d-none d-md-block">
              <div className="row g-2 align-items-center">
                <div className="col-md-4">
                  <SearchInput
                    value={search}
                    onChange={(val) => { setSearch(val); setCurrentPage(1); }}
                    placeholder="Search by name or address..."
                  />
                </div>
                <div className="col-md-2">
                  <select className="form-select form-select-sm" value={cityFilter} onChange={(e) => { setCityFilter(e.target.value); setCurrentPage(1); }}>
                    <option value="all">All Cities</option>
                    {["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Pune"].map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <select className="form-select form-select-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-md-4 d-flex justify-content-end align-items-center gap-2">
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} size="sm" />
                  <button className="btn btn-sm buttoncolor px-3 text-nowrap" onClick={handleAddSalon}>
                    + Add Salon
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Layout (below md) */}
            <div className="d-md-none flex-column d-flex gap-2">
              <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowMobileFilters(!showMobileFilters)}>
                  <i className="fa-solid fa-filter"></i>
                </button>
                <div className="flex-grow-1">
                  <SearchInput value={search} onChange={(val) => setSearch(val)} placeholder="Search..." />
                </div>
              </div>
              {showMobileFilters && (
                <div className="p-2 bg-light rounded shadow-sm">
                  <div className="mb-2">
                    <label className="small fw-bold">City</label>
                    <select className="form-select form-select-sm" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
                      <option value="all">All Cities</option>
                      {["Nagpur"].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="small fw-bold">Status</label>
                    <select className="form-select form-select-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="d-flex justify-content-between align-items-center mt-1">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} size="sm" />
                <button className="btn btn-sm buttoncolor" onClick={handleAddSalon}>Add</button>
              </div>
            </div>
          </div>
        </div>

        {/* LOADING SPINNER */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status"></div>
            <p className="mt-2 text-muted">Fetching Salons...</p>
          </div>
        ) : paginated.length === 0 ? (
          /* EMPTY STATE */
          <div className="alert alert-light text-center py-5 shadow-sm border-0">
            <i className="bi bi-search mb-2 fs-1 text-muted"></i>
            <p className="mb-0 text-muted">No salons found matching your criteria.</p>
          </div>
        ) : (
          <div
            className="row row-cols-1 row-cols-sm-2 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-3 mb-4"
            style={{
              minHeight: '400px',
              scrollBehavior: 'smooth'
            }}
          >
            {paginated.map((salon, index) => (
              <div className="col" key={salon.barberId || salon.id || salon.salonId || index}>
                <div
                  className="card h-100 shadow-sm border-0 hover-lift-sm transition-all"
                  style={{ cursor: 'pointer', borderRadius: '12px', overflow: 'hidden' }}
                  onClick={() => navigate(`/salons/${salon.salonId || salon.barberId || salon.id}`)}
                >
                  <div className="ratio ratio-16x9 bg-light">
                    <img
                      src={salon.imageUrl || salon.shopLogo || "https://via.placeholder.com/400x225?text=No+Image"}
                      className="card-img-top"
                      alt={salon.shopName || salon.salonName || salon.name}
                      style={{ objectFit: "cover" }}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/400x225?text=No+Image";
                      }}
                    />
                  </div>

                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="card-title mb-0 fw-bold text-truncate" style={{ maxWidth: '75%' }}>
                        {salon.shopName || salon.salonName || salon.name}
                      </h6>
                      <span className="badge bg-warning-subtle text-dark border-0">
                        ★ {salon.rating || "5.0"}
                      </span>
                    </div>

                    <p className="text-muted small mb-2 text-truncate">
                      <i className="bi bi-geo-alt me-1"></i> {salon.city}
                    </p>

                    <div className="d-flex justify-content-between align-items-center">
                      <StatusBadge status={salon.isActive ? "active" : "inactive"} size="sm" />
                      <span className="small text-muted">{salon.gender || "Unisex"}</span>
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

      {/* MODAL COMPONENT */}
      <SalonEditModal
        showModal={showModal}
        setShowModal={setShowModal}
        modalMode={modalMode}
        editingSalonId={editingSalonId}
        onSuccess={fetchSalons} // Refresh list after success
      />
    </Layout>
  );
};

export default Salons;