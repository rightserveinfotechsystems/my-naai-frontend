import { useState, useEffect } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { distributorAPI } from "../services/communication";
import { toast } from "react-toastify";
import LocationField from "./LocationField.jsx";
import { toPoint } from "../utils/geo";
import { User, Phone, Mail, MapPin, Truck, Lock, Navigation } from "lucide-react";

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
    <Modal show={showModal} onHide={handleModalClose} centered size="lg" className="distributor-modal">
      <Modal.Header closeButton className="border-bottom px-4 py-3 bg-light">
        <Modal.Title className="fw-bold fs-5 d-flex align-items-center gap-2 text-dark">
          <Truck size={20} className="text-success" />
          {isEdit ? "Edit Distributor Profile" : "Add New Distributor"}
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-4" style={{ maxHeight: "75vh", overflowY: "auto", overflowX: "hidden" }}>
          <div className="container-fluid px-0">
            <div className="row g-3">
              
              {/* Section 1: Basic Credentials */}
              <div className="col-12">
                <h6 className="text-muted text-uppercase small fw-bold mb-2">1. Basic Information</h6>
              </div>

              <div className="col-12 col-md-6">
                <Form.Label className="fw-semibold small">Name *</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-white text-muted"><User size={16} /></span>
                  <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Ravi Gupta" required />
                </div>
              </div>
              
              <div className="col-12 col-md-6">
                <Form.Label className="fw-semibold small">Phone (Login ID) *</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-white text-muted"><Phone size={16} /></span>
                  <Form.Control type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="10-digit mobile number" required />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <Form.Label className="fw-semibold small">Email Address</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-white text-muted"><Mail size={16} /></span>
                  <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} placeholder="optional alternate login" />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <Form.Label className="fw-semibold small">
                  {isEdit ? "New Password (leave blank to keep)" : "Login Password *"}
                </Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-white text-muted"><Lock size={16} /></span>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="min 6 characters"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Section 2: Operational Details */}
              <div className="col-12 mt-4">
                <h6 className="text-muted text-uppercase small fw-bold mb-2">2. Logistics & Coverage</h6>
              </div>

              <div className="col-12 col-md-6">
                <Form.Label className="fw-semibold small">Area / City</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-white text-muted"><MapPin size={16} /></span>
                  <Form.Control type="text" name="area" value={formData.area} onChange={handleChange} placeholder="e.g. Nagpur, Maharashtra" />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <Form.Label className="fw-semibold small">Delivery Capability</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-white text-muted"><Truck size={16} /></span>
                  <Form.Control type="text" name="deliveryCapability" value={formData.deliveryCapability} onChange={handleChange} placeholder="e.g. Same-day within 20km" />
                </div>
              </div>

              <div className="col-12">
                <Form.Label className="fw-semibold small">Warehouse Address</Form.Label>
                <Form.Control as="textarea" rows={2} name="address" value={formData.address} onChange={handleChange} placeholder="Full physical pickup address" />
              </div>

              {/* Section 3: Live Map Location - Forced 100% block layout */}
              <div className="col-12 mt-4" style={{ width: "100%", flex: "0 0 100%" }}>
                <h6 className="text-muted text-uppercase small fw-bold mb-2 d-flex align-items-center gap-1">
                  <Navigation size={14} /> 3. Base Location Pin
                </h6>
                <div className="p-3 bg-white rounded-3 border shadow-sm" style={{ width: "100%", display: "block" }}>
                  <div style={{ width: "100%", maxWidth: "100%", display: "block" }}>
                    <LocationField
                      label="Distributor Location"
                      helper="Pickup / base point on the map. Used to calculate nearest salon delivery distances."
                      value={formData.location}
                      onChange={handleLocationChange}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="border-top px-4 py-3 bg-light">
          <Button variant="outline-secondary" size="sm" onClick={handleModalClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="success" size="sm" type="submit" disabled={isLoading} className="px-4">
            {isLoading ? "Saving..." : isEdit ? "Update Distributor" : "Save Distributor"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default DistributorModal;