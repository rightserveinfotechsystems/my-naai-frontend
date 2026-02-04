import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext.jsx";

// Helper function to format date and time as dd/mm/yyyy hh:mm AM/PM
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  hours = String(hours).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
};

const ProfileDropdown = ({ isOpen, onClose, onChangePassword, position = 'mobile' }) => {
  const navigate = useNavigate();
  const { user, logout, loading } = useUser();
  const [showAdminDetails, setShowAdminDetails] = useState(false);

  const handleLogout = () => {
    onClose();
    logout();
    setTimeout(() => {
      navigate("/login");
    }, 100);
  };

  // Show loading state if user data is being fetched
  if (loading) {
    return (
      <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50" style={{ zIndex: 1060 }}>
        <div className="d-flex justify-content-center align-items-center h-100">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  const displayUser = user || {}; 

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
        style={{ zIndex: 1060 }}
        onClick={onClose}
      />

      {/* Dropdown Content */}
      <div
        className="bg-white rounded-3 shadow-lg border"
        style={{
          ...(position === 'mobile'
            ? {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '350px',
                maxHeight: '70vh'
              }
            : {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '400px',
                maxHeight: '80vh',
                zIndex: 9999
              }
          ),
          zIndex: 9999,
          overflowY: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}
      >
        {/* User Info and Actions */}
        <div className="p-3">
          {/* User Info */}
          <div className="text-center mb-3 pb-3 border-bottom">
            <div className="fs-4 mb-1">{displayUser.avatar || "👤"}</div>
            <div className="fw-semibold text-dark">{displayUser?.name || ""}</div>
            <div className="small text-muted">{displayUser?.email || ""}</div>
            {/* <div
              className="badge bg-info mt-2 cursor-pointer"
              style={{ cursor: 'pointer' }}
              onClick={() => setShowAdminDetails(!showAdminDetails)}
            >
              {displayUser.role || "Administrator"}
              <i className={`bi ms-1 ${showAdminDetails ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
            </div> */}
          </div>

          {/* Administrator Information - Collapsible */}
          {/* {showAdminDetails && (
            <div className="mb-3 pb-3 border-bottom text-center">
              <div className="small text-muted fw-semibold mb-2 text-center">Administrator Details</div>
              <div className="small text-muted mb-1">
                <i className="bi bi-clock-history me-1"></i>
                Last Login: {formatDate(displayUser.lastLogin)}
              </div>
              <div className="small text-muted mb-1">
                <i className="bi bi-calendar-plus me-1"></i>
                Created: {formatDate(displayUser.createdAt)}
              </div>
              <div className="small text-muted">
                <i className="bi bi-pencil-square me-1"></i>
                Updated: {formatDate(displayUser.updatedAt)}
              </div>
            </div>
          )} */}

          {/* Action Buttons */}
          <div className="d-grid gap-2">
            <button
              className="logoutbutton btn-sm w-100"
              onClick={() => {
                onClose();
                onChangePassword();
              }}
            >
              <i className="bi bi-key me-2"></i>
              Change Password
            </button>          
          </div>

          {/* Logout Button (fixed for mobile/desktop) */}
          <div className="p-3 border-top ">
            <button
              className="logoutbutton btn-sm w-100"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileDropdown;
