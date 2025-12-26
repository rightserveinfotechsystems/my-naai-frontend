import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SearchInput from "../components/SearchInput.jsx";
import Pagination from "../components/Pagination.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import SalonEditModal from "../components/SalonEditModal.jsx";
import { salons as salonData } from "../data/mockData.js";

const ITEMS_PER_PAGE = 20;

const Salons = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingSalonId, setEditingSalonId] = useState(null);

  const filtered = useMemo(() => {
    return salonData.filter((salon) => {
      const matchesSearch =
        salon.name.toLowerCase().includes(search.toLowerCase()) ||
        salon.address.toLowerCase().includes(search.toLowerCase());
      const matchesCity = cityFilter === "all" || salon.city === cityFilter;
      const matchesStatus =
        statusFilter === "all" || salon.status === statusFilter;
      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [search, cityFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Open Add Modal
  const handleAddSalon = () => {
    setModalMode("add");
    setEditingSalonId(null);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleEditSalon = (salon) => {
    setModalMode("edit");
    setEditingSalonId(salon.id);
    setShowModal(true);
  };

  // Handle modal success
  const handleModalSuccess = () => {
    // Refresh data or show success message
    console.log("Salon operation completed successfully");
  };

  return (
    <Layout>
      <div className="pb-4 p-md-4">
        <div className="card shadow-sm border-0 mb-3 mb-md-4 sticky-top" style={{ top: '10px', zIndex: '1020' }}>
          <div className="card-body p-2 p-md-3">
            {/* DESKTOP LAYOUT */}
            <div className="d-none d-md-block">
              <div className="row g-2 g-md-3 align-items-end">

                {/* LEFT SIDE: Search + Filters */}
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
                        placeholder="Search salons..."
                      />
                    </div>

                    {/* City Filter */}
                    <div className="col-6 col-md-3">
                      <select
                        className="form-select form-select-sm"
                        value={cityFilter}
                        onChange={(e) => { setCityFilter(e.target.value); setCurrentPage(1); }}
                      >
                        <option value="all">All Cities</option>
                        {["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Pune"].map((city) => <option key={city} value={city}>{city}</option>)}
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div className="col-6 col-md-3">
                      <select
                        className="form-select form-select-sm"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE: Pagination + Add Button - FIXED */}
                <div className="col-12 col-lg-5 d-flex flex-column flex-md-row gap-2 justify-content-end align-items-end pagination-right-section">
                  {/* Pagination */}
                  <div className="d-flex justify-content-end flex-fill order-md-1 me-md-2 pagination-container">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={Math.max(totalPages || 0)}
                      onPageChange={setCurrentPage}
                      size="sm"
                    />
                  </div>

                  {/* Add Button */}
                  <button
                    className="btn btn-sm order-md-2 flex-shrink-0 buttoncolor ms-md-2"
                    onClick={handleAddSalon}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem',
                      minWidth: 'auto',
                      width: 'auto',
                      maxWidth: 'fit-content'
                    }}
                    title="Add New Salon"
                  >
                    <span className="d-none d-md-inline  p-1">Add Salon</span>
                    <span className="d-md-none   d-sm-inline">Add</span>
                  </button>
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
                      {(cityFilter !== "all" || statusFilter !== "all") ? (
                        <span className="badge bg-secondary ms-1" style={{ fontSize: '0.65rem', padding: '0.15rem 0.3rem' }}>!</span>
                      ) : null}
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
                  <div className="card border-0 bg-light">
                    <div className="card-body p-2">
                      <div className="d-flex flex-column gap-2">
                        {/* City Filter */}
                        <div>
                          <label className="form-label small mb-1 fw-semibold">All Cities</label>
                          <select
                            className="form-select form-select-sm"
                            value={cityFilter}
                            onChange={(e) => { setCityFilter(e.target.value); setCurrentPage(1); }}
                          >
                            <option value="all">All Cities</option>
                            {["Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Pune"].map((city) => <option key={city} value={city}>{city}</option>)}
                          </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                          <label className="form-label small mb-1 fw-semibold">All Status</label>
                          <select
                            className="form-select form-select-sm"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
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

                {/* Row 2: Pagination + Add Button */}
                <div className="row  g-3 align-items-center">
                  <div className="col-9 d-flex justify-content-end">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={Math.max(totalPages || 0)}
                      onPageChange={setCurrentPage}
                      size="sm"
                    />
                  </div>
                  <div className="col-2 d-flex">
                    <button
                      className="btn btn-sm flex-shrink-0 buttoncolor"
                      onClick={handleAddSalon}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        minWidth: 'auto',
                        width: 'auto',
                        height: "36px",
                        width: "56px",
                      }}
                      title="Add New Salon"
                    >
                      <span className="d-sm-inline">Add</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {paginated.length === 0 && (
          <div className="alert alert-light text-center py-5 shadow-sm">
            <p className="mb-0 text-muted">No salons found matching your criteria.</p>
          </div>
        )}

        {/* Salons Grid */}
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-2 g-md-3 mb-4 salon-grid-container">
          {paginated.map((salon) => (
            <div className="col" key={salon.id}>
              <div className="card h-100 shadow-sm border-0 hover-lift-sm transition-all position-relative"
                style={{
                  cursor: 'pointer',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  fontSize: '0.9rem'
                }}
                onClick={() => navigate(`/salons/${salon.id}`)}>

                {salon.images?.[0] && (
                  <div className="ratio ratio-16x9">
                    <img src={salon.images[0]}
                      className="card-img-top"
                      alt={salon.name}
                      style={{ objectFit: "cover" }} />
                  </div>
                )}

                <div className="card-body p-2 p-md-3">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h6 className="card-title mb-0 fw-bold text-truncate salon-card-title">
                      {salon.name}
                    </h6>
                    <span className="badge bg-warning-subtle text-dark border-0 salon-badge">
                      ★ {salon.rating}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h6 className="card-title mb-0 fw-bold text-truncate text-muted mb-2 salon-card-text">
                      <i className="bi bi-geo-alt me-1"></i>
                      {salon.city}
                    </h6>
                    <span className="badge bg-warning-subtle text-dark border-0 salon-badge d-flex align-items-center gap-1">
                      <i className={`bi ${salon.gender === 'Male' ? 'bi-gender-male' : 'bi-gender-female'}`}></i>
                      {salon.gender}
                    </span>
                  </div>

                  <div className="mt-auto">
                    <StatusBadge status={salon.status} size="sm" />
                  </div>
                </div>

                <div className="card-footer bg-transparent border-top-0 py-2 px-3">
                  <div className="d-flex justify-content-between align-items-center text-muted small mb-2">
                    <span>{salon.services.length} Services</span>
                    <span>{salon.openingTime}</span>
                  </div>

                  {/* EDIT BUTTON */}
                  <button
                    className="btn w-100 salon-edit-btn"
                    style={{
                      backgroundColor: '#e1b378',
                      borderColor: '#e1b378',
                      color: '#000'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditSalon(salon);
                    }}
                  >
                    <i className="bi bi-pencil me-1"></i>
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Salon Edit Modal */}
      <SalonEditModal
        showModal={showModal}
        setShowModal={setShowModal}
        modalMode={modalMode}
        editingSalonId={editingSalonId}
        onSuccess={handleModalSuccess}
      />

    </Layout>
  );
};

export default Salons;