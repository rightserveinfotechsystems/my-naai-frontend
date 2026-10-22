import { useState, useEffect, useCallback } from "react";
import { distributorAPI } from "../services/communication";
import Layout from "../components/Layout.jsx";
import SearchInput from "../components/SearchInput.jsx";
import Pagination from "../components/Pagination.jsx";
import Loader from "../components/Loader.jsx";
import DistributorModal from "../components/DistributorModal.jsx";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Truck, Plus, Crosshair, MapPin, X, Route } from "lucide-react";
import LocationMap from "../components/LocationMap.jsx";
import {
  formatCoordinates,
  formatKm,
  mapsUrl,
  requestBrowserLocation,
  sortByDistance,
  toPoint
} from "../utils/geo";

const money = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `₹${num.toLocaleString("en-IN")}`;
};

const Distributors = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [distributors, setDistributors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDistributor, setEditingDistributor] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [confirmModal, setConfirmModal] = useState({ show: false, target: null });
  // The point distances are measured FROM. Left empty the tab stays A–Z; set
  // it (GPS, or a pin on the mini map) and the list becomes a dispatch list:
  // nearest distributor first, KM on every row.
  const [reference, setReference] = useState(null);
  const [showReferenceMap, setShowReferenceMap] = useState(false);
  const [locating, setLocating] = useState(false);
  const navigate = useNavigate();

  const fetchDistributors = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await distributorAPI.list({
        page: currentPage,
        searchString: debouncedSearch,
        latitude: reference?.latitude,
        longitude: reference?.longitude,
        sortBy: reference ? "distance" : "name"
      });
      if (result.success) {
        setDistributors(result.data?.distributors || []);
        setTotalPages(result.data?.pagination?.totalPages || 1);
      } else {
        toast.error(result.message || "Failed to load distributors");
      }
    } catch {
      toast.error("Failed to load distributors");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, reference]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchDistributors();
  }, [fetchDistributors]);

  useEffect(() => {
    const tab = localStorage.getItem("accessTab") ? JSON.parse(localStorage.getItem("accessTab")) : null;
    if (localStorage.getItem("role") === "distributor" || !(tab && tab?.includes("distributors"))) {
      navigate("/login", { replace: true });
    }
  }, []);

  const handleConfirmToggle = async () => {
    if (!confirmModal.target) return;
    const distributor = confirmModal.target;
    try {
      const result = await distributorAPI.update({
        distributorId: distributor.distributorId,
        isActive: !distributor.isActive
      });
      if (result.success) {
        toast.success(distributor.isActive ? "Distributor disabled — they can no longer log in" : "Distributor activated");
        fetchDistributors();
      } else {
        toast.error(result.message || "Update failed");
      }
    } catch {
      toast.error("Update failed");
    } finally {
      setConfirmModal({ show: false, target: null });
    }
  };

  // The server already ordered the page nearest-first when a reference point
  // is set; sorting again locally keeps the rows right even if an older API
  // build ignores the new parameters (best of both, no wrong labels).
  const ordered = reference ? sortByDistance(distributors, reference) : distributors;
  const visible = ordered.filter((d) => (activeFilter === "ALL" ? true : activeFilter === "ACTIVE" ? d.isActive : !d.isActive));
  const nearest = visible.find((d) => Number.isFinite(Number(d.distanceKm)));

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const result = await requestBrowserLocation();
      if (!result.ok) {
        toast.error(result.message || "Could not read this device's location");
        return;
      }
      setReference({ latitude: result.latitude, longitude: result.longitude });
      setCurrentPage(1);
      toast.success("Sorting by distance from your current location");
    } finally {
      setLocating(false);
    }
  };

  const FILTERS = [
    { key: "ALL", label: "All" },
    { key: "ACTIVE", label: "Active" },
    { key: "INACTIVE", label: "Disabled" }
  ];

  return (
    <Layout>
      <div className="page-content d-flex flex-column p-2 p-md-3" style={{ height: "calc(100vh - 70px)", overflow: "hidden" }}>
        <div className="card shadow-sm mb-3 bg-white border-0 flex-shrink-0" style={{ borderRadius: "12px" }}>
          <div className="card-body p-3">
            <div className="d-flex flex-wrap align-items-center gap-3">
              <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                <SearchInput value={search} onChange={setSearch} placeholder="Search by name, phone, area..." />
              </div>
              <div className="d-flex flex-wrap gap-2" style={{ flex: "1 1 260px", minWidth: 0 }}>
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={`btn btn-sm ${activeFilter === f.key ? "btn-success" : "btn-outline-secondary"}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="d-flex align-items-center gap-2" style={{ flex: "1 1 auto", minWidth: 180, justifyContent: "flex-end" }}>
                <button className="button23" onClick={() => { setEditingDistributor(null); setShowModal(true); }}>
                  <Plus size={15} className="me-1" /> Add
                </button>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} size="sm" />
              </div>
            </div>
          </div>
        </div>

      
        {/* Distance reference card */}
        <div className="card shadow-sm mb-3 bg-white border-0 flex-shrink-0 w-100" style={{ borderRadius: "12px" }}>
          <div className="card-body p-3">
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">

              {/* Status / Description Section */}
              <div className="d-flex flex-wrap align-items-center gap-2">
                <span className="badge bg-light text-secondary border d-flex align-items-center gap-1">
                  <Route size={13} />
                  {reference ? "Sorted: nearest first" : "Sorted: A–Z"}
                </span>
                {reference ? (
                  <span className="small text-muted text-break">
                    from <strong className="text-dark">{formatCoordinates(reference)}</strong>
                    {nearest && Number.isFinite(Number(nearest.distanceKm)) ? (
                      <> · nearest partner is <strong className="text-dark">{formatKm(nearest.distanceKm)}</strong> away</>
                    ) : null}
                  </span>
                ) : (
                  <span className="small text-muted">Set a reference point to show delivery KM.</span>
                )}
              </div>

              {/* Action Buttons Section */}
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <button className="btn btn-sm btn-outline-success d-flex align-items-center gap-1 flex-fill flex-md-grow-0 justify-content-center" onClick={useMyLocation} disabled={locating}>
                  <Crosshair size={14} /> {locating ? "Locating…" : "Use my location"}
                </button>
                <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 flex-fill flex-md-grow-0 justify-content-center" onClick={() => setShowReferenceMap((v) => !v)}>
                  <MapPin size={14} /> {showReferenceMap ? "Hide map" : "Pick on map"}
                </button>
                {reference && (
                  <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 justify-content-center" onClick={() => { setReference(null); setCurrentPage(1); }}>
                    <X size={14} /> Clear
                  </button>
                )}
              </div>

            </div>

            {/* Collapsible Reference Map */}
            {showReferenceMap && (
              <div className="mt-3 w-100">
                <LocationMap
                  value={reference}
                  onChange={(next) => { setReference(next); setCurrentPage(1); }}
                  height={220}
                  ariaLabel="Distance reference map"
                />
                <div className="small text-muted mt-1">Click the map (or drag the pin) to measure every partner from that point.</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-grow-1 p-3 shadow-sm border-0" style={{ overflowY: "auto", backgroundColor: "#ffffff", borderRadius: "12px" }}>
          {isLoading ? (
            <div className="text-center py-5"><Loader size="sm" /></div>
          ) : visible.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <Truck size={40} className="mx-auto mb-2 opacity-25" />
              No distributors found. Add one to start fulfilling salon orders.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table align-middle mb-0" style={{ fontSize: "0.9rem", width: "100%", minWidth: 640 }}>
                <thead>
                  <tr className="text-muted small" style={{ textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    <th>Distributor</th>
                    <th>Contact</th>
                    <th>Area</th>
                    <th className="text-nowrap">Distance</th>
                    <th>Delivery Capability</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((d) => (
                    <tr key={d.distributorId}>
                      <td>
                        <div className="fw-semibold">{d.name}</div>
                        {d.address && <div className="text-muted small">{d.address}</div>}
                      </td>
                      <td>
                        <div>{d.phone}</div>
                        {d.email && <div className="text-muted small">{d.email}</div>}
                      </td>
                      <td>
                        <div>{d.area || "—"}</div>
                        <div className="text-muted" style={{ fontSize: "0.76rem" }}>
                          {toPoint(d) ? `Pinned ${formatCoordinates(d, 3)}` : "No location set"}
                        </div>
                      </td>
                      <td className="text-nowrap">
                        {Number.isFinite(Number(d.distanceKm)) ? (
                          <span className="badge bg-success-subtle text-success-emphasis">{formatKm(d.distanceKm)}</span>
                        ) : (
                          <span className="text-muted small">{reference ? (toPoint(d) ? "—" : "No pin") : "—"}</span>
                        )}
                      </td>
                      <td>{d.deliveryCapability || "—"}</td>
                      <td>
                        {d.isActive
                          ? <span className="badge bg-success-subtle text-success">Active</span>
                          : <span className="badge bg-secondary-subtle text-secondary">Disabled</span>}
                      </td>
                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-2">
                          {mapsUrl(d) && (
                            <a
                              className="btn btn-sm px-2 py-1"
                              href={mapsUrl(d)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open this distributor's location in Maps"
                              style={{ color: "#1e7e34", border: "1px solid #a3d9b1", background: "#eaf7ee" }}
                            >
                              Map
                            </a>
                          )}
                          <button className="button22 px-2 py-1" onClick={() => { setEditingDistributor(d); setShowModal(true); }}>Edit</button>
                          <button
                            className="btn btn-sm px-2 py-1"
                            style={{
                              color: d.isActive ? "#7f8c8d" : "#1e7e34",
                              border: `1px solid ${d.isActive ? "#dde5dd" : "#a3d9b1"}`,
                              background: d.isActive ? "#f4f6f4" : "#eaf7ee"
                            }}
                            onClick={() => setConfirmModal({ show: true, target: d })}
                          >
                            {d.isActive ? "Disable" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Status Toggle Confirmation Modal */}
        {confirmModal.show && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow" style={{ borderRadius: "12px" }}>
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold">
                    {confirmModal.target?.isActive ? "Disable Distributor?" : "Activate Distributor?"}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setConfirmModal({ show: false, target: null })}></button>
                </div>
                <div className="modal-body py-3">
                  <p className="text-muted mb-0">
                    Are you sure you want to <strong>{confirmModal.target?.isActive ? "disable" : "activate"}</strong> <span className="text-dark fw-semibold">{confirmModal.target?.name}</span>?
                    {confirmModal.target?.isActive
                      ? " They will no longer be able to log in or fulfill salon orders."
                      : " They will regain access to log in and fulfill salon orders."}
                  </p>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-light btn-sm px-3"
                    onClick={() => setConfirmModal({ show: false, target: null })}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm px-3 ${confirmModal.target?.isActive ? "btn-danger" : "btn-success"}`}
                    onClick={handleConfirmToggle}
                  >
                    {confirmModal.target?.isActive ? "Yes, Disable" : "Yes, Activate"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <DistributorModal
          showModal={showModal}
          setShowModal={setShowModal}
          initialDistributor={editingDistributor}
          onSuccess={() => { fetchDistributors(); setShowModal(false); setEditingDistributor(null); }}
        />
      </div>
    </Layout>
  );
};

export default Distributors;