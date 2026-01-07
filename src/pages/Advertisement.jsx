import { useState, useEffect, useCallback } from "react";
import { advertisementService } from "../services/communication";
import Layout from "../components/Layout.jsx";
import SearchInput from "../components/SearchInput.jsx";
import Pagination from "../components/Pagination.jsx";
import AdvertisementCreateModal from "../components/AdvertisementCreateModal.jsx";
import Loader from "../components/Loader.jsx";
import DeleteConfirmModal from "../components/DeleteConfirmModal.jsx";
import { toast } from 'react-toastify';

const ITEMS_PER_PAGE = 20;

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

  const handleSaveSuccess = () => {
    fetchAdvertisements();
    setShowCreateModal(false);
    setEditingAd(null); // Zaroori: edit state reset karein taaki next time "Add" chale
    toast.success(editingAd ? "Updated successfully" : "Created successfully");
  };

  const fetchAdvertisements = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await advertisementService.getList(currentPage, ITEMS_PER_PAGE, debouncedSearch);

      if (result && result.data) {
        const formattedAds = result.data.map(item => ({
          id: item._id || item.advertisementId,
          title: item.title,
          status: item.status,
          imageUrl: advertisementService.getMediaSrc(item.images && item.images.length > 0 ? item.images[0] : ""),
          createdAt: item.createdAt,
          rawData: item
        }));
        setAdvertisements(formattedAds);
        setTotalPages(result.pagination?.totalPages || 1);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load ads");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => { fetchAdvertisements(); }, [fetchAdvertisements]);

  const handleConfirmDelete = async () => {
    try {
      await advertisementService.deleteAd(deleteModal.target.id);
      toast.success("Deleted successfully");
      fetchAdvertisements();
    } catch (error) {
      toast.error("Delete failed");
    } finally {
      setDeleteModal({ show: false, target: null });
    }
  };

  return (
    <Layout>
      {/* Main Wrapper: Fixed Height to enable inner scroll */}
      <div className="page-content d-flex flex-column p-2 p-md-3" style={{ height: "calc(100vh - 70px)", overflow: "hidden" }}>

        {/* Header: Static Section */}
        <div className="card shadow-sm mb-3 bg-white border-0 flex-shrink-0" style={{ borderRadius: '12px' }}>
          <div className="card-body p-3">
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-5">
                <SearchInput value={search} onChange={setSearch} placeholder="Search ads..." />
              </div>
              <div className="col-12 col-md-7 d-flex flex-column flex-sm-row justify-content-md-end align-items-sm-center gap-2">
                <button className="bg d-flex align-items-center justify-content-center gap-2"
                  onClick={() => { setEditingAd(null); setShowCreateModal(true); }}>
                  <span>Add Advertisement</span>
                </button>
                <div className="d-flex justify-content-center">
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} size="sm" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Area: Pure White Background */}
        <div className="flex-grow-1 p-3 shadow-sm border-0"
          style={{
            overflowY: "auto",
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            minHeight: '400px'
          }}>

          {isLoading ? (
            <div className="text-center py-5 mt-5"><Loader size="sm" /></div>
          ) : advertisements.length === 0 ? (
            <div className="text-center py-5 text-muted">No ads found.</div>
          ) : (
            <div className="row row-cols-md-3 row-cols-lg-4 g-2 g-md-3 pb-4">
              {advertisements.map((ad) => (
                <div key={ad.id}>
                  {/* Puraane style wala card */}
                  <div className="card h-100 shadow-sm border-0" style={{ borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
                    <div className="ratio ratio-16x9 bg-light">
                      <img
                        src={ad.imageUrl}
                        className="w-100 h-100"
                        style={{ objectFit: "cover" }}
                        onError={(e) => { e.target.src = "/images/image4.jpeg"; }}
                        alt={ad.title}
                      />
                    </div>
                    <div className="card-body p-2 p-md-3">
                      <h6 className="card-title mb-2 fw-bold text-truncate" title={ad.title}>{ad.title}</h6>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <button className="bg" onClick={() => { setEditingAd(ad.rawData); setShowCreateModal(true); }}>
                          <i className="bi bi-pencil-square"></i> <span className="d-none d-sm-inline">Edit ad</span>
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => setDeleteModal({ show: true, target: ad })}>
                          <i className="bi bi-trash3"></i>
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
        onSuccess={(returnedAd) => {
          // If modal returns the created/updated ad, update local list immediately
          if (returnedAd && returnedAd.advertisementId || returnedAd && returnedAd._id || returnedAd && returnedAd.id) {
            const adId = returnedAd._id || returnedAd.id || returnedAd.advertisementId;
            const formatted = {
              id: adId,
              title: returnedAd.title || '',
              status: returnedAd.status,
              imageUrl: advertisementService.getMediaSrc((returnedAd.images && returnedAd.images[0]) || ''),
              createdAt: returnedAd.createdAt,
              rawData: returnedAd
            };

            setAdvertisements(prev => {
              // replace if exists
              const found = prev.findIndex(a => a.id === adId);
              if (found !== -1) {
                const copy = [...prev];
                copy[found] = formatted;
                return copy;
              }
              // otherwise prepend
              return [formatted, ...prev];
            });
            setShowCreateModal(false);
            setEditingAd(null);
            return;
          }

          // Fallback: refetch list
          fetchAdvertisements();
          setShowCreateModal(false);
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