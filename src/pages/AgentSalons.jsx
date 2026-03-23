import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import SearchInput from "../components/SearchInput.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Pagination from "../components/Pagination.jsx";
import Loader from "../components/Loader.jsx";
import { salonAPI } from "../services/communication.jsx";

const ITEMS_PER_PAGE = 20;

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const AgentSalons = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const agentData = location.state?.user;

  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch agent salons
  const fetchAgentSalons = async () => {
    if (!agentData?.id) {
      navigate("users");
      return;
    }

    try {
      setLoading(true);

      const res = await salonAPI.getSalonsByAgent({
        agentId: agentData.id,
        searchString: search
      });

      if (res.success) {
        setSalons(res.data?.salons || res.data || []);
        setTotalPages(res.data?.totalPages || 1);
      } else {
        setSalons([]);
      }

    } catch (error) {
      console.error("Fetch salons error:", error);
      setSalons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchAgentSalons, 500);
    return () => clearTimeout(timer);
  }, [search, currentPage, agentData?.id]);

  useEffect(() => {
    const tab = localStorage.getItem("accessTab") ? JSON.parse(localStorage.getItem("accessTab")) : null;
    if (!(tab && tab?.includes("user"))) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  if (!agentData) {
    return (
      <Layout>
        <div className="text-center py-5">
          <h4>Agent data not found</h4>
          {/* <button className="btn btn-primary" onClick={() => navigate("/user")}>
            ← Back to Users
          </button> */}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4 mt-2 mt-md-4 thin-scrollbar">
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body p-0">
                {/* Header: Search + Pagination + Back Button */}
                <div className="p-2 p-md-3 border1 border-bottom bg-light">
                  <div className="row g-2 g-md-3 align-items-center">
                    <div className="col-12 col-md-auto" style={{ flex: '1 1 auto', minWidth: '200px', maxWidth: '30%' }}>
                      <SearchInput
                        value={search}
                        onChange={(val) => {
                          setSearch(val);
                          setCurrentPage(1);
                        }}
                        placeholder="Search by salon name, owner name"
                      />
                    </div>
                    <div className="col-12 col-md d-flex align-items-center justify-content-md-end gap-2 flex-wrap mt-2">
                      <div className="mt-0">
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={setCurrentPage}
                          size="sm"
                        />
                      </div>
                      {/* <button 
                        className="btn btn-sm btn-outline-secondary px-3 text-nowrap" 
                        onClick={() => navigate("/users")}
                      >
                        ← Back to Users
                      </button> */}
                    </div>
                  </div>
                  {/* Agent Info */}
                  <div className="px-3 py-2 bg-white border-top">
                    <h5 className="mb-0">
                      Salons by <strong>{agentData?.name}</strong> ({agentData?.email})
                    </h5>
                  </div>
                </div>

                {/* Salons Table (Desktop Only) */}
                <div className="table-responsive d-none d-md-block" style={{ maxHeight: '83vh', overflowY: 'auto' }}>
                  <table className="table table-hover mb-0 align-middle">
                    <thead className="table-light position-sticky top-0 bg-white border-bottom z-10">
                      <tr>
                        <th className="px-3 py-2 text-center">No.</th>
                        <th className="px-3 py-2">Salon Name</th>
                       
                        <th className="px-3 py-2 text-center">Owner Name</th>
                         {/* <th className="px-3 py-2">Location</th> */}
                        <th className="px-3 py-2">Phone</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2 text-center">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="text-center py-5">
                            <Loader fullScreen={false} size="sm" text="Loading salons..." />
                          </td>
                        </tr>
                      ) : salons.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-muted py-5">
                            No salons found for this agent
                          </td>
                        </tr>
                      ) : salons.map((salon, index) => (
                        <tr key={salon.id}>
                          <td className="px-3 py-2 text-center">
                            {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                          </td>
                          <td className="fw-semibold px-3 py-2">{salon?.salonName}</td>
                          <td className="px-3 py-2 text-center">{salon?.ownerName || '—'}</td>
                          {/* <td className="px-3 py-2">{salon?.addressLine1 || '—'}</td> */}
                          <td className="px-3 py-2">{ salon?.phoneNumber || '—'}</td>
                          <td className="px-3 py-2 text-center">
                            <StatusBadge status={salon.isActive ? "active" : "inactive"} />
                          </td>
                          <td className="px-3 py-2 text-center">
                            {formatDate(salon.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Salons List (Mobile Only) */}
                <div className="d-block d-md-none">
                  {loading ? (
                    <div className="text-center py-5">
                      <Loader fullScreen={false} size="sm" text="Loading salons..." />
                    </div>
                  ) : salons && salons.length === 0 ? (
                    <div className="text-center text-muted py-5">No salons found</div>
                  ) : (
                    <div className="user-list-mobile">
                      {salons && salons.map((salon, index) => (
                        <div key={salon.id} className="card mb-2 shadow-sm">
                          <div className="card-body p-2 d-flex flex-column gap-1">
                            <div className="fw-semibold">{salon.name}</div>
                            <div className="small text-muted">{salon.email || '—'}</div>
                            <div className="small">Phone: {salon.phone || salon.mobile || '—'}</div>
                            <div className="small">
                              Location: {salon.location || salon.address || '—'}
                            </div>
                            <div className="small text-muted">
                              Created: {formatDate(salon.createdAt)}
                            </div>
                            <div className="d-flex align-items-center gap-2 mt-1">
                              <StatusBadge status={salon.isActive ? "active" : "inactive"} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AgentSalons;