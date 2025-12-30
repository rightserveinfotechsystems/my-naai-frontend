import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext.jsx";

const ProfileDropdown = ({ isOpen, onClose, onChangePassword, position = 'mobile' }) => {
  const navigate = useNavigate();
  const { user, logout, loading } = useUser();

  const handleLogout = () => {
    console.log("User logged out - navigating to login");
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

  // Fallback user data if no user is loaded
  const displayUser = user || {
    name: "Admin User",
    email: "admin@salonharmony.com",
    role: "Administrator",
    avatar: "👤"
  };

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
            <div className="fw-semibold text-dark">{displayUser.name || "Admin User"}</div>
            <div className="small text-muted">{displayUser.email || "admin@salonharmony.com"}</div>
            <div className="badge bg-info mt-2">{displayUser.role || "Administrator"}</div>
          </div>

          {/* Action Buttons */}
          <div className="d-grid gap-2">
            <button
              className=" logoutbutton btn-sm w-100"
              onClick={() => {
                onClose();
                onChangePassword();
              }}
            >
              <i className="bi bi-key me-2"></i>
              Change Password
            </button>          
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileDropdown;
