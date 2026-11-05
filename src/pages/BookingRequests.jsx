import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  RefreshCw,
  Inbox,
  CheckCircle2,
  XCircle,
  Clock3,
  Percent,
  Phone,
  Search,
  Download,
  Store,
  Scissors,
  CalendarClock,
  ChevronRight
} from "lucide-react";
import Layout from "../components/Layout.jsx";
import SearchInput from "../components/SearchInput.jsx";
import Pagination from "../components/Pagination.jsx";
import Loader from "../components/Loader.jsx";
import BookingRequestDetailModal, { LIFECYCLE } from "../components/BookingRequestDetailModal.jsx";
import { bookingRequestAPI } from "../services/communication.jsx";

const STATUS_FILTERS = [
  { key: "ALL", label: "All statuses" },
  { key: "PENDING", label: "Awaiting answer" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "REJECTED", label: "Rejected" },
  { key: "AUTO_CANCELLED", label: "Auto-cancelled" },
  { key: "CANCELLED", label: "Cancelled by customer" },
  { key: "DELAYED", label: "Delayed" }
];

const RANGES = [
  { key: "TODAY", label: "Today" },
  { key: "WEEK", label: "Last 7 days" },
  { key: "MONTH", label: "Last 30 days" },
  { key: "ALL", label: "All time" }
];

const TILE_META = [
  { key: "received", label: "Received", Icon: Inbox, tone: "primary" },
  { key: "accepted", label: "Accepted", Icon: CheckCircle2, tone: "success" },
  { key: "rejected", label: "Rejected", Icon: XCircle, tone: "danger" },
  { key: "autoCancelled", label: "Auto-cancelled", Icon: Clock3, tone: "secondary" },
  { key: "answerRate", label: "Answer rate", Icon: Percent, tone: "warning", suffix: "%" }
];
const istDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const istDay = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "2-digit", month: "short" });
};

const clock = (value) => {
  const raw = String(value || "");
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return raw || "—";
  const hours24 = Number(match[1]);
  const suffix = hours24 >= 12 ? "PM" : "AM";
  return `${hours24 % 12 || 12}:${match[2]} ${suffix}`;
};

const money = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `₹${num.toLocaleString("en-IN")}`;
};

const shortSeconds = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  const total = Math.max(0, Math.round(Number(value)));
  if (total < 60) return `${total}s`;
  return `${Math.floor(total / 60)}m ${String(total % 60).padStart(2, "0")}s`;
};

const effectiveStatus = (row) => {
  if (row.status !== "PENDING") return row.status;
  const expires = row.expiresAt ? new Date(row.expiresAt).getTime() : null;
  if (!expires) return row.status;
  return expires <= Date.now() ? "AUTO_CANCELLED" : "PENDING";
};

const statusOf = (row) => effectiveStatus(row);

