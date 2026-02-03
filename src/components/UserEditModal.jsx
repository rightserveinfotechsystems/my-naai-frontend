import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { adminPanelUsersAPI } from "../services/communication.jsx";
import { TabArray } from "../utils/TabArray.js";

const UserEditModal = ({
  showModal,
  setShowModal,
  modalMode,
  editingUserId,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    accessTab: [],
  });

  /* ===================== LOAD USER DATA (EDIT) ===================== */
  useEffect(() => {
    const loadUserData = async () => {
      if (!showModal) return;

      if (modalMode === "edit" && editingUserId) {
        try {
          const result = await adminPanelUsersAPI.getAdminPanelUserById(editingUserId);

          if (result.success && result.data) {
            const user = result.data;

            setFormData({
              name: user.name || "",
              mobile: user.mobile || "",
              email: user.email || "",
              password: "",
              accessTab: Array.isArray(user.accessTab) ? user.accessTab : [],
            });
          } else {
            toast.error(result.message || "Failed to load user data");
          }
        } catch (err) {
          console.error(err);
          toast.error("Failed to load user data");
        }
      }

      if (modalMode === "add") {
        setFormData({
          name: "",
          mobile: "",
          email: "",
          password: "",
          accessTab: [],
        });
      }
    };

    loadUserData();
  }, [showModal, modalMode, editingUserId]);

  /* ===================== VALIDATION ===================== */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Please enter user name";

    if (!formData.mobile.trim()) {
      newErrors.mobile = "Please enter phone number";
    } else if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      newErrors.mobile = "Enter valid 10-digit phone number";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Please enter email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter valid email address";
    }

    if (modalMode === "add" && !formData.password.trim()) {
      newErrors.password = "Please enter password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ===================== HANDLERS ===================== */
  const handleCloseModal = () => {
    setShowModal(false);
    setIsSubmitting(false);
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        mobile: formData.mobile,
        email: formData.email,
        accessTab: formData.accessTab,
        ...(formData.password && { password: formData.password }),
      };

      let result;
      if (modalMode === "edit") {
        result = await adminPanelUsersAPI.updateAdminPanelUser(editingUserId, payload);
      } else {
        result = await adminPanelUsersAPI.createAdminPanelUser(payload);
      }

      if (result.success) {
        toast.success(
          `User ${modalMode === "edit" ? "updated" : "created"} successfully`
        );
        handleCloseModal();
        onSuccess && onSuccess();
      } else {
        toast.error(result.message || "Operation failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showModal) return null;

  /* ===================== UI ===================== */
  return (
    <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">
              {modalMode === "add" ? "Add User" : "Edit User"}
            </h5>
            <button className="btn-close" onClick={handleCloseModal} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body row g-3">

              {/* Name */}
              <div className="col-md-6">
                <label className="form-label">User Name</label>
                <input
                  className={`form-control ${errors.name ? "is-invalid" : ""}`}
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
                <div className="invalid-feedback">{errors.name}</div>
              </div>

              {/* Mobile */}
              <div className="col-md-6">
                <label className="form-label">Mobile</label>
                <input
                  className={`form-control ${errors.mobile ? "is-invalid" : ""}`}
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  maxLength={10}
                />
                <div className="invalid-feedback">{errors.mobile}</div>
              </div>

              {/* Email */}
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input
                  className={`form-control ${errors.email ? "is-invalid" : ""}`}
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                <div className="invalid-feedback">{errors.email}</div>
              </div>

              {/* Password */}
              {modalMode === "add" && (
                <div className="col-md-6">
                  <label className="form-label">Password</label>
                  <input
                    type="text"
                    className={`form-control ${errors.password ? "is-invalid" : ""}`}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                  <div className="invalid-feedback">{errors.password}</div>
                </div>
              )}

              {/* Access Tabs */}
              <div className="col-12">
                <label className="form-label fw-semibold">Access Tabs</label>
                <div className="row">
                  {TabArray.map((tab) => (
                    <div key={tab.key} className="col-md-6 form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={tab.key}
                        checked={formData.accessTab.includes(tab.key)}

                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData((prev) => ({
                            ...prev,
                            accessTab: checked
                              ? [...prev.accessTab, tab.key]
                              : prev.accessTab.filter((t) => t !== tab.key),
                          }));
                        }}
                      />
                      <label className="form-check-label" htmlFor={tab.key}>
                        {tab.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                Cancel
              </button>
              <button className="btn btn-warning" disabled={isSubmitting}>
                {isSubmitting
                  ? modalMode === "add"
                    ? "Adding..."
                    : "Updating..."
                  : modalMode === "add"
                  ? "Add User"
                  : "Update User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserEditModal;
