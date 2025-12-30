import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SearchInput from "../components/SearchInput.jsx";
import Pagination from "../components/Pagination.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import SalonEditModal from "../components/SalonEditModal.jsx";

const ITEMS_PER_PAGE = 20;

const Salons = () => {
  const navigate = useNavigate();
  
  // States
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingSalonId, setEditingSalonId] = useState(null);

  /**
   * API Se Data Fetch Karne Ka Function
   */
  const fetchSalons = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        console.warn("Token nahi mila, login page par redirect ho raha hai...");
        navigate("/login");
        return;
      }

      const response = await fetch("http://72.60.195.95:3006/api/barbers/get-barbers-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({}) // Backend ko empty object chahiye
      });

      const result = await response.json();

      if (result.status === "SUCCESS") {
        // API se aane wala data state mein save kar rahe hain
        setSalons(result.data.barberShops || []);
      } else if (result.message === "Invalid token payload") {
        // Agar token expire ho gaya ho
        alert("Session expired. Please login again.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        console.error("API Error:", result.message);
      }
    } catch (error) {
      console.error("Network Error:", error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Page load hote hi API call karega
  useEffect(() => {
    fetchSalons();
  }, [fetchSalons]);

  /**
   * Filter Logic (Search aur Dropdowns ke liye)
   */
  const filtered = useMemo(() => {
    return salons.filter((salon) => {
      const name = salon.shopName || "";
      const address = salon.address || "";
      const status = salon.isActive ? "active" : "inactive";

      const matchesSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        address.toLowerCase().includes(search.toLowerCase());
      
      const matchesCity = cityFilter === "all" || salon.city === cityFilter;
      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [salons, search, cityFilter, statusFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Modal Handlers
  const handleAddSalon = () => {
    setModalMode("add");
    setEditingSalonId(null);
    setShowModal(true);
  };

  const handleEditSalon = (salon) => {
    setModalMode("edit");
    setEditingSalonId(salon.barberId);
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
                  <select className="form-select form-select-sm" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
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
                        {["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Pune"].map(c => <option key={c} value={c}>{c}</option>)}
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
          /* SALON GRID */
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-3 mb-4">
            {paginated.map((salon) => (
              <div className="col" key={salon.barberId}>
                <div 
                  className="card h-100 shadow-sm border-0 hover-lift-sm transition-all"
                  style={{ cursor: 'pointer', borderRadius: '12px', overflow: 'hidden' }}
                  onClick={() => navigate(`/salons/${salon.barberId}`)}
                >
                  <div className="ratio ratio-16x9 bg-light">
                    <img 
                      src={salon.shopLogo || "https://via.placeholder.com/400x225?text=No+Logo"} 
                      className="card-img-top" 
                      alt={salon.shopName}
                      style={{ objectFit: "cover" }}
                    />
                  </div>

                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="card-title mb-0 fw-bold text-truncate" style={{maxWidth: '75%'}}>
                        {salon.shopName}
                      </h6>
                      <span className="badge bg-warning-subtle text-dark border-0">
                        ★ {salon.rating || "0.0"}
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