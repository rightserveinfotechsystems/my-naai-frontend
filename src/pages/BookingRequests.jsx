import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  RefreshCw,
  Inbox,
  Phone,
  Search,
  Download,
  Store,
  Scissors,
  CalendarClock,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import Layout from "../components/Layout.jsx";
import SearchInput from "../components/SearchInput.jsx";
import Pagination from "../components/Pagination.jsx";
import Loader from "../components/Loader.jsx";
import BookingRequestDetailModal, { LIFECYCLE } from "../components/BookingRequestDetailModal.jsx";
import { bookingRequestAPI } from "../services/communication.jsx";
import { bookingWindowShort } from "../utils/bookingWindow.js";

/**
 * The admin panel's Booking requests tab.
 *
 * A request is a lead; it is not a booking. This tab reads `booking_requests`
 * only, and it now opens on TODAY.
 *
 * ── The three things that were wrong ────────────────────────────────────────
 * 1. The date range never reached the list. `range` was sent, the endpoint
 *    ignored it unless an explicit from/to came with it, and the default was
 *    "all time" — so the tiles said "today" and the table listed every request
 *    the platform had ever taken. The endpoint now resolves the window itself
 *    (IST, midnight to midnight) and echoes it back in `filters`.
 * 2. `page` survived a filter change. Switching to "Rejected" from page 4 asked
 *    for page 4 of a list that has one page, and showed nothing — which reads
 *    as "the filter is broken". Every filter change now returns to page 1.
 * 3. The status filter and the search box were ANDed into one OR on the
 *    server, so either of them stopped filtering. Fixed there; the chips here
 *    now carry the server's own counts so the number on a chip and the rows it
 *    produces are the same number.
 *
 * ── Volume ─────────────────────────────────────────────────────────────────
 * Filtering and paging happen in SQL, the order is stable, and the chip counts
 * arrive in the same response as the page (one GROUP BY over the selected
 * window, not a download).
 *
 * ── Width ──────────────────────────────────────────────────────────────────
 * Every text column is a single ellipsised line inside a fixed table layout
 * (`table-layout: fixed`), so a 120-character salon name shortens instead of
 * widening the page past the sidebar. The full value is in `title`.
 */

const STATUS_FILTERS = [
  { key: "ALL", label: "All", countKey: "ALL" },
  { key: "PENDING", label: "Awaiting", countKey: "PENDING" },
  { key: "ACCEPTED", label: "Accepted", countKey: "ACCEPTED" },
  { key: "REJECTED", label: "Rejected", countKey: "REJECTED" },
  { key: "AUTO_CANCELLED", label: "Auto-cancelled", countKey: "AUTO_CANCELLED" },
  { key: "CANCELLED", label: "Cancelled", countKey: "CANCELLED" },
  { key: "DELAYED", label: "Delayed", countKey: "DELAYED" }
];

const RANGES = [
  { key: "TODAY", label: "Today" },
  { key: "WEEK", label: "Last 7 days" },
  { key: "MONTH", label: "Last 30 days" },
  { key: "ALL", label: "All time" }
];

