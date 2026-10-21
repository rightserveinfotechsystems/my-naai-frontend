import { useState, useEffect } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { distributorAPI } from "../services/communication";
import { toast } from "react-toastify";
import LocationField from "./LocationField.jsx";
import { toPoint } from "../utils/geo";

const DistributorModal = ({ showModal, setShowModal, initialDistributor = null, onSuccess }) => {
  const isEdit = Boolean(initialDistributor);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    area: "",
    deliveryCapability: "",
    address: "",
    password: "",
    // The dispatch pin. Kept as an object (not two loose strings) so "no
    // location" is one null instead of two empty inputs.
    location: null
  });

  useEffect(() => {
    if (showModal) {
      if (initialDistributor) {
        setFormData({
          name: initialDistributor.name || "",
          phone: initialDistributor.phone || "",
          email: initialDistributor.email || "",
          area: initialDistributor.area || "",
          deliveryCapability: initialDistributor.deliveryCapability || "",
          address: initialDistributor.address || "",
          password: "",
          location: toPoint({ latitude: initialDistributor.latitude, longitude: initialDistributor.longitude })
        });
      } else {
        setFormData({ name: "", phone: "", email: "", area: "", deliveryCapability: "", address: "", password: "", location: null });
      }
    }
  }, [showModal, initialDistributor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleModalClose = () => setShowModal(false);

  const handleLocationChange = (next) => {
    setFormData((prev) => ({ ...prev, location: next }));
  };

  // Both halves or neither. The backend rejects a lone latitude, and a pin
  // with one leg is worse than no pin: it silently drops out of every sort.
  const locationPayload = () => {
    if (!formData.location) return { latitude: null, longitude: null };
    return { latitude: formData.location.latitude, longitude: formData.location.longitude };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || null,
      area: formData.area.trim() || null,
      deliveryCapability: formData.deliveryCapability.trim() || null,
      address: formData.address.trim() || null,
      ...locationPayload()
    };
    if (!payload.name) { toast.error("Distributor name is required"); return; }
    if (!payload.phone) { toast.error("Phone number is required (distributors log in with it)"); return; }

    if (isEdit) {
      // Send password only when the admin typed a new one; '' clears the stored password.
      payload.password = formData.password;
    } else {
      if (!formData.password) { toast.error("Set a login password (min 6 characters)"); return; }
      if (formData.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
      payload.password = formData.password;
    }

    setIsLoading(true);
    try {
      const result = isEdit
        ? await distributorAPI.update({ distributorId: initialDistributor.distributorId, ...payload })
        : await distributorAPI.create(payload);
      if (result.success) {
        toast.success(isEdit ? "Distributor updated" : "Distributor added");
        onSuccess?.();
      } else {
        toast.error(result.message || "Failed to save distributor");
      }
    } catch {
      toast.error("Failed to save distributor");
    } finally {
      setIsLoading(false);
    }
  };

  if (!showModal) return null;

  return (
    <Modal show={showModal} onHide={handleModalClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">
          {isEdit ? "Edit Distributor" : "Add Distributor"}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {/* Flex instead of row/col: the panel's CSS build does not carry
              the Bootstrap grid utilities, so widths are inline. */}
          <div className="d-flex flex-wrap gap-3">
            <div style={{ flex: "1 1 240px", minWidth: 0 }}>
              <Form.Label className="fw-semibold small">Name *</Form.Label>
              <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Ravi Gupta" required />
            </div>
            <div style={{ flex: "1 1 240px", minWidth: 0 }}>
              <Form.Label className="fw-semibold small">Phone *</Form.Label>
              <Form.Control type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="10-digit mobile number" required />
            </div>
            <div style={{ flex: "1 1 240px", minWidth: 0 }}>
              <Form.Label className="fw-semibold small">Email (used as an alternate login ID)</Form.Label>
              <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} placeholder="optional" />
            </div>
            <div style={{ flex: "1 1 240px", minWidth: 0 }}>
              <Form.Label className="fw-semibold small">Area / City</Form.Label>
              <Form.Control type="text" name="area" value={formData.area} onChange={handleChange} placeholder="e.g. Nagpur, Maharashtra" />
            </div>
            <div style={{ flex: "1 1 240px", minWidth: 0 }}>
              <Form.Label className="fw-semibold small">Delivery Capability</Form.Label>
              <Form.Control type="text" name="deliveryCapability" value={formData.deliveryCapability} onChange={handleChange} placeholder="e.g. Same-day within 20km, 2-wheelers x2" />
            </div>
            <div style={{ flex: "1 1 240px", minWidth: 0 }}>
              <Form.Label className="fw-semibold small">
                {isEdit ? "New Password (leave blank to keep the old one)" : "Login Password *"}
              </Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isEdit ? "min 6 characters" : "min 6 characters"}
                autoComplete="new-password"
              />
            </div>
            <div style={{ flex: "1 1 100%", minWidth: 0 }}>
              <Form.Label className="fw-semibold small">Address</Form.Label>
              <Form.Control as="textarea" rows={2} name="address" value={formData.address} onChange={handleChange} placeholder="Warehouse / pickup address" />
            </div>

            {/* Dispatch location. This is the point every "how far is the
                delivery?" number is measured from, so it belongs in the same
                form as the name and phone — not in a follow-up step nobody
                completes. */}
            <div style={{ flex: "1 1 100%", minWidth: 0 }}>
              <LocationField
                label="Distributor location"
                helper="Pickup / base point on the map. The admin panel shows every delivery at this distance from it, nearest first."
                value={formData.location}
                onChange={handleLocationChange}
                disabled={isLoading}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleModalClose} disabled={isLoading}>Cancel</Button>
          <Button variant="success" type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : isEdit ? "Update Distributor" : "Add Distributor"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default DistributorModal;
