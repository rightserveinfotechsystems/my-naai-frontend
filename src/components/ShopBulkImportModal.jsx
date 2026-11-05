import { useEffect, useRef, useState } from "react";
import { Modal, Button, Form, Spinner, ProgressBar } from "react-bootstrap";
import { toast } from "react-toastify";
import { FileSpreadsheet, Download, UploadCloud, CheckCircle2, AlertTriangle, Undo2, FileText, X } from "lucide-react";
import { shopProductAPI } from "../services/communication.jsx";

const MAX_MB = 5;

const sizeLabel = (bytes) => {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const resultTone = {
  CREATED: "success",
  UPDATED: "primary",
  SKIPPED: "secondary",
  FAILED: "danger"
};

const ShopBulkImportModal = ({ show, onHide, onImported }) => {
  const [step, setStep] = useState("pick");
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("CREATE_ONLY");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState("");
  const [report, setReport] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const inputRef = useRef(null);
  const alive = useRef(true);

  useEffect(() => () => { alive.current = false; }, []);

  useEffect(() => {
    if (show) {
      setStep("pick");
      setFile(null);
      try {
        setMode(localStorage.getItem("shopBulkImportMode") || "CREATE_ONLY");
      } catch {
        setMode("CREATE_ONLY");
      }
      setReport(null);
      setImportResult(null);
      setBusy("");
    }
  }, [show]);

  const rememberMode = (next) => {
    setMode(next);
    try { localStorage.setItem("shopBulkImportMode", next); } catch {}
  };

  const acceptFile = (picked) => {
    if (!picked) return;
    const name = String(picked.name || "").toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".csv")) {
      toast.error("That is not a spreadsheet — upload an .xlsx or .csv file");
      return;
    }
    if (picked.size > MAX_MB * 1024 * 1024) {
      toast.error(`That file is ${sizeLabel(picked.size)} — the limit is ${MAX_MB} MB. Split the sheet and upload the parts.`);
      return;
    }
    setFile(picked);
    setReport(null);
    setStep("pick");
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer?.files?.[0]);
  };

  const downloadBlob = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleTemplate = async (format) => {
    setBusy("template");
    try {
      const response = await shopProductAPI.bulkTemplate(format);
      const blob = response?.data instanceof Blob ? response.data : new Blob([response?.data]);
      downloadBlob(blob, `naai-shop-product-template.${format}`);
      toast.success("Template downloaded — fill it in and drop it back here");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not download the template");
    } finally {
      setBusy("");
    }
  };

  const runCheck = async () => {
    if (!file) {
      toast.error("Choose the sheet first");
      return;
    }
    setBusy("check");
    try {
      const result = await shopProductAPI.bulkImport({ file, mode, dryRun: true });
      if (!result.success && !result.data) {
        toast.error(result.message || "That file could not be read");
        return;
      }
      setReport({ ...result.data, message: result.message });
      setStep("report");
    } catch (error) {
      toast.error(error?.response?.data?.message || "That file could not be read");
    } finally {
      setBusy("");
    }
  };

  const runImport = async () => {
    if (!file) return;
    setBusy("import");
    try {
      const result = await shopProductAPI.bulkImport({ file, mode, dryRun: false });
      const data = result.data || {};
      if (alive.current) {
        setImportResult({ ...data, message: result.message });
        setStep("done");
      }
      if (data?.summary?.created || data?.summary?.updated) {
        toast.success(`${data.summary.created} added · ${data.summary.updated} updated${data.summary.failed ? ` · ${data.summary.failed} failed` : ""}`);
        onImported?.();
      } else {
        toast.error(result.message || "Nothing was imported");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "The import failed");
    } finally {
      if (alive.current) setBusy("");
    }
  };

  const handleUndo = async () => {
    const importId = importResult?.importId;
    if (!importId) return;
    setBusy("undo");
    try {
      const result = await shopProductAPI.bulkUndo({ importId });
      if (result.success) {
        toast.success(result.message || "Import undone");
        onImported?.();
        setStep("pick");
        setFile(null);
        setImportResult(null);
        setReport(null);
      } else {
        toast.error(result.message || "Could not undo this import");
      }
    } finally {
      setBusy("");
    }
  };

  const downloadReport = () => {
    const source = step === "done" ? importResult : report;
    if (!source) return;
    const header = ["row", "productName", "result", "field", "message"];
    const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const lines = [header.join(",")];
    (source.rows || []).forEach((row) => {
      if (row.errors?.length) {
        row.errors.forEach((error) => {
          lines.push([row.row, row.productName, row.result, error.field, error.message].map(escape).join(","));
        });
      } else {
        lines.push([row.row, row.productName, row.result, "", ""].map(escape).join(","));
      }
    });
    downloadBlob(new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" }), "naai-shop-import-report.csv");
  };

  const summary = (step === "done" ? importResult : report)?.summary || { rows: 0, created: 0, updated: 0, skipped: 0, failed: 0 };
  const problems = ((step === "done" ? importResult : report)?.rows || []).filter((row) => row.result !== "CREATED");
  const importable = summary.created + summary.updated;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton className="border-0 pb-0">
        <div>
          <Modal.Title className="h5 mb-1 d-flex align-items-center gap-2">
            <FileSpreadsheet size={18} /> Bulk add products
          </Modal.Title>
          <div className="text-muted small">Download the sample, fill it in, drop it back. Nothing is written until you confirm.</div>
        </div>
      </Modal.Header>

      <Modal.Body className="pt-3">
        {step === "pick" && (
          <>
            <div className="mb-3">
              <div className="fw-semibold small mb-1">1 · Download the sample</div>
              <div className="d-flex flex-wrap gap-2">
                <Button size="sm" variant="outline-dark" disabled={busy === "template"} onClick={() => handleTemplate("xlsx")}>
                  <Download size={14} className="me-1" /> Sample (.xlsx)
                </Button>
                <Button size="sm" variant="outline-secondary" disabled={busy === "template"} onClick={() => handleTemplate("csv")}>
                  <FileText size={14} className="me-1" /> Blank (.csv)
                </Button>
              </div>
              <div className="text-muted small mt-1">
                Photos: square <strong>1200 × 1200 px JPG</strong>, white background, <strong>≤ 250 KB</strong>, up to four per product.
                The first one is the cover.
              </div>
            </div>

            <div className="mb-3 w-100" style={{ minWidth: 0 }}>
              <div className="fw-semibold small mb-2">2 · Fill it in, then drop it here</div>
              <div
                onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
                }}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Upload an Excel or CSV product sheet"
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    inputRef.current?.click();
                  }
                }}
                className={`bulk-import-dropzone w-100 d-flex flex-column align-items-center justify-content-center rounded-3 p-4 text-center ${dragging ? "is-dragging" : ""} ${file ? "has-file" : ""}`}
                style={{
                  display: "flex",
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: 0,
                  minHeight: "160px",
                  boxSizing: "border-box",
                  flex: "0 0 100%",
                  alignSelf: "stretch",
                  border: `2px dashed ${dragging ? "#0d6efd" : file ? "#198754" : "#cbd5e1"}`,
                  background: dragging ? "#eff6ff" : file ? "#f0fdf4" : "#f8fafc",
                  cursor: "pointer",
                  transition: "background-color .15s ease, border-color .15s ease",
                  overflow: "hidden"
                }}
              >
                <span
                  className="d-flex align-items-center justify-content-center rounded-circle mb-2"
                  style={{
                    width: 48,
                    height: 48,
                    flex: "0 0 48px",
                    color: file ? "#198754" : "#64748b",
                    background: file ? "#dcfce7" : "#e2e8f0"
                  }}
                >
                  {file ? <CheckCircle2 size={24} /> : <UploadCloud size={24} />}
                </span>

                {file ? (
                  <div className="w-100 small" style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    <div className="fw-semibold text-success">{file.name}</div>
                    <div className="text-muted mt-1">
                      {sizeLabel(file.size)} · Ready to check
                      <button
                        type="button"
                        className="btn btn-sm btn-link p-0 ms-2 align-baseline"
                        onClick={(event) => {
                          event.stopPropagation();
                          setFile(null);
                          setReport(null);
                          if (inputRef.current) inputRef.current.value = "";
                        }}
                      >
                        <X size={13} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-100" style={{ minWidth: 0 }}>
                    <div className="fw-semibold text-dark">Drop your product sheet here</div>
                    <div className="small text-muted mt-1">
                      or <span className="text-primary fw-semibold">browse files</span> · .xlsx or .csv
                    </div>
                    <div className="small text-muted mt-2">Maximum {MAX_MB} MB · Up to 1,000 rows</div>
                  </div>
                )}

                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.csv"
                  className="d-none"
                  onChange={(event) => acceptFile(event.target.files?.[0])}
                />
              </div>
            </div>

            <div className="mb-1">
              <div className="fw-semibold small mb-1">3 · Names that already exist</div>
              <Form.Check
                type="radio"
                id="bulk-create-only"
                name="bulk-mode"
                label={<span className="small">Skip them (create only)</span>}
                checked={mode === "CREATE_ONLY"}
                onChange={() => rememberMode("CREATE_ONLY")}
              />
              <Form.Check
                type="radio"
                id="bulk-upsert"
                name="bulk-mode"
                label={<span className="small">Update them with the sheet's values</span>}
                checked={mode === "UPSERT"}
                onChange={() => rememberMode("UPSERT")}
              />
            </div>
          </>
        )}

        {(step === "report" || step === "done") && (
          <>
            <div className="d-flex flex-wrap gap-2 mb-3">
              <span className="badge bg-success-subtle text-success-emphasis fs-6 fw-normal">
                {step === "done" ? summary.created : summary.created} {step === "done" ? "added" : "new"}
              </span>
              {summary.updated > 0 && (
                <span className="badge bg-primary-subtle text-primary-emphasis fs-6 fw-normal">{summary.updated} to update</span>
              )}
              {summary.skipped > 0 && (
                <span className="badge bg-secondary-subtle text-secondary-emphasis fs-6 fw-normal">
                  {summary.skipped} already exist {step === "done" ? "· skipped" : "(will be skipped)"}
                </span>
              )}
              {summary.failed > 0 && (
                <span className="badge bg-danger-subtle text-danger-emphasis fs-6 fw-normal">
                  {summary.failed} need{summary.failed === 1 ? "s" : ""} fixing
                </span>
              )}
              <span className="badge bg-light text-dark border fs-6 fw-normal">{summary.rows} rows</span>
            </div>

            {step === "report" && summary.failed === 0 && summary.skipped === 0 && (
              <div className="alert alert-success py-2 px-3 small mb-3 d-flex align-items-center gap-2">
                <CheckCircle2 size={15} /> Every row is valid. Nothing has been written yet.
              </div>
            )}

            {step === "report" && summary.failed > 0 && (
              <div className="alert alert-warning py-2 px-3 small mb-3 d-flex align-items-start gap-2">
                <AlertTriangle size={15} className="mt-1" />
                <div>
                  {summary.failed} row{summary.failed === 1 ? "" : "s"} will be skipped and reported. The rest still import —
                  one bad row never blocks the file. Fix them now, or import and re-upload just those rows.
                </div>
              </div>
            )}

            {problems.length > 0 && (
              <div className="table-responsive mb-3" style={{ maxHeight: 280, overflowY: "auto" }}>
                <table className="table table-sm align-middle mb-0" style={{ fontSize: "0.85rem" }}>
                  <thead>
                    <tr className="text-muted small" style={{ textTransform: "uppercase", letterSpacing: "0.4px" }}>
                      <th style={{ width: 60 }}>Row</th>
                      <th>Product</th>
                      <th style={{ width: 110 }}>Result</th>
                      <th>Problem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.map((row, index) => (
                      <tr key={`${row.row}-${index}`}>
                        <td className="fw-semibold">{row.row}</td>
                        <td className="text-break">{row.productName || "—"}</td>
                        <td>
                          <span className={`badge bg-${resultTone[row.result] || "secondary"}-subtle text-${resultTone[row.result] || "secondary"}-emphasis`}>
                            {row.result}
                          </span>
                        </td>
                        <td>
                          {(row.errors || []).map((error, errorIndex) => (
                            <div key={`${error.field}-${errorIndex}`}>
                              <code className="text-danger-emphasis">{error.field}</code> — {error.message}
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {step === "done" && summary.failed > 0 && (
              <div className="text-muted small mb-2">
                The rows below were refused; download the report, fix them and upload again — products that already
                landed are skipped by name, never duplicated.
              </div>
            )}
          </>
        )}

        {busy === "import" && (
          <div className="mb-2">
            <ProgressBar animated now={100} variant="warning" style={{ height: 6 }} />
            <div className="text-muted small mt-1">Importing {summary.rows} rows… you can close this dialog; a toast will tell you when it finishes.</div>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0 d-flex flex-wrap justify-content-between gap-2">
        <div>
          {(step === "report" || step === "done") && problems.length > 0 && (
            <Button size="sm" variant="outline-secondary" onClick={downloadReport}>
              <Download size={14} className="me-1" /> Download this report
            </Button>
          )}
        </div>

        <div className="d-flex gap-2">
          {step === "pick" && (
            <>
              <Button size="sm" variant="outline-secondary" onClick={onHide} disabled={busy === "check"}>Cancel</Button>
              <Button size="sm" variant="dark" onClick={runCheck} disabled={!file || busy === "check"}>
                {busy === "check" ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                {busy === "check" ? "Checking…" : "Check file"}
              </Button>
            </>
          )}

          {step === "report" && (
            <>
              <Button size="sm" variant="outline-secondary" onClick={() => setStep("pick")} disabled={busy === "import"}>
                Fix and re-upload
              </Button>
              <Button size="sm" variant="dark" onClick={runImport} disabled={!importable || busy === "import"}>
                {busy === "import" ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                Import {importable} product{importable === 1 ? "" : "s"}
              </Button>
            </>
          )}

          {step === "done" && (
            <>
              {importResult?.importId && (
                <Button size="sm" variant="outline-danger" onClick={handleUndo} disabled={busy === "undo"}>
                  <Undo2 size={14} className="me-1" /> {busy === "undo" ? "Undoing…" : "Undo this import"}
                </Button>
              )}
              <Button size="sm" variant="dark" onClick={onHide}>Done</Button>
            </>
          )}
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ShopBulkImportModal;