const RANGE_LABEL = RANGES.reduce((acc, item) => ({ ...acc, [item.key]: item.label }), {});

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
  const [statusCounts, setStatusCounts] = useState(null);
  const [summary, setSummary] = useState(null);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [salonSort, setSalonSort] = useState("missed");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 450);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const accessTab = localStorage.getItem("accessTab") ? JSON.parse(localStorage.getItem("accessTab")) : null;
    if (localStorage.getItem("role") === "distributor" || !(accessTab && accessTab.includes("bookingRequests"))) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // One rule for every filter: a narrower question starts at page 1. Without
  // this, filtering from page 3 asks for page 3 of a one-page result and the
  // tab looks empty.
  useEffect(() => {
    setPage(1);
  }, [range, status, salonId, debouncedSearch]);

  // Changing a filter starts a second request while the first is still in
  // flight. Only the newest answer may touch the table, or a slow page 3 lands
  // after a fast page 1 and the rows do not match the controls.
  const listRequestRef = useRef(0);

  const loadList = useCallback(async () => {
    const ticket = ++listRequestRef.current;
    const result = await bookingRequestAPI.adminList({
      salonId,
      status,
      range,
      search: debouncedSearch,
      page,
      limit: pagination.limit
    });
    if (ticket !== listRequestRef.current) return false;
    if (result.success) {
      setRows(result.data?.requests || []);
      setPagination((current) => ({ ...current, ...(result.data?.pagination || {}) }));
      setStatusCounts(result.data?.statusCounts || null);
      setAppliedFilters(result.data?.filters || null);
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
    const timer = setInterval(() => { loadSummary(); }, 20000);
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

  /**
   * Answer a request on the salon's behalf. The refresh runs whatever the
   * outcome: if the salon answered a second before us the server says
   * "already actioned", and the table has to show that answer rather than the
   * one we were about to give.
   */
  const handleAnswer = useCallback(async (action, { reason } = {}) => {
    if (!selected) return { success: false, message: "No request selected" };

    const result = await bookingRequestAPI.adminAction(selected.bookingRequestId, {
      action,
      ...(reason ? { reason } : {})
    });

    await Promise.all([loadList(), loadSummary()]);

    if (result.success) {
      toast.success(
        action === "ACCEPT"
          ? `Booking accepted for ${selected.salonName || "the salon"}`
          : `Request rejected for ${selected.salonName || "the salon"}`
      );
      setSelected(null);
      return { success: true };
    }

    const message = result.message || "Could not answer this request";
    toast.error(message);
    // "already actioned" / "expired" are answers, not failures to retry: close
    // the sheet so the refreshed row is what the admin sees.
    if (/already|expired|cancelled/i.test(message)) setSelected(null);
    return { success: false, message };
  }, [selected, loadList, loadSummary]);

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
        "Services", "Estimated total", "Status", "Answered by", "Sent at (IST)",
        "Answered at (IST)", "Response seconds", "Booking ID"
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
          row.onBehalfOfSalon ? "My Naai (on behalf of the salon)" : "Salon",
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

  const activeFilterCount = Number(range !== "TODAY") + Number(Boolean(salonId)) + Number(status !== "ALL") + Number(Boolean(search.trim()));
  const appliedRange = appliedFilters?.range || range;
  const appliedStatusLabel = STATUS_FILTERS.find((item) => item.key === (appliedFilters?.status || status))?.label || "All";

  const openRequest = (row) => setSelected({ ...row, status: statusOf(row) });

  const renderStatus = (state) => {
    const meta = LIFECYCLE[state] || LIFECYCLE.PENDING;
    return <span className={`badge rounded-pill bg-${meta.tone}-subtle text-${meta.tone}-emphasis px-3 py-2`}>{meta.label}</span>;
  };

  return (
    <Layout>
      <div className="page-content booking-requests-page d-flex flex-column p-2 p-md-3" style={{ minHeight: "calc(100vh - 70px)", minWidth: 0 }}>
        <style>{`
          .booking-requests-page { width: 100%; max-width: 100%; overflow-x: hidden; }
          .booking-requests-page > * { min-width: 0; max-width: 100%; }
          .booking-requests-page .br-card { border: 1px solid #e9edf2; border-radius: 14px; background: #fff; }
          .booking-requests-page .br-filter-grid { display: grid; grid-template-columns: minmax(200px, 2fr) minmax(140px, 1fr) minmax(150px, 1fr) auto; gap: 10px; align-items: end; }
          .booking-requests-page .br-filter-grid > * { min-width: 0; width: 100%; }
          .booking-requests-page .br-filter-field label { display: block; margin: 0 0 5px; color: #64748b; font-size: .72rem; font-weight: 700; letter-spacing: .035em; text-transform: uppercase; }
          .booking-requests-page .br-filter-field .form-select { min-height: 38px; }
          .booking-requests-page .br-chip-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; min-width: 0; }
          .booking-requests-page .br-chip { display: inline-flex; align-items: center; gap: 7px; max-width: 100%; padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 999px; background: #fff; color: #334155; font-size: .8rem; font-weight: 600; line-height: 1.2; }
          .booking-requests-page .br-chip:hover { border-color: #cbd5e1; background: #f8fafc; }
          .booking-requests-page .br-chip.active { border-color: #0f172a; background: #0f172a; color: #fff; }
          .booking-requests-page .br-chip .br-chip-count { font-variant-numeric: tabular-nums; padding: 1px 7px; border-radius: 999px; background: #f1f5f9; color: #475569; font-size: .72rem; }
          .booking-requests-page .br-chip.active .br-chip-count { background: rgba(255,255,255,.18); color: #fff; }
          .booking-requests-page .br-filter-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; border-top: 1px solid #edf0f3; margin-top: 14px; padding-top: 14px; }
          .booking-requests-page .br-results-line { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-width: 0; color: #64748b; font-size: .82rem; }
          .booking-requests-page .br-muted-label { color: #64748b; font-size: .72rem; text-transform: uppercase; letter-spacing: .04em; font-weight: 600; }
          .booking-requests-page .br-metric { background: #f8fafc; border-radius: 9px; padding: 8px 10px; min-width: 0; }
          /* Fixed layout + ellipsis: the column widths are decided here, so a
             long salon / customer / service name can never widen the page. */
          .booking-requests-page .br-table { table-layout: fixed; width: 100%; margin-bottom: 0; }
          .booking-requests-page .br-table th { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: .72rem; color: #64748b; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
          .booking-requests-page .br-table td { padding-top: 13px; padding-bottom: 13px; overflow: hidden; vertical-align: middle; }
          .booking-requests-page .br-ellipsis { display: block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .booking-requests-page .br-two-line { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
          .booking-requests-page .br-report-table { table-layout: fixed; width: 100%; }
          .booking-requests-page .br-report-table td, .booking-requests-page .br-report-table th { overflow: hidden; text-overflow: ellipsis; }
          .booking-requests-page .br-request-card, .booking-requests-page .br-report-card { border: 1px solid #e9edf2; border-radius: 12px; padding: 14px; background: #fff; cursor: pointer; transition: border-color .15s ease, box-shadow .15s ease; min-width: 0; overflow: hidden; }
          .booking-requests-page .br-wrap { overflow-wrap: anywhere; min-width: 0; }
          @media (min-width: 992px) {
            .booking-requests-page .br-request-card:hover, .booking-requests-page .br-report-card:hover { border-color: #cbd5e1; box-shadow: 0 4px 14px rgba(15,23,42,.05); }
          }
          @media (min-width: 768px) and (max-width: 991.98px) {
            .booking-requests-page .br-filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .booking-requests-page .br-filter-grid .br-search-field { grid-column: 1 / -1; }
          }
          @media (max-width: 767.98px) {
            .booking-requests-page .br-filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .booking-requests-page .br-filter-grid .br-search-field { grid-column: 1 / -1; }
            .booking-requests-page .br-filter-actions { align-items: stretch; flex-direction: column; }
            .booking-requests-page .br-filter-actions .pagination-wrap { width: 100%; display: flex; justify-content: center; }
            .booking-requests-page .br-filter-actions .pagination-wrap > * { max-width: 100%; }
            .booking-requests-page .br-filter-grid .btn { min-height: 38px; }
            .booking-requests-page .br-section { padding: 12px !important; }
            .booking-requests-page .br-chip { font-size: .76rem; padding: 6px 10px; }
            .booking-requests-page .br-mobile-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .booking-requests-page .br-mobile-actions > * { width: 100%; }
          }
        `}</style>

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 px-1">
          <div style={{ minWidth: 0 }}>
            {/* No subtitle under the page title. It said what the tiles below it
                already say in numbers, and on a phone it pushed the first
                request two rows down the screen. */}
            <h1 className="h4 fw-bold mb-0">Booking requests</h1>
          </div>
          <button className="btn btn-sm btn-outline-secondary flex-shrink-0" type="button" onClick={handleRefresh} disabled={refreshing || loading}>
            <RefreshCw size={14} className={`me-1 ${refreshing ? "spin" : ""}`} />{refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <section className="br-card shadow-sm mb-3">
          <div className="p-3">
            <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
              <div style={{ minWidth: 0 }}>
                <div className="fw-semibold">Filter requests</div>
              </div>
              <button className="btn btn-sm btn-outline-secondary d-lg-none flex-shrink-0" type="button" onClick={() => setShowMobileFilters((value) => !value)} aria-expanded={showMobileFilters}>
                <Search size={14} className="me-1" />{showMobileFilters ? "Hide filters" : `Filters${activeFilterCount ? ` (${activeFilterCount})` : ""}`}
              </button>
            </div>

            <div className="br-filter-grid">
              <div className="br-filter-field br-search-field">
                <label htmlFor="br-search">Search requests</label>
                <SearchInput value={search} onChange={setSearch} placeholder="Customer, phone or salon…" />
              </div>
              <div className={`br-filter-field ${showMobileFilters ? "" : "d-none d-lg-block"}`}>
                <label htmlFor="br-range-filter">Date range</label>
                <select id="br-range-filter" className="form-select form-select-sm" value={range} onChange={(event) => setRange(event.target.value)}>
                  {RANGES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
              </div>
              <div className={`br-filter-field ${showMobileFilters ? "" : "d-none d-lg-block"}`}>
                <label htmlFor="br-salon-filter">Salon</label>
                <select id="br-salon-filter" className="form-select form-select-sm" value={salonId} onChange={(event) => setSalonId(event.target.value)}>
                  <option value="">All salons</option>
                  {salonOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div className={`br-filter-field ${showMobileFilters ? "" : "d-none d-lg-block"}`}>
                <label className="d-none d-lg-block">&nbsp;</label>
                <button className="btn btn-sm btn-outline-secondary w-100" type="button" onClick={resetFilters}>Clear filters</button>
              </div>
            </div>

            {/* Status chips, with the server's counts for the selected window.
                Clicking one narrows the table; the count is what the table will
                then hold (for the range and salon that are selected). */}
            <div className="br-chip-row" role="group" aria-label="Request status">
              {STATUS_FILTERS.map((item) => {
                const count = statusCounts ? statusCounts[item.countKey] : null;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`br-chip ${status === item.key ? "active" : ""}`}
                    aria-pressed={status === item.key}
                    onClick={() => setStatus(item.key)}
                  >
                    <span className="text-truncate">{item.label}</span>
                    {count !== null && count !== undefined && <span className="br-chip-count">{Number(count).toLocaleString("en-IN")}</span>}
                  </button>
                );
              })}
            </div>

            <div className="br-filter-actions">
              <div className="br-results-line">
                <span>
                  {loading
                    ? "Loading…"
                    : `${Number(pagination.totalRequests || 0).toLocaleString("en-IN")} request${pagination.totalRequests === 1 ? "" : "s"} matching`}
                </span>
                <span className="text-muted">·</span>
                <span className="badge bg-light text-secondary border">{RANGE_LABEL[appliedRange] || appliedRange}</span>
                {appliedStatusLabel !== "All" && <span className="badge bg-light text-secondary border">{appliedStatusLabel}</span>}
                {appliedFilters?.salonId && <span className="badge bg-light text-secondary border">One salon</span>}
                {appliedFilters?.search && <span className="badge bg-light text-secondary border">“{appliedFilters.search}”</span>}
              </div>
              <div className="d-flex flex-wrap align-items-center gap-2 justify-content-between">
                <button className="btn btn-sm btn-dark" type="button" onClick={handleExport} disabled={exporting}>
                  <Download size={14} className="me-1" />{exporting ? "Exporting…" : "Export CSV"}
                </button>
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
              <div style={{ minWidth: 0 }}>
                <h2 className="h6 fw-semibold mb-1">Customer requests</h2>
                <div className="text-muted small">
                  {loading
                    ? "Loading requests…"
                    : `${Number(pagination.totalRequests || 0).toLocaleString("en-IN")} total request${pagination.totalRequests === 1 ? "" : "s"} in ${RANGE_LABEL[appliedRange] || appliedRange}`}
                </div>
              </div>
              {!loading && rows.length > 0 && <span className="small text-muted">Select a request to view or answer it</span>}
            </div>

            {loading ? (
              <Loader fullScreen={false} size="sm" text="Loading booking requests…" />
            ) : rows.length === 0 ? (
              <div className="text-center py-5 px-3">
                <span className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 58, height: 58, background: "#f1f5f9", color: "#64748b" }}><Inbox size={27} /></span>
                <div className="fw-semibold">{range === "TODAY" && !search.trim() && status === "ALL" && !salonId ? "No requests today yet" : "No booking requests match these filters"}</div>
                <p className="small text-muted mb-3 mt-1">
                  {range === "TODAY" && !search.trim() && status === "ALL" && !salonId
                    ? "Nothing has come in today. Widen the range to see earlier requests."
                    : "Try a wider date range, another status, or clear the filters."}
                </p>
                <div className="d-flex flex-wrap justify-content-center gap-2">
                  {range !== "ALL" && <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => setRange("WEEK")}>Last 7 days</button>}
                  <button className="btn btn-sm btn-outline-secondary" type="button" onClick={resetFilters}>Clear filters</button>
                </div>
              </div>
            ) : (
              <>
                <div className="d-none d-lg-block">
                  <table className="table table-hover align-middle br-table" style={{ fontSize: ".875rem" }}>
                    <colgroup>
                      <col style={{ width: "17%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "9%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "9%" }} />
                      <col style={{ width: "11%" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Salon</th>
                        <th>Requested</th>
                        <th className="text-end">Value</th>
                        <th>Status</th>
                        <th>Reply</th>
                        <th>Sent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => {
                        const state = statusOf(row);
                        const services = (row.services || []).map((item) => item.serviceName).join(", ");
                        return (
                          <tr key={row.bookingRequestId} role="button" tabIndex={0} onClick={() => openRequest(row)} onKeyDown={(event) => { if (event.key === "Enter") openRequest(row); }}>
                            <td>
                              <div className="fw-semibold br-ellipsis" title={row.customerName || "Customer"}>{row.customerName || "Customer"}</div>
                              <div className="text-muted small d-flex align-items-center gap-1" style={{ minWidth: 0 }}>
                                <Phone size={12} className="flex-shrink-0" /><span className="br-ellipsis">{row.customerPhone || "No phone"}</span>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-1" style={{ minWidth: 0 }}>
                                <Store size={13} className="text-muted flex-shrink-0" />
                                <span className="br-ellipsis" title={row.salonName || ""}>{row.salonName || "—"}</span>
                              </div>
                              <div className="text-muted small br-ellipsis">{row.city || ""}</div>
                            </td>
                            <td>
                              <div className="small d-flex align-items-center gap-1" style={{ minWidth: 0 }}>
                                <CalendarClock size={13} className="text-muted flex-shrink-0" />
                                <span className="br-ellipsis">{istDay(row.bookingDate)} · {clock(row.bookingTime)}</span>
                              </div>
                              <div className="text-muted small d-flex align-items-center gap-1" style={{ minWidth: 0 }}>
                                <Scissors size={12} className="flex-shrink-0" /><span className="br-ellipsis" title={services}>{services || "—"}</span>
                              </div>
                            </td>
                            <td className="text-end fw-semibold text-nowrap">{money(row.total)}</td>
                            <td>
                              {renderStatus(state)}
                              {row.onBehalfOfSalon && <div className="small text-muted mt-1 d-flex align-items-center gap-1" title="Answered by My Naai on behalf of the salon"><ShieldCheck size={12} />by My Naai</div>}
                            </td>
                            <td className="small">{state === "AUTO_CANCELLED" ? <span className="text-muted">No answer in {bookingWindowShort}</span> : shortSeconds(row.responseSeconds)}</td>
                            <td className="text-muted small br-ellipsis">{istDateTime(row.createdAt)}</td>
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
                        <div className="d-flex align-items-start justify-content-between gap-2" style={{ minWidth: 0 }}>
                          <div className="br-wrap" style={{ minWidth: 0 }}><div className="fw-semibold br-wrap">{row.customerName || "Customer"}</div><div className="small text-muted d-flex align-items-center gap-1 mt-1"><Phone size={12} />{row.customerPhone || "No phone"}</div></div>
                          <div className="flex-shrink-0">{renderStatus(state)}</div>
                        </div>
                        <div className="d-flex align-items-center gap-2 mt-3" style={{ minWidth: 0 }}><Store size={15} className="text-muted flex-shrink-0" /><div className="small br-wrap" style={{ minWidth: 0 }}><span className="fw-medium">{row.salonName || "—"}</span>{row.city ? <span className="text-muted"> · {row.city}</span> : null}</div></div>
                        <div className="d-flex align-items-start gap-2 mt-2" style={{ minWidth: 0 }}><CalendarClock size={15} className="text-muted flex-shrink-0 mt-1" /><div className="small" style={{ minWidth: 0 }}><div>{istDay(row.bookingDate)} · {clock(row.bookingTime)}</div><div className="text-muted br-wrap mt-1"><Scissors size={12} className="me-1" />{(row.services || []).map((item) => item.serviceName).join(", ") || "No services listed"}</div></div></div>
                        <div className="d-flex align-items-center gap-2 mt-3"><div className="br-metric flex-fill"><div className="br-muted-label">Estimated value</div><div className="fw-semibold">{money(row.total)}</div></div><div className="br-metric flex-fill"><div className="br-muted-label">Reply time</div><div className="fw-semibold">{state === "AUTO_CANCELLED" ? "Not answered" : shortSeconds(row.responseSeconds)}</div></div></div>
                        <div className="d-flex align-items-center justify-content-between gap-2 mt-3 pt-2 border-top">
                          <span className="small text-muted">{row.onBehalfOfSalon ? "Answered by My Naai" : `Sent ${istDateTime(row.createdAt)}`}</span>
                          <span className="small fw-semibold text-primary">View details <ChevronRight size={14} /></span>
                        </div>
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
              <div style={{ minWidth: 0 }}><h2 className="h6 fw-semibold mb-1">Salon performance</h2><div className="text-muted small">Which salons receive leads, and which of them let them die.</div></div>
              <select className="form-select form-select-sm" value={salonSort} onChange={(event) => setSalonSort(event.target.value)} style={{ width: "100%", maxWidth: 260 }} aria-label="Sort salon performance">
                <option value="missed">Most missed leads</option><option value="received">Most leads received</option><option value="answerRate">Lowest answer rate</option><option value="median">Slowest replies</option>
              </select>
            </div>

            {salonReport.length === 0 ? (
              <div className="text-muted small py-3">No leads in {RANGE_LABEL[appliedRange] || appliedRange}.</div>
            ) : (
              <>
                <div className="d-none d-lg-block">
                  <table className="table table-hover table-sm align-middle br-report-table">
                    <colgroup>
                      <col style={{ width: "30%" }} />
                      <col style={{ width: "11%" }} />
                      <col style={{ width: "11%" }} />
                      <col style={{ width: "11%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "13%" }} />
                      <col style={{ width: "14%" }} />
                    </colgroup>
                    <thead><tr><th>Salon</th><th className="text-end">Received</th><th className="text-end">Accepted</th><th className="text-end">Rejected</th><th className="text-end">Missed</th><th className="text-end">Answer rate</th><th className="text-end">Median reply</th></tr></thead>
                    <tbody>
                      {salonReport.map((row) => (
                        <tr key={row.salonId} role="button" tabIndex={0} onClick={() => setSalonId(row.salonId)} onKeyDown={(event) => { if (event.key === "Enter") setSalonId(row.salonId); }}>
                          <td><div className="fw-semibold br-ellipsis" title={row.salonName || "Unnamed salon"}>{row.salonName || "Unnamed salon"}</div>{row.city && <div className="small text-muted br-ellipsis">{row.city}</div>}</td>
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
                    <button type="button" key={row.salonId} className="br-report-card text-start w-100" onClick={() => setSalonId(row.salonId)}>
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-3" style={{ minWidth: 0 }}><div className="br-wrap" style={{ minWidth: 0 }}><div className="fw-semibold br-wrap">{row.salonName || "Unnamed salon"}</div>{row.city && <div className="small text-muted mt-1">{row.city}</div>}</div><span className="badge rounded-pill bg-primary-subtle text-primary-emphasis px-3 py-2 flex-shrink-0">{row.answerRate}% answered</span></div>
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

      <BookingRequestDetailModal
        show={Boolean(selected)}
        request={selected}
        onHide={() => setSelected(null)}
        onAnswer={handleAnswer}
      />
    </Layout>
  );
};

export default BookingRequests;
