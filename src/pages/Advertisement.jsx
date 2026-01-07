import { useState, useEffect, useCallback } from "react";
import { advertisementService } from "../services/communication";
import Layout from "../components/Layout.jsx";
import SearchInput from "../components/SearchInput.jsx";
import Pagination from "../components/Pagination.jsx";
import AdvertisementCreateModal from "../components/AdvertisementCreateModal.jsx";
import Loader from "../components/Loader.jsx";
import DeleteConfirmModal from "../components/DeleteConfirmModal.jsx";
import { toast } from "react-toastify";

const ITEMS_PER_PAGE = 20;
const API_BASE = "http://72.60.195.95:3006";

const buildImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE}/getfiles${path}`;
};

const Advertisement = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [advertisements, setAdvertisements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, target: null });

  const fetchAdvertisements = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await advertisementService.getList(
        currentPage,
        ITEMS_PER_PAGE,
        debouncedSearch
      );

      if (result?.data) {
        const formattedAds = result.data.map((item) => ({
          id: item._id || item.advertisementId,
          title: item.title,
          imageUrl: buildImageUrl(item.images?.[0]),
          rawData: item,
        }));

        setAdvertisements(formattedAds);
        setTotalPages(result.pagination?.totalPages || 1);
      }
    } catch (error) {
      toast.error("Failed to load ads");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchAdvertisements();
  }, [fetchAdvertisements]);

  const handleConfirmDelete = async () => {
    try {
      await advertisementService.deleteAd(deleteModal.target.id);
      toast.success("Deleted successfully");
      fetchAdvertisements();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteModal({ show: false, target: null });
    }
  };



  // Only update debounced search, don't reset currentPage here
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  return (
    <Layout>
      <div
        className="page-content d-flex flex-column p-2 p-md-3"
        style={{ height: "calc(100vh - 70px)", overflow: "hidden" }}
      >
        {/* HEADER (UNCHANGED UI) */}
        <div
          className="card shadow-sm mb-3 bg-white border-0 flex-shrink-0"
          style={{ borderRadius: "12px" }}
        >
          <div className="card-body p-3">
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-5">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search ads..."
                />
              </div>
              <div className="col-12 col-md-7 d-flex justify-content-md-end gap-2">
                <button
                  className="button23"
                  onClick={() => {
                    setEditingAd(null);
                    setShowCreateModal(true);
                  }}
                >
                  <i className="bi bi-megaphone me-1"></i>
                  Add
                </button>
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

        {/* CONTENT (OLD UI MAINTAINED) */}
        <div
          className="flex-grow-1 p-3 shadow-sm border-0"
          style={{
            overflowY: "auto",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
          }}
        >
          {isLoading ? (
            <div className="text-center py-5">
              <Loader size="sm" />
            </div>
          ) : advertisements.length === 0 ? (
            <div className="text-center py-5 text-muted">
              No ads found.
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-2 g-md-3 pb-4">
              {advertisements.map((ad) => (
                <div key={ad.id}>
                  <div
                    className="card h-100 shadow-sm border-0"
                    style={{
                      borderRadius: "12px",
                      overflow: "hidden",
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    <div className="ratio ratio-16x9 bg-light">
                      <img
                        src={ad.imageUrl}
                        className="w-100 h-100"
                        style={{ objectFit: "cover" }}
                        alt={ad.title}
                      />
                    </div>

                    <div className="card-body p-2 p-md-3">
                      <h6
                        className="card-title mb-2 fw-bold text-truncate"
                        title={ad.title}
                      >
                        {ad.title}
                      </h6>
                      <div className="d-flex justify-content-end align-items-center gap-2 mt-3">
                        <button
                          className="button22"
                          onClick={() => {
                            setEditingAd(ad.rawData);
                            setShowCreateModal(true);
                          }}
                        >
                          <i className="bi bi-pencil-square me-1"></i>
                          Edit
                        </button>

                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => setDeleteModal({ show: true, target: ad })}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AdvertisementCreateModal
        showModal={showCreateModal}
        setShowModal={setShowCreateModal}
        initialAd={editingAd}
        onSuccess={() => {
          fetchAdvertisements();
          setShowCreateModal(false);
          setEditingAd(null);
        }}
      />

      <DeleteConfirmModal
        show={deleteModal.show}
        onHide={() => setDeleteModal({ show: false, target: null })}
        onConfirm={handleConfirmDelete}
      />
    </Layout>
  );
};

export default Advertisement;