const BookingRequests = () => {
  const navigate = useNavigate();

  const [range, setRange] = useState("TODAY");
  const [status, setStatus] = useState("ALL");
  const [salonId, setSalonId] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalRequests: 0, limit: 25 });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [salonSort, setSalonSort] = useState("missed");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 450);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    const accessTab = localStorage.getItem("accessTab") ? JSON.parse(localStorage.getItem("accessTab")) : null;
    if (localStorage.getItem("role") === "distributor" || !(accessTab && accessTab.includes("bookingRequests"))) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const loadList = useCallback(async () => {
    const result = await bookingRequestAPI.adminList({
      salonId,
      status,
      range,
      search: debouncedSearch,
      page,
      limit: pagination.limit
    });
    if (result.success) {
      setRows(result.data?.requests || []);
      setPagination(current => ({ ...current, ...(result.data?.pagination || {}) }));
    } else {
      toast.error(result.message || "Failed to load booking requests");
    }
    return result.success;
  }, [salonId, status, range, debouncedSearch, page, pagination.limit]);

  const loadSummary = useCallback(async () => {
    const result = await bookingRequestAPI.adminSummary({ range, salonId });
    if (result.success) setSummary(result.data || null);
    return result.success;
  }, [range, salonId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([loadList(), loadSummary()]);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [loadList, loadSummary]);
  useEffect(() => {
    const timer = setInterval(() => {
      loadSummary();
    }, 20000);
    return () => clearInterval(timer);
  }, [loadSummary]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadList(), loadSummary()]);
    setRefreshing(false);
  };

  const resetFilters = () => {
    setRange("TODAY");
    setStatus("ALL");
    setSalonId("");
    setSearch("");
    setPage(1);
  };
  const salonOptions = useMemo(() => {
    const fromReport = (summary?.bySalon || []).map((row) => ({ id: row.salonId, name: row.salonName || "Unnamed salon" }));
    const fromRows = rows.map((row) => ({ id: row.salonId, name: row.salonName || "Unnamed salon" }));
    const seen = new Set();
    return [...fromReport, ...fromRows].filter((item) => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [summary, rows]);

  const salonReport = useMemo(() => {
    const list = [...(summary?.bySalon || [])];
    return list.sort((a, b) => {
      if (salonSort === "received") return b.received - a.received;
      if (salonSort === "answerRate") return a.answerRate - b.answerRate;
      if (salonSort === "median") {
        if (a.medianResponseSeconds === null) return 1;
        if (b.medianResponseSeconds === null) return -1;
        return b.medianResponseSeconds - a.medianResponseSeconds;
      }
      return b.autoCancelled - a.autoCancelled || b.received - a.received;
    });
  }, [summary, salonSort]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const collected = [];
      let nextPage = 1;
      let totalPages = 1;
      do {
        const result = await bookingRequestAPI.adminList({
          salonId,
          status,
          range,
          search: debouncedSearch,
          page: nextPage,
          limit: 100
        });
        if (!result.success) {
          toast.error(result.message || "Could not build the export");
          break;
        }
        collected.push(...(result.data?.requests || []));
        totalPages = result.data?.pagination?.totalPages || 1;
        nextPage += 1;
      } while (nextPage <= totalPages && nextPage <= 20);

      if (!collected.length) {
        toast.info("Nothing to export with these filters");
        return;
      }

      const header = [
        "Request ID", "Customer", "Phone", "Salon", "City", "Date", "Time",
        "Services", "Estimated total", "Status", "Sent at (IST)", "Answered at (IST)",
        "Response seconds", "Booking ID"
      ];
      const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
      const lines = [header.map(escape).join(",")];
      collected.forEach((row) => {
        lines.push([
          row.bookingRequestId,
          row.customerName,
          row.customerPhone,
          row.salonName,
          row.city,
          row.bookingDate,
          row.bookingTime,
          (row.services || []).map((item) => item.serviceName).join(" + "),
          row.total ?? "",
          statusOf(row),
          istDateTime(row.createdAt),
          row.respondedAt ? istDateTime(row.respondedAt) : "",
          row.responseSeconds ?? "",
          row.bookingId || ""
        ].map(escape).join(","));
      });

      const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `booking-requests-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${collected.length} request${collected.length === 1 ? "" : "s"}`);
    } finally {
      setExporting(false);
    }
  };

  const tiles = summary || { received: 0, accepted: 0, rejected: 0, autoCancelled: 0, answerRate: 0, awaiting: 0 };
  const activeFilterCount = Number(range !== "TODAY") + Number(Boolean(salonId)) + Number(status !== "ALL") + Number(Boolean(search.trim()));

  const openRequest = (row) => setSelected({ ...row, status: statusOf(row) });

  const renderStatus = (state) => {
    const meta = LIFECYCLE[state] || LIFECYCLE.PENDING;
    return <span className={`badge rounded-pill bg-${meta.tone}-subtle text-${meta.tone}-emphasis px-3 py-2`}>{meta.label}</span>;
  };

  return (
    <Layout>
      <div className="page-content booking-requests-page d-flex flex-column p-2 p-md-3" style={{ minHeight: "calc(100vh - 70px)", minWidth: 0 }}>
        <style>{`
          .booking-requests-page { width: 100%; max-width: 100%; overflow-x: clip; }
          .booking-requests-page .br-card { border: 1px solid #e9edf2; border-radius: 14px; background: #fff; }
          .booking-requests-page .br-stat { min-height: 108px; }
          .booking-requests-page .br-stat-value { font-size: clamp(1.35rem, 2vw, 1.8rem); line-height: 1.2; }
          .booking-requests-page .br-filter-grid { display: grid; grid-template-columns: minmax(220px, 1.5fr) repeat(3, minmax(150px, 1fr)); gap: 10px; align-items: end; }
          .booking-requests-page .br-filter-grid > * { min-width: 0; width: 100%; }
          .booking-requests-page .br-filter-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; border-top: 1px solid #edf0f3; margin-top: 14px; padding-top: 14px; }
          .booking-requests-page .br-filter-actions .pagination-wrap { min-width: 0; overflow-x: auto; }
          .booking-requests-page .br-filter-field label { display: block; margin: 0 0 5px; color: #64748b; font-size: .72rem; font-weight: 700; letter-spacing: .035em; text-transform: uppercase; }
          .booking-requests-page .br-filter-field .form-select { min-height: 38px; }
          .booking-requests-page .br-request-card, .booking-requests-page .br-report-card { border: 1px solid #e9edf2; border-radius: 12px; padding: 14px; background: #fff; cursor: pointer; transition: border-color .15s ease, box-shadow .15s ease; }
          .booking-requests-page .br-metric { background: #f8fafc; border-radius: 9px; padding: 8px 10px; min-width: 0; }
          .booking-requests-page .br-muted-label { color: #64748b; font-size: .72rem; text-transform: uppercase; letter-spacing: .04em; font-weight: 600; }
          .booking-requests-page .br-wrap { overflow-wrap: anywhere; min-width: 0; }
          .booking-requests-page .table th { white-space: nowrap; font-size: .72rem; color: #64748b; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
          .booking-requests-page .table td { padding-top: 13px; padding-bottom: 13px; }
          @media (min-width: 992px) {
            .booking-requests-page .br-request-card:hover, .booking-requests-page .br-report-card:hover { border-color: #cbd5e1; box-shadow: 0 4px 14px rgba(15,23,42,.05); }
          }
          @media (min-width: 768px) and (max-width: 991.98px) {
            .booking-requests-page .br-filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .booking-requests-page .br-filter-grid .br-search-field { grid-column: 1 / -1; }
          }
          @media (max-width: 767.98px) {
            .booking-requests-page .br-stat { min-height: 100px; }
            .booking-requests-page .br-stat .card-body { padding: 12px !important; }
            .booking-requests-page .br-filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .booking-requests-page .br-filter-grid .br-search-field { grid-column: 1 / -1; }
            .booking-requests-page .br-filter-actions { align-items: stretch; flex-direction: column; }
            .booking-requests-page .br-filter-actions .pagination-wrap { width: 100%; display: flex; justify-content: center; }
            .booking-requests-page .br-filter-actions .pagination-wrap > * { max-width: 100%; }
            .booking-requests-page .br-filter-grid .btn { min-height: 38px; }
            .booking-requests-page .br-section { padding: 12px !important; }
            .booking-requests-page .br-mobile-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .booking-requests-page .br-mobile-actions > * { width: 100%; }
          }
        `}</style>

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 px-1">
          <div>
            <h1 className="h4 fw-bold mb-1">Booking requests</h1>
            <p className="text-muted small mb-0">Track customer enquiries, salon responses and missed leads.</p>
          </div>
          <button className="btn btn-sm btn-outline-secondary" type="button" onClick={handleRefresh} disabled={refreshing || loading}>
            <RefreshCw size={14} className={`me-1 ${refreshing ? "spin" : ""}`} />{refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {/* <div className="row g-2 g-md-3 mb-3">
          {TILE_META.map(({ key, label, Icon, tone, suffix }) => (
            <div className="col-6 col-md-4 col-xl" key={key}>
              <div className="card br-card br-stat shadow-sm h-100">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                    <span className="br-muted-label">{label}</span>
                    <span className={`d-inline-flex align-items-center justify-content-center rounded-2 bg-${tone}-subtle text-${tone}`} style={{ width: 30, height: 30, flexShrink: 0 }}><Icon size={16} /></span>
                  </div>
                  <div className="fw-bold br-stat-value">{loading && !summary ? "—" : `${Number(tiles[key] || 0).toLocaleString("en-IN")}${suffix || ""}`}</div>
                  {key === "received" && tiles.awaiting > 0 && <div className="small text-warning-emphasis mt-1">{tiles.awaiting} awaiting response</div>}
                  {key === "autoCancelled" && <div className="small text-muted mt-1">No answer within 60 sec</div>}
                </div>
              </div>
            </div>
          ))}
        </div> */}

        <section className="br-card shadow-sm mb-3">
          <div className="p-3">
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
              <div>
                <div className="fw-semibold">Filter requests</div>
                <div className="small text-muted">Search, filter and navigate through customer requests.</div>
              </div>
              <button className="btn btn-sm btn-outline-secondary d-lg-none flex-shrink-0" type="button" onClick={() => setShowMobileFilters((value) => !value)} aria-expanded={showMobileFilters}>
                <Search size={14} className="me-1" />{showMobileFilters ? "Hide filters" : `Filters${activeFilterCount ? ` (${activeFilterCount})` : ""}`}
              </button>
            </div>
            <div className="br-filter-grid">
              <div className="br-filter-field br-search-field">
                <label>Search requests</label>
                <SearchInput value={search} onChange={setSearch} placeholder="Search customer, phone or salon…" />
              </div>
              <div className={`br-filter-field ${showMobileFilters ? "" : "d-none d-lg-block"}`}>
                <label htmlFor="br-range-filter">Date range</label>
                <select id="br-range-filter" className="form-select form-select-sm" value={range} onChange={(event) => { setRange(event.target.value); setPage(1); }}>
                  {RANGES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
              </div>
              <div className={`br-filter-field ${showMobileFilters ? "" : "d-none d-lg-block"}`}>
                <label htmlFor="br-salon-filter">Salon</label>
                <select id="br-salon-filter" className="form-select form-select-sm" value={salonId} onChange={(event) => { setSalonId(event.target.value); setPage(1); }}>
                  <option value="">All salons</option>
                  {salonOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div className={`br-filter-field ${showMobileFilters ? "" : "d-none d-lg-block"}`}>
                <label htmlFor="br-status-filter">Request status</label>
                <select id="br-status-filter" className="form-select form-select-sm" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
                  {STATUS_FILTERS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
              </div>
            </div>
            <div className="br-filter-actions">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <button className="btn btn-sm btn-outline-secondary" type="button" onClick={resetFilters}>Clear filters</button>
                <button className="btn btn-sm btn-dark" type="button" onClick={handleExport} disabled={exporting}>
                  <Download size={14} className="me-1" />{exporting ? "Exporting…" : "Export CSV"}
                </button>
                <span className="small text-muted">{loading ? "Loading…" : `${pagination.totalRequests || 0} requests found`}</span>
              </div>
              <div className="d-flex flex-wrap align-items-center gap-2 justify-content-between">
                <label className="small text-muted mb-0 d-flex align-items-center gap-2" htmlFor="br-page-size">Rows per page
                  <select id="br-page-size" className="form-select form-select-sm" style={{ width: 82 }} value={pagination.limit} onChange={(event) => { setPagination((current) => ({ ...current, limit: Number(event.target.value) })); setPage(1); }}>
                    {[25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                </label>
                <div className="pagination-wrap d-flex flex-column align-items-end gap-1">
                  <span className="small text-muted">Page {page} of {pagination.totalPages || 1}</span>
                  <Pagination currentPage={page} totalPages={pagination.totalPages || 1} onPageChange={setPage} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="br-card shadow-sm mb-3">
          <div className="br-section p-3">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div>
                <h2 className="h6 fw-semibold mb-1">Customer requests</h2>
                <div className="text-muted small">{loading ? "Loading requests…" : `${pagination.totalRequests || 0} total request${pagination.totalRequests === 1 ? "" : "s"}`}</div>
              </div>
              {!loading && rows.length > 0 && <span className="small text-muted">Select a request to view details</span>}
            </div>

            {loading ? (
              <Loader fullScreen={false} size="sm" text="Loading booking requests…" />
            ) : rows.length === 0 ? (
              <div className="text-center py-5 px-3">
                <span className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 58, height: 58, background: "#f1f5f9", color: "#64748b" }}><Inbox size={27} /></span>
                <div className="fw-semibold">No booking requests found</div>
                <p className="small text-muted mb-3 mt-1">Try changing the date range or clearing your filters.</p>
                <button className="btn btn-sm btn-outline-secondary" type="button" onClick={resetFilters}>Clear filters</button>
              </div>
            ) : (
              <>
                <div className="d-none d-lg-block table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: ".875rem" }}>
                    <thead><tr><th>Customer</th><th>Salon</th><th>Requested</th><th className="text-end">Value</th><th>Status</th><th>Reply time</th><th>Sent</th><th /></tr></thead>
                    <tbody>
                      {rows.map((row) => {
                        const state = statusOf(row);
                        return (
                          <tr key={row.bookingRequestId} role="button" tabIndex={0} onClick={() => openRequest(row)} onKeyDown={(event) => { if (event.key === "Enter") openRequest(row); }}>
                            <td><div className="fw-semibold">{row.customerName || "Customer"}</div><div className="text-muted small d-flex align-items-center gap-1"><Phone size={12} />{row.customerPhone || "No phone"}</div></td>
                            <td><div className="d-flex align-items-center gap-1"><Store size={13} className="text-muted flex-shrink-0" /><span className="br-wrap">{row.salonName || "—"}</span></div><div className="text-muted small">{row.city || ""}</div></td>
                            <td><div className="small d-flex align-items-center gap-1"><CalendarClock size={13} className="text-muted flex-shrink-0" />{istDay(row.bookingDate)} · {clock(row.bookingTime)}</div><div className="text-muted small d-flex align-items-center gap-1"><Scissors size={12} className="flex-shrink-0" /><span className="br-wrap">{(row.services || []).map((item) => item.serviceName).join(", ") || "—"}</span></div></td>
                            <td className="text-end fw-semibold text-nowrap">{money(row.total)}</td>
                            <td>{renderStatus(state)}</td>
                            <td>{state === "AUTO_CANCELLED" ? <span className="text-muted small">No answer in 60s</span> : <span className="small">{shortSeconds(row.responseSeconds)}</span>}</td>
                            <td className="text-muted small text-nowrap">{istDateTime(row.createdAt)}</td>
                            <td className="text-end"><ChevronRight size={16} className="text-muted" /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="d-lg-none d-flex flex-column gap-2">
                  {rows.map((row) => {
                    const state = statusOf(row);
                    return (
                      <button type="button" key={row.bookingRequestId} className="br-request-card text-start w-100" onClick={() => openRequest(row)}>
                        <div className="d-flex align-items-start justify-content-between gap-2">
                          <div className="br-wrap"><div className="fw-semibold br-wrap">{row.customerName || "Customer"}</div><div className="small text-muted d-flex align-items-center gap-1 mt-1"><Phone size={12} />{row.customerPhone || "No phone"}</div></div>
                          <div className="flex-shrink-0">{renderStatus(state)}</div>
                        </div>
                        <div className="d-flex align-items-center gap-2 mt-3 br-wrap"><Store size={15} className="text-muted flex-shrink-0" /><div className="small br-wrap"><span className="fw-medium">{row.salonName || "—"}</span>{row.city ? <span className="text-muted"> · {row.city}</span> : null}</div></div>
                        <div className="d-flex align-items-start gap-2 mt-2"><CalendarClock size={15} className="text-muted flex-shrink-0 mt-1" /><div className="small"><div>{istDay(row.bookingDate)} · {clock(row.bookingTime)}</div><div className="text-muted br-wrap mt-1"><Scissors size={12} className="me-1" />{(row.services || []).map((item) => item.serviceName).join(", ") || "No services listed"}</div></div></div>
                        <div className="d-flex align-items-center gap-2 mt-3"><div className="br-metric flex-fill"><div className="br-muted-label">Estimated value</div><div className="fw-semibold">{money(row.total)}</div></div><div className="br-metric flex-fill"><div className="br-muted-label">Reply time</div><div className="fw-semibold">{state === "AUTO_CANCELLED" ? "Not answered" : shortSeconds(row.responseSeconds)}</div></div></div>
                        <div className="d-flex align-items-center justify-content-between gap-2 mt-3 pt-2 border-top"><span className="small text-muted">Sent {istDateTime(row.createdAt)}</span><span className="small fw-semibold text-primary">View details <ChevronRight size={14} /></span></div>
                      </button>
                    );
                  })}
                </div>

              </>
            )}
          </div>
        </section>

        <section className="br-card shadow-sm">
          <div className="br-section p-3">
            <div className="d-flex flex-column flex-sm-row align-items-start justify-content-between gap-3 mb-3">
              <div><h2 className="h6 fw-semibold mb-1">Salon performance</h2><div className="text-muted small">See which salons receive leads and which miss customer requests.</div></div>
              <select className="form-select form-select-sm" value={salonSort} onChange={(event) => setSalonSort(event.target.value)} style={{ width: "100%", maxWidth: 260 }} aria-label="Sort salon performance">
                <option value="missed">Most missed leads</option><option value="received">Most leads received</option><option value="answerRate">Lowest answer rate</option><option value="median">Slowest replies</option>
              </select>
            </div>

            {salonReport.length === 0 ? (
              <div className="text-muted small py-3">No leads in this date range.</div>
            ) : (
              <>
                <div className="d-none d-lg-block table-responsive">
                  <table className="table table-hover table-sm align-middle mb-0">
                    <thead><tr><th>Salon</th><th className="text-end">Received</th><th className="text-end">Accepted</th><th className="text-end">Rejected</th><th className="text-end">Missed</th><th className="text-end">Answer rate</th><th className="text-end">Median reply</th></tr></thead>
                    <tbody>
                      {salonReport.map((row) => (
                        <tr key={row.salonId} role="button" tabIndex={0} onClick={() => { setSalonId(row.salonId); setPage(1); }} onKeyDown={(event) => { if (event.key === "Enter") { setSalonId(row.salonId); setPage(1); } }}>
                          <td><div className="fw-semibold">{row.salonName || "Unnamed salon"}</div>{row.city && <div className="small text-muted">{row.city}</div>}</td>
                          <td className="text-end">{row.received}</td><td className="text-end text-success fw-medium">{row.accepted}</td><td className="text-end text-danger fw-medium">{row.rejected}</td>
                          <td className="text-end">{row.autoCancelled > 0 ? <span className="badge bg-secondary-subtle text-secondary-emphasis">{row.autoCancelled}</span> : <span className="text-muted">0</span>}</td>
                          <td className="text-end fw-semibold">{row.answerRate}%</td><td className="text-end text-muted">{row.medianResponseSeconds === null || row.medianResponseSeconds === undefined ? "—" : shortSeconds(row.medianResponseSeconds)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="d-lg-none d-flex flex-column gap-2">
                  {salonReport.map((row) => (
                    <button type="button" key={row.salonId} className="br-report-card text-start w-100" onClick={() => { setSalonId(row.salonId); setPage(1); }}>
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-3"><div className="br-wrap"><div className="fw-semibold br-wrap">{row.salonName || "Unnamed salon"}</div>{row.city && <div className="small text-muted mt-1">{row.city}</div>}</div><span className="badge rounded-pill bg-primary-subtle text-primary-emphasis px-3 py-2 flex-shrink-0">{row.answerRate}% answered</span></div>
                      <div className="row g-2">
                        <div className="col-6"><div className="br-metric"><div className="br-muted-label">Received</div><div className="fw-semibold">{row.received}</div></div></div>
                        <div className="col-6"><div className="br-metric"><div className="br-muted-label">Accepted</div><div className="fw-semibold text-success">{row.accepted}</div></div></div>
                        <div className="col-6"><div className="br-metric"><div className="br-muted-label">Rejected</div><div className="fw-semibold text-danger">{row.rejected}</div></div></div>
                        <div className="col-6"><div className="br-metric"><div className="br-muted-label">Missed</div><div className="fw-semibold">{row.autoCancelled}</div></div></div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between gap-2 mt-3 pt-2 border-top"><span className="small text-muted">Median reply: {row.medianResponseSeconds === null || row.medianResponseSeconds === undefined ? "—" : shortSeconds(row.medianResponseSeconds)}</span><span className="small fw-semibold text-primary">View requests <ChevronRight size={14} /></span></div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <BookingRequestDetailModal show={Boolean(selected)} request={selected} onHide={() => setSelected(null)} />
    </Layout>
  );
};

export default BookingRequests;