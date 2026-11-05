import { useCallback, useEffect, useState } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Tags, AlertTriangle } from "lucide-react";
import { shopCategoryAPI } from "../services/communication.jsx";

const ShopCategoriesModal = ({ show, onHide, onChanged }) => {
  const [categories, setCategories] = useState([]);
  const [unmatched, setUnmatched] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newLabel, setNewLabel] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [moveTo, setMoveTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await shopCategoryAPI.list();
      if (result.success) {
        setCategories(result.data?.categories || []);
        setUnmatched(result.data?.unmatched || []);
      } else {
        toast.error(result.message || "Could not load the categories");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (show) {
      load();
      setEditing(null);
      setNewLabel("");
      setDeleteTarget(null);
      setMoveTo("");
    }
  }, [show, load]);

  const afterChange = () => {
    load();
    onChanged?.();
  };

  const handleCreate = async (event) => {
    event?.preventDefault();
    const label = newLabel.trim();
    if (label.length < 2) {
      toast.error("A category name needs at least 2 characters");
      return;
    }
    setSaving(true);
    try {
      const result = await shopCategoryAPI.create({ label });
      if (result.success) {
        toast.success(`"${label}" added — customers see it in the shop filter`);
        setNewLabel("");
        afterChange();
      } else {
        toast.error(result.message || "Could not add the category");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRename = async () => {
    if (!editing) return;
    const label = String(editing.label || "").trim();
    if (label.length < 2) {
      toast.error("A category name needs at least 2 characters");
      return;
    }
    setSaving(true);
    try {
      const result = await shopCategoryAPI.update({ id: editing.id, label });
      if (result.success) {
        toast.success("Category renamed");
        setEditing(null);
        afterChange();
      } else {
        toast.error(result.message || "Could not rename the category");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (category) => {
    setSaving(true);
    try {
      const result = await shopCategoryAPI.update({ id: category.id, isActive: !category.isActive });
      if (result.success) {
        toast.success(category.isActive
          ? `"${category.label}" hidden from the shop filter — its products keep it`
          : `"${category.label}" shown in the shop filter again`);
        afterChange();
      } else {
        toast.error(result.message || "Could not update the category");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const current = categories[index];
    const neighbour = categories[target];
    setSaving(true);
    try {
      const first = await shopCategoryAPI.update({ id: current.id, sortOrder: neighbour.sortOrder });
      const second = first.success
        ? await shopCategoryAPI.update({ id: neighbour.id, sortOrder: current.sortOrder })
        : { success: false };
      if (first.success && second.success) {
        afterChange();
      } else {
        toast.error(first.message || second.message || "Could not change the order");
        load();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reassignTo) => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const result = await shopCategoryAPI.remove({ id: deleteTarget.id, reassignTo: reassignTo || undefined });
      if (result.success) {
        toast.success(result.message || "Category deleted");
        setDeleteTarget(null);
        setMoveTo("");
        afterChange();
      } else {
        toast.error(result.message || "Could not delete the category");
      }
    } finally {
      setSaving(false);
    }
  };

  const otherCategories = categories.filter((item) => item.id !== deleteTarget?.id);

  return (
    <>
      <Modal show={show} onHide={onHide} centered size="lg" backdrop="static" scrollable>
        <Modal.Header closeButton className="border-0 pb-0">
          <div className="pe-3">
            <Modal.Title className="d-flex align-items-center gap-2 fs-5">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-3"
                style={{ width: 36, height: 36, background: "#eef2ff", color: "#4f46e5" }}
              >
                <Tags size={18} />
              </span>
              Manage categories
            </Modal.Title>
            <div className="text-muted small mt-2">
              Organise the categories customers see in your shop.
            </div>
          </div>
        </Modal.Header>

        <Modal.Body className="pt-3">
          <section
            className="rounded-3 p-3 mb-3"
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
          >
            <div className="fw-semibold mb-2">Add a category</div>
            <Form onSubmit={handleCreate}>
              <div className="d-flex flex-column flex-sm-row gap-2">
                <Form.Control
                  value={newLabel}
                  maxLength={120}
                  placeholder="Enter category name (e.g. Nail care)"
                  aria-label="New category name"
                  onChange={(event) => setNewLabel(event.target.value)}
                  disabled={saving}
                />
                <Button
                  type="submit"
                  variant="dark"
                  className="d-flex align-items-center justify-content-center gap-1 px-3"
                  disabled={saving || newLabel.trim().length < 2}
                >
                  <Plus size={16} />
                  Add category
                </Button>
              </div>
              <div className="text-muted mt-2" style={{ fontSize: "0.78rem" }}>
                Category names must contain at least 2 characters.
              </div>
            </Form>
          </section>

          <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
            <div>
              <div className="fw-semibold">Your categories</div>
              <div className="text-muted small">
                {categories.length} {categories.length === 1 ? "category" : "categories"} · Use arrows to change display order.
              </div>
            </div>
            {categories.length > 0 && (
              <span className="badge rounded-pill text-bg-light border fw-normal">
                {categories.filter((item) => item.isActive).length} visible
              </span>
            )}
          </div>

          {loading ? (
            <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
              <Spinner animation="border" size="sm" className="mb-2" />
              <span className="small">Loading categories…</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center rounded-3 py-5 px-3" style={{ border: "1px dashed #cbd5e1" }}>
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
                style={{ width: 48, height: 48, background: "#f1f5f9", color: "#64748b" }}
              >
                <Tags size={22} />
              </div>
              <div className="fw-semibold">No categories yet</div>
              <div className="text-muted small mt-1">Add your first category using the form above.</div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className="rounded-3 p-3"
                  style={{
                    border: "1px solid #e2e8f0",
                    background: category.isActive ? "#fff" : "#f8fafc",
                    opacity: category.isActive ? 1 : 0.8
                  }}
                >
                  <div className="d-flex align-items-start gap-2">
                    <div className="d-flex flex-column gap-1 flex-shrink-0">
                      <button
                        type="button"
                        className="btn btn-sm btn-light border d-flex align-items-center justify-content-center"
                        style={{ width: 30, height: 28, padding: 0 }}
                        title="Move up"
                        aria-label={`Move ${category.label} up`}
                        disabled={saving || index === 0}
                        onClick={() => handleMove(index, -1)}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-light border d-flex align-items-center justify-content-center"
                        style={{ width: 30, height: 28, padding: 0 }}
                        title="Move down"
                        aria-label={`Move ${category.label} down`}
                        disabled={saving || index === categories.length - 1}
                        onClick={() => handleMove(index, 1)}
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>

                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      {editing?.id === category.id ? (
                        <div className="d-flex flex-column flex-sm-row gap-2">
                          <Form.Control
                            size="sm"
                            autoFocus
                            value={editing.label}
                            aria-label="Category name"
                            onChange={(event) => setEditing({ ...editing, label: event.target.value })}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") handleRename();
                              if (event.key === "Escape") setEditing(null);
                            }}
                          />
                          <div className="d-flex gap-2">
                            <Button size="sm" variant="dark" onClick={handleRename} disabled={saving}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline-secondary" onClick={() => setEditing(null)} disabled={saving}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="d-flex flex-wrap align-items-center gap-2">
                            <span className="fw-semibold text-break">{category.label}</span>
                            <span className={`badge rounded-pill ${category.isActive ? "text-bg-success" : "text-bg-secondary"}`}>
                              {category.isActive ? "Visible" : "Hidden"}
                            </span>
                          </div>
                          <div className="d-flex flex-wrap align-items-center gap-2 mt-1 text-muted small">
                            <span>{category.productCount || 0} {(category.productCount || 0) === 1 ? "product" : "products"}</span>
                            <span aria-hidden="true">·</span>
                            <span>Category ID: <code>{category.id}</code></span>
                          </div>
                        </>
                      )}
                    </div>

                    {editing?.id !== category.id && (
                      <div className="d-flex align-items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          className="btn btn-sm btn-light border d-flex align-items-center justify-content-center"
                          style={{ width: 34, height: 34, padding: 0 }}
                          title={category.isActive ? "Hide category" : "Show category"}
                          aria-label={category.isActive ? `Hide ${category.label}` : `Show ${category.label}`}
                          disabled={saving}
                          onClick={() => handleToggleActive(category)}
                        >
                          {category.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-light border d-flex align-items-center justify-content-center"
                          style={{ width: 34, height: 34, padding: 0 }}
                          title="Rename category"
                          aria-label={`Rename ${category.label}`}
                          disabled={saving}
                          onClick={() => setEditing({ id: category.id, label: category.label })}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center"
                          style={{ width: 34, height: 34, padding: 0 }}
                          title="Delete category"
                          aria-label={`Delete ${category.label}`}
                          disabled={saving}
                          onClick={() => { setDeleteTarget(category); setMoveTo(""); }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && unmatched.length > 0 && (
            <div
              className="mt-3 rounded-3 p-3"
              style={{
                background: "#fffbeb",
                border: "1px solid #fcd34d",
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box"
              }}
            >
              <div className="d-flex align-items-start gap-2 mb-3">
                <AlertTriangle size={18} color="#d97706" className="flex-shrink-0 mt-1" />

                <div style={{ minWidth: 0 }}>
                  <div className="fw-semibold text-dark">
                    Unmatched product categories
                  </div>
                  <div className="text-muted small">
                    {unmatched.length} category value{unmatched.length !== 1 ? "s" : ""} need attention.
                  </div>
                </div>
              </div>

              <div className="d-flex flex-column gap-2">
                {unmatched.map((item, index) => (
                  <div
                    key={`${item.value}-${index}`}
                    className="d-flex align-items-center justify-content-between gap-3 rounded-2 px-3 py-2"
                    style={{
                      background: "#ffffff",
                      border: "1px solid #f3e8c8",
                      minWidth: 0,
                      width: "100%",
                      boxSizing: "border-box"
                    }}
                  >
                    <div
                      className="fw-medium text-dark"
                      style={{
                        minWidth: 0,
                        flex: "1 1 auto",
                        overflowWrap: "anywhere",
                        fontSize: "0.875rem"
                      }}
                    >
                      {item.value}
                    </div>

                    <div className="flex-shrink-0">
                      <span
                        className="rounded-pill px-2 py-1"
                        style={{
                          background: "#f1f5f9",
                          color: "#475569",
                          fontSize: "0.75rem",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {item.productCount} {item.productCount === 1 ? "product" : "products"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-muted small mt-3">
                Edit these products and assign them to an existing category.
                This will remove the unmatched values from this list.
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={onHide}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={Boolean(deleteTarget)} onHide={() => setDeleteTarget(null)} centered backdrop="static">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-6">Delete category?</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          <div className="fw-semibold mb-2">{deleteTarget?.label}</div>
          {deleteTarget?.productCount > 0 ? (
            <>
              <div className="small text-muted mb-3">
                {deleteTarget.productCount} {deleteTarget.productCount === 1 ? "product is" : "products are"} assigned to this category. Choose another category before deleting.
              </div>
              <Form.Select
                value={moveTo}
                onChange={(event) => setMoveTo(event.target.value)}
                aria-label="Move products to category"
              >
                <option value="">Select destination category</option>
                {otherCategories.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </Form.Select>
            </>
          ) : (
            <div className="small text-muted">This category has no products and can be safely deleted.</div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" size="sm" onClick={() => setDeleteTarget(null)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={saving || (deleteTarget?.productCount > 0 && !moveTo)}
            onClick={() => handleDelete(moveTo)}
          >
            {saving ? <Spinner animation="border" size="sm" className="me-1" /> : null}
            {deleteTarget?.productCount > 0 && moveTo ? "Move products & delete" : "Delete category"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ShopCategoriesModal;
