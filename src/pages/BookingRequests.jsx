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
import PageHeader from "../components/PageHeader.jsx";
import SearchInput from "../components/SearchInput.jsx";
import Pagination from "../components/Pagination.jsx";
import Loader from "../components/Loader.jsx";
import BookingRequestDetailModal, { LIFECYCLE } from "../components/BookingRequestDetailModal.jsx";
import { bookingRequestAPI } from "../services/communication.jsx";

/**
 * Booking requests — the leads a customer sent, and what each salon did with
 * them.
 *
 * Requests are NOT bookings. This tab reads `booking_requests` only: a booking
 * (`booking` / `booking_list`, the queue record) exists only after a salon
 * accepts, and mixing the two is what produces a "conversion rate" that adds up
 * to more than 100%. An accepted request shows here as Accepted and carries the
 * `bookingId` it created — a pointer between two separate records, never a
 * merged row.
 *
 * The question the tab answers: are the salons getting leads, and are they
 * answering them? So it leads with counts and answer rates, and the list under
 * them is filterable by salon, status, date and text.
 *
 * Read-only by design — an admin does not answer on a salon's behalf.
 */

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

// Times are IST for every viewer, with the same formatter the drawer uses.
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

/**
 * A request past its 60 second window is auto-cancelled even if the sweeper has
 * not written that down yet. The API derives the same state; deriving it again
 * here means a page left open overnight does not show an "Awaiting answer" that
 * nobody can answer.
 */
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

  // Same tab guard the other admin pages use.
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
  }, [salonId, status, debouncedSearch, page, pagination.limit]);

  const loadSummary = useCallback(async () => {
    const result = await bookingRequestAPI.adminSummary({ range, salonId });
    if (result.success) setSummary(result.data || null);
    // A failing summary must not empty the tab — the list is the page.
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

  // A 20 second poll of the summary is enough for v1 and costs one query — the
  // point is that a lead that just arrived shows up while somebody is watching.
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
    setStatus("ALL");
    setSalonId("");
    setSearch("");
    setPage(1);
  };

  // The salon filter is built from the report itself: exactly the salons that
  // received a lead in this range, in worst-first order. No second request, no
  // paging through the whole salon list.
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
        // A salon that never answered sorts last — its median is a dash, and
        // "never answered" is already visible in Missed.
        if (a.medianResponseSeconds === null) return 1;
        if (b.medianResponseSeconds === null) return -1;
        return b.medianResponseSeconds - a.medianResponseSeconds;
      }
      // Missed, worst first: the list an account manager works down.
      return b.autoCancelled - a.autoCancelled || b.received - a.received;
    });
  }, [summary, salonSort]);

  /**
   * Export the FILTERED list, not the page on screen: operations asks for "all
   * of yesterday's missed leads", and paging by hand is not an answer. The
   * export walks the same endpoint with a bigger page until it has everything
   * (capped, so a runaway filter cannot hammer the API).
   */
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

  return (
    <Layout>
      <PageHeader
        title="Booking requests"
        description="Every request a customer sent and what the salon did with it. Requests are leads — a booking exists only after a salon accepts."
        actions={(
          <>
            <select
              className="form-select form-select-sm"
              value={range}
              onChange={(event) => { setRange(event.target.value); setPage(1); }}
              style={{ minWidth: 140 }}
              aria-label="Date range"
            >
              {RANGES.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
            <button className="button23" type="button" onClick={handleRefresh} disabled={refreshing || loading}>
              <RefreshCw size={15} className={`me-1 ${refreshing ? "spin" : ""}`} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </>
        )}
      />

      <div className="page-content d-flex flex-column p-2 p-md-3" style={{ minHeight: "calc(100vh - 70px)", overflowX: "hidden" }}>

        {/* Counters. Auto-cancelled is its own tile — never folded into
            Rejected: a salon that misses leads and a salon that turns them down
            are two different conversations. */}
        <div className="row g-2 g-md-3 mb-3">
          {TILE_META.map(({ key, label, Icon, tone, suffix }) => (
            <div className="col-6 col-md-4 col-xl" key={key}>
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="text-muted small text-uppercase fw-semibold" style={{ letterSpacing: "0.4px" }}>{label}</span>
                    <Icon size={16} className={`text-${tone}`} />
                  </div>
                  <div className="h4 mb-0 fw-bold">
                    {loading && !summary ? "—" : `${Number(tiles[key] || 0).toLocaleString("en-IN")}${suffix || ""}`}
                  </div>
                  {key === "received" && tiles.awaiting > 0 && (
                    <div className="small text-warning-emphasis">{tiles.awaiting} still waiting</div>
                  )}
                  {key === "autoCancelled" && (
                    <div className="small text-muted">nobody answered in 60s</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card shadow-sm border-0 mb-3" style={{ borderRadius: 12 }}>
          <div className="card-body p-3">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-lg-4">
                <SearchInput value={search} onChange={setSearch} placeholder="Search customer, phone or salon…" />
              </div>

              <div className="col-12 col-lg-8">
                <div className={`d-flex flex-wrap gap-2 justify-content-lg-end ${showMobileFilters ? "" : "d-none d-lg-flex"}`}>
                  <select
                    className="form-select form-select-sm"
                    value={salonId}
                    onChange={(event) => { setSalonId(event.target.value); setPage(1); }}
                    style={{ minWidth: 180, maxWidth: 260 }}
                    aria-label="Salon"
                  >
                    <option value="">All salons</option>
                    {salonOptions.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>

                  <select
                    className="form-select form-select-sm"
                    value={status}
                    onChange={(event) => { setStatus(event.target.value); setPage(1); }}
                    style={{ minWidth: 170, maxWidth: 220 }}
                    aria-label="Status"
                  >
                    {STATUS_FILTERS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                  </select>

                  <button className="btn btn-sm btn-outline-secondary" type="button" onClick={resetFilters}>
                    Clear
                  </button>
                  <button className="btn btn-sm btn-outline-dark" type="button" onClick={handleExport} disabled={exporting}>
                    <Download size={14} className="me-1" />
                    {exporting ? "Exporting…" : "Export CSV"}
                  </button>
                </div>

                <div className="d-flex d-lg-none justify-content-end mt-2">
                  <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => setShowMobileFilters((value) => !value)}>
                    <Search size={14} className="me-1" /> {showMobileFilters ? "Hide filters" : "Filters"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The list */}
        <div className="flex-grow-1 p-2 p-md-3 shadow-sm border-0 bg-white mb-3" style={{ borderRadius: 12, overflowX: "auto" }}>
          {loading ? (
            <Loader fullScreen={false} size="sm" text="Loading booking requests…" />
          ) : rows.length === 0 ? (
            <div className="text-center py-5 text-muted px-2">
              <Inbox size={40} className="mx-auto mb-2 opacity-25" />
              <p className="mb-1">No booking requests match these filters.</p>
              <p className="small mb-0">A request appears here the moment a customer sends one — try a wider date range.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table align-middle mb-0" style={{ fontSize: "0.9rem", minWidth: "860px" }}>
                  <thead>
                    <tr className="text-muted small" style={{ textTransform: "uppercase", letterSpacing: "0.4px" }}>
                      <th>Customer</th>
                      <th>Salon</th>
                      <th>Requested</th>
                      <th className="text-end">Value</th>
                      <th>Status</th>
                      <th>Reply time</th>
                      <th className="text-end">Sent</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const state = statusOf(row);
                      const meta = LIFECYCLE[state] || LIFECYCLE.PENDING;
                      return (
                        <tr key={row.bookingRequestId} style={{ cursor: "pointer" }} onClick={() => setSelected({ ...row, status: state })}>
                          <td>
                            <div className="fw-semibold">{row.customerName || "Customer"}</div>
                            <div className="text-muted small d-flex align-items-center gap-1">
                              <Phone size={12} /> {row.customerPhone || "no phone"}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-1">
                              <Store size={13} className="text-muted" />
                              <span>{row.salonName || "—"}</span>
                            </div>
                            <div className="text-muted small">{row.city || ""}</div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-1 small">
                              <CalendarClock size={13} className="text-muted" /> {istDay(row.bookingDate)} · {clock(row.bookingTime)}
                            </div>
                            <div className="text-muted small d-flex align-items-center gap-1">
                              <Scissors size={12} />
                              {(row.services || []).map((item) => item.serviceName).join(", ") || "—"}
                            </div>
                          </td>
                          <td className="text-end fw-semibold">{money(row.total)}</td>
                          <td>
                            <span className={`badge bg-${meta.tone}-subtle text-${meta.tone}-emphasis`}>{meta.label}</span>
                          </td>
                          <td>
                            {state === "AUTO_CANCELLED"
                              ? <span className="text-muted small">no answer in 60s</span>
                              : <span className="small">{shortSeconds(row.responseSeconds)}</span>}
                          </td>
                          <td className="text-end text-muted small">{istDateTime(row.createdAt)}</td>
                          <td className="text-end"><ChevronRight size={16} className="text-muted" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-3">
                <div className="text-muted small">
                  {pagination.totalRequests} request{pagination.totalRequests === 1 ? "" : "s"} · page {pagination.page} of {pagination.totalPages || 1}
                </div>
                <Pagination currentPage={pagination.page} totalPages={pagination.totalPages || 1} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>

        {/* The per-salon report — which salons get leads and which let them die. */}
        <div className="p-2 p-md-3 shadow-sm border-0 bg-white" style={{ borderRadius: 12, overflowX: "auto" }}>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
            <div>
              <h2 className="h6 mb-0">Salons by missed leads</h2>
              <div className="text-muted small">Worst first. A missed lead is a request nobody answered in 60 seconds — not a rejection.</div>
            </div>
            <select
              className="form-select form-select-sm"
              value={salonSort}
              onChange={(event) => setSalonSort(event.target.value)}
              style={{ maxWidth: 220 }}
              aria-label="Sort the salon report"
            >
              <option value="missed">Sort: missed (worst first)</option>
              <option value="received">Sort: leads received</option>
              <option value="answerRate">Sort: answer rate (lowest)</option>
              <option value="median">Sort: slowest replies</option>
            </select>
          </div>

          {salonReport.length === 0 ? (
            <div className="text-muted small py-3">No leads in this range.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0" style={{ fontSize: "0.875rem", minWidth: "720px" }}>
                <thead>
                  <tr className="text-muted small" style={{ textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    <th>Salon</th>
                    <th className="text-end">Received</th>
                    <th className="text-end">Accepted</th>
                    <th className="text-end">Rejected</th>
                    <th className="text-end">Missed</th>
                    <th className="text-end">Answer rate</th>
                    <th className="text-end">Median reply</th>
                  </tr>
                </thead>
                <tbody>
                  {salonReport.map((row) => (
                    <tr
                      key={row.salonId}
                      style={{ cursor: "pointer" }}
                      onClick={() => { setSalonId(row.salonId); setPage(1); }}
                      title="Show this salon's requests"
                    >
                      <td>
                        <div className="fw-semibold">{row.salonName || "Unnamed salon"}</div>
                        {row.city && <div className="text-muted small">{row.city}</div>}
                      </td>
                      <td className="text-end">{row.received}</td>
                      <td className="text-end text-success">{row.accepted}</td>
                      <td className="text-end text-danger">{row.rejected}</td>
                      <td className="text-end">
                        {row.autoCancelled > 0
                          ? <span className="badge bg-secondary-subtle text-secondary-emphasis">{row.autoCancelled}</span>
                          : <span className="text-muted">0</span>}
                      </td>
                      <td className="text-end fw-semibold">{row.answerRate}%</td>
                      <td className="text-end text-muted">
                        {/* A dash, not a zero: a zero would read as "instant reply". */}
                        {row.medianResponseSeconds === null || row.medianResponseSeconds === undefined
                          ? "—"
                          : shortSeconds(row.medianResponseSeconds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <BookingRequestDetailModal
        show={Boolean(selected)}
        request={selected}
        onHide={() => setSelected(null)}
      />
    </Layout>
  );
};

export default BookingRequests;
