import { useCallback, useEffect, useState } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Tags, AlertTriangle } from "lucide-react";
import { shopCategoryAPI } from "../services/communication.jsx";

/**
 * The shop's category list — the one the website and the app read.
 *
 * Everything here writes to `shop_categories` through `/api/shop-categories/admin/*`,
 * so a category added in this dialog appears in the customer's filter on the next
 * load, with this label and this position, and with no deploy.
 *
 * Three rules the dialog makes visible instead of surprising:
 *
 *   · ORDER IS THE CUSTOMER'S ORDER. The arrows write `sortOrder`; there is no
 *     separate "display order" to keep in step.
 *   · RENAMING CHANGES ONLY THE LABEL. The id is a slug fixed at creation and the
 *     products store it, so the dialog says so rather than implying the web
 *     address moved.
 *   · DELETING A CATEGORY IN USE IS REFUSED. The API answers with the count; the
 *     dialog then asks where to move those products and retries with `reassignTo`.
 *     A category deleted out from under a product is exactly the "wrong shelf"
 *     complaint this whole feature exists to fix.
 */
const ShopCategoriesModal = ({ show, onHide, onChanged }) => {
  const [categories, setCategories] = useState([]);
  const [unmatched, setUnmatched] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newLabel, setNewLabel] = useState("");
  const [editing, setEditing] = useState(null); // { id, label }
  const [deleteTarget, setDeleteTarget] = useState(null); // category awaiting a decision
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
    // The product list shows the label, and the product editor's select is fed
    // from this list — refresh both.
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

  /**
   * Move a category up or down one place. The two rows swap `sortOrder`; when
   * two rows already share a position the list is renumbered first so a swap
   * always changes something.
   */
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
        // The refusal names the count; keep the dialog open offering the move.
        toast.error(result.message || "Could not delete the category");
      }
    } finally {
      setSaving(false);
    }
  };

  const otherCategories = categories.filter((item) => item.id !== deleteTarget?.id);

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
      <Modal.Header closeButton className="border-0 pb-0">
        <div>
          <Modal.Title className="h5 mb-1 d-flex align-items-center gap-2">
            <Tags size={18} /> Categories
          </Modal.Title>
          <div className="text-muted small">
            This list <strong>is</strong> the shop's filter — the website and the app read it, in this order.
          </div>
        </div>
      </Modal.Header>

      <Modal.Body className="pt-3">
        {loading ? (
          <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table align-middle mb-2" style={{ fontSize: "0.9rem" }}>
                <thead>
                  <tr className="text-muted small" style={{ textTransform: "uppercase", letterSpacing: "0.4px" }}>
                    <th style={{ width: 76 }}>Order</th>
                    <th>Category</th>
                    <th className="text-end">Products</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category, index) => (
                    <tr key={category.id} className={category.isActive ? "" : "opacity-75"}>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-light border"
                            title="Move up"
                            disabled={saving || index === 0}
                            onClick={() => handleMove(index, -1)}
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            className="btn btn-sm btn-light border"
                            title="Move down"
                            disabled={saving || index === categories.length - 1}
                            onClick={() => handleMove(index, 1)}
                          >
                            <ArrowDown size={13} />
                          </button>
                        </div>
                      </td>
                      <td>
                        {editing?.id === category.id ? (
                          <div className="d-flex gap-2">
                            <Form.Control
                              size="sm"
                              autoFocus
                              value={editing.label}
                              onChange={(event) => setEditing({ ...editing, label: event.target.value })}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") handleRename();
                                if (event.key === "Escape") setEditing(null);
                              }}
                            />
                            <Button size="sm" variant="dark" onClick={handleRename} disabled={saving}>Save</Button>
                            <Button size="sm" variant="outline-secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
                          </div>
                        ) : (
                          <div>
                            <div className="fw-semibold d-flex align-items-center gap-2">
                              {category.label}
                              {!category.isActive && <span className="badge bg-secondary-subtle text-secondary-emphasis">Hidden</span>}
                            </div>
                            {/* The id is what products store — say it once, here. */}
                            <div className="text-muted small">
                              stays <code>{category.id}</code> if you rename it
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="text-end">
                        {category.productCount > 0
                          ? category.productCount
                          : <span className="text-muted">0</span>}
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <button
                            className="btn btn-sm btn-light border"
                            title={category.isActive ? "Hide from the shop filter" : "Show in the shop filter"}
                            disabled={saving}
                            onClick={() => handleToggleActive(category)}
                          >
                            {category.isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <button
                            className="btn btn-sm btn-light border"
                            title="Rename"
                            disabled={saving}
                            onClick={() => setEditing({ id: category.id, label: category.label })}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            title="Delete"
                            disabled={saving}
                            onClick={() => { setDeleteTarget(category); setMoveTo(""); }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Products filed under free text that no category owns — the list an
                admin works through to finish the tidy-up. */}
            {unmatched.length > 0 && (
              <div className="alert alert-warning py-2 px-3 small mb-3">
                <div className="fw-semibold mb-1 d-flex align-items-center gap-1">
                  <AlertTriangle size={14} /> {unmatched.length} product value{unmatched.length === 1 ? "" : "s"} not in this list
                </div>
                {unmatched.map((item) => (
                  <div key={item.value}>
                    <code>{item.value}</code> — {item.productCount} product{item.productCount === 1 ? "" : "s"}
                  </div>
                ))}
                <div className="mt-1">Open those products and pick a category; the extra filter chip disappears with them.</div>
              </div>
            )}

            <Form onSubmit={handleCreate} className="d-flex gap-2">
              <Form.Control
                size="sm"
                placeholder="New category — e.g. Nail care"
                value={newLabel}
                maxLength={120}
                onChange={(event) => setNewLabel(event.target.value)}
              />
              <Button type="submit" size="sm" variant="dark" disabled={saving || newLabel.trim().length < 2}>
                <Plus size={14} className="me-1" /> Add
              </Button>
            </Form>
          </>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0">
        <Button variant="secondary" onClick={onHide}>Done</Button>
      </Modal.Footer>

      {/* Deleting a category with products: the API refuses, so the dialog asks
          where they should go and only then deletes. */}
      <Modal show={Boolean(deleteTarget)} onHide={() => setDeleteTarget(null)} centered backdrop="static">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h6 mb-0">Delete "{deleteTarget?.label}"?</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          {deleteTarget?.productCount > 0 ? (
            <>
              <p className="small mb-2">
                <strong>{deleteTarget.productCount} product{deleteTarget.productCount === 1 ? "" : "s"}</strong> use
                this category. Choose where to move them — a product left on a category that no longer exists
                disappears from the shelf.
              </p>
              <Form.Select size="sm" value={moveTo} onChange={(event) => setMoveTo(event.target.value)}>
                <option value="">Move them to…</option>
                {otherCategories.map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </Form.Select>
            </>
          ) : (
            <p className="small mb-0">Nothing uses this category, so it can be removed safely.</p>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" size="sm" onClick={() => setDeleteTarget(null)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={saving || (deleteTarget?.productCount > 0 && !moveTo)}
            onClick={() => handleDelete(moveTo)}
          >
            {deleteTarget?.productCount > 0 && moveTo ? "Move products and delete" : "Delete category"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Modal>
  );
};

export default ShopCategoriesModal;
