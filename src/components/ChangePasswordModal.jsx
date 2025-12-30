import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { adminAPI } from "../services/communication.jsx";

const ChangePasswordModal = ({ show, onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showModalPassword, setShowModalPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [modalErrors, setModalErrors] = useState({});
  const [modalLoading, setModalLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleModalChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (modalErrors[e.target.name]) {
      setModalErrors({ ...modalErrors, [e.target.name]: "" });
    }
  };

  const toggleModalPassword = (field) => {
    setShowModalPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateModalForm = () => {
    const newErrors = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword.trim() || formData.newPassword.length < 8) {
      newErrors.newPassword = "New password must be at least 8 characters";
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setModalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!validateModalForm()) return;

    setModalLoading(true);

    const result = await adminAPI.changePassword({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword
    });

    if (result.success) {
      setSuccessMsg("Password changed successfully!");
      toast.success("Password changed successfully!");

      setTimeout(() => {
        onClose();
        setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setSuccessMsg("");
        setModalErrors({});
      }, 2000);
    } else {
      toast.error(result.message || "Password change failed");

      if (result.error?.errors) {
        setModalErrors(result.error.errors);
      } else {
        setModalErrors({ submit: result.message });
      }
    }
    setModalLoading(false);
  };

  const closeModal = () => {
    setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setModalErrors({});
    setSuccessMsg("");
    onClose();
  };

  if (!show) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      tabIndex="-1"
      onClick={closeModal}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content">
          <div className="modal-header d-flex justify-content-between align-items-start">
            <h5 className="modal-title fw-bold">Change Password</h5>
            <button
              type="button"
              className="btn-close"
              onClick={closeModal}
            />
          </div>

          <div className="modal-body">
            {successMsg && (
              <div className="alert alert-success alert-dismissible fade show" role="alert">
                {successMsg}
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSuccessMsg("")}
                />
              </div>
            )}

            {modalErrors.submit && (
              <div className="alert alert-danger">{modalErrors.submit}</div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="mb-3">
                <label className="form-label">Current Password <span className="text-danger">*</span></label>
                <div className="input-wrapper position-relative">
                  <input
                    type={showModalPassword.current ? "text" : "password"}
                    className={`form-input pe-5 ${modalErrors.currentPassword ? 'is-invalid' : ''}`}
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleModalChange}
                    placeholder="Enter current password"
                    disabled={modalLoading}
                    autoComplete="current-password"
                  />
                  <span
                    className="password-toggle"
                    onClick={() => toggleModalPassword('current')}
                  >
                    {showModalPassword.current ? <Eye size={18} /> : <EyeOff size={18} />}
                  </span>
                </div>
                {modalErrors.currentPassword && (
                  <div className="invalid-feedback d-block">
                    {modalErrors.currentPassword}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">New Password <span className="text-danger">*</span></label>
                <div className="input-wrapper position-relative">
                  <input
                    type={showModalPassword.new ? "text" : "password"}
                    className={`form-input pe-5 ${modalErrors.newPassword ? 'is-invalid' : ''}`}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleModalChange}
                    placeholder="Enter new password (min 8 chars)"
                    disabled={modalLoading}
                    autoComplete="new-password"
                  />
                  <span
                    className="password-toggle"
                    onClick={() => toggleModalPassword('new')}
                  >
                    {showModalPassword.new ? <Eye size={18} /> : <EyeOff size={18} />}
                  </span>
                </div>
                {modalErrors.newPassword && (
                  <div className="invalid-feedback d-block">
                    {modalErrors.newPassword}
                  </div>
                )}
                <small className="form-text text-muted">Password must be at least 8 characters</small>
              </div>

              <div className="mb-4">
                <label className="form-label">Confirm New Password <span className="text-danger">*</span></label>
                <div className="input-wrapper position-relative">
                  <input
                    type={showModalPassword.confirm ? "text" : "password"}
                    className={`form-input pe-5 ${modalErrors.confirmPassword ? 'is-invalid' : ''}`}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleModalChange}
                    placeholder="Confirm new password"
                    disabled={modalLoading}
                    autoComplete="new-password"
                  />
                  <span
                    className="password-toggle"
                    onClick={() => toggleModalPassword('confirm')}
                  >
                    {showModalPassword.confirm ? <Eye size={18} /> : <EyeOff size={18} />}
                  </span>
                </div>
                {modalErrors.confirmPassword && (
                  <div className="invalid-feedback d-block">
                    {modalErrors.confirmPassword}
                  </div>
                )}
              </div>

              <div className="d-grid gap-2">
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={modalLoading}
                >
                  {modalLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closeModal}
                  disabled={modalLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
