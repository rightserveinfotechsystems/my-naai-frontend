import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Mock user data - in real app this would come from context/state management
const mockUser = {
  name: "Admin User",
  email: "admin@salonharmony.com",
  role: "Administrator",
  avatar: "👤", // Could be an image URL in real app
  joinDate: "January 2024",
  lastLogin: "Today at 10:30 AM"
};

// Test comment to verify file is editable

const ProfileDropdown = ({ isOpen, onClose, position = 'mobile' }) => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState(null); // 'edit-profile' or 'settings'

  // Check if mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    // Handle logout logic
    console.log("User logged out - navigating to login");
    setShowLogoutConfirm(false);
    onClose();
    // Navigate to login page
    setTimeout(() => {
      navigate("/login");
    }, 100);
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  if (!isOpen) return null;


  return (
    <>
      {/* Profile Dropdown Overlay */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
        style={{ zIndex: 1060 }}
        onClick={() => {
          setActiveSection(null); // Reset active section
          onClose();
        }}
      />

      {/* Profile Dropdown Content */}
      <div
        className="bg-white rounded-3 shadow-lg border"
        style={{
          ...(position === 'mobile'
            ? {
                position: 'fixed',
                top: '70px',
                right: '10px',
                width: '280px',
                height: 'calc(70vh - 70px)', 
                minHeight: activeSection ? '500px' : 'auto'
              }
            : {
                position: 'fixed',
                top: '80px', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                width: '320px', 
                height: 'calc(60vh - 80px)', 
                minHeight: activeSection ? '500px' : 'auto',
                zIndex: 9999
              }
          ),
          zIndex: 9999,
          overflowY: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}
      >
        {/* User Info Header */}
        <div className="p-3 border-bottom bg-light rounded-top-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="bg-white text-white rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '50px', height: '50px', fontSize: '1.5rem' }}
            >
              {mockUser.avatar}
            </div>
            <div className="flex-grow-1">
              <h6 className="mb-0 fw-bold">{mockUser.name}</h6>
              <small className="text-muted">{mockUser.email}</small>
            </div>
          </div>
        </div>

        {/* Inline Content Sections */}
        {activeSection === 'edit-profile' && (
          <div className="p-3 border-bottom">
            {/* <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="mb-0 fw-bold">Edit Profile</h6>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setActiveSection(null)}
              >
                <i className="bi bi-arrow-left me-1"></i>
                Back
              </button>
            </div> */}
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label small fw-medium">Name</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  defaultValue={mockUser.name}
                  placeholder="Enter your name"
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-medium">Email</label>
                <input
                  type="email"
                  className="form-control form-control-sm"
                  defaultValue={mockUser.email}
                  placeholder="Enter your email"
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-medium">Role</label>
                <select className="form-select form-select-sm" defaultValue={mockUser.role}>
                  <option value="Administrator">Administrator</option>
                  <option value="Manager">Manager</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>
              <div className="col-12">
                <button className="btn btn-primary btn-sm w-100">
                  <i className="bi bi-check-circle me-2"></i>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="p-3 border-bottom">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="mb-0 fw-bold">Settings</h6>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setActiveSection(null)}
              >
                <i className="bi bi-arrow-left me-1"></i>
                Back
              </button>
            </div>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label small fw-medium">Notifications</label>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" defaultChecked />
                  <label className="form-check-label small">Email notifications</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" defaultChecked />
                  <label className="form-check-label small">Push notifications</label>
                </div>
              </div>
              <div className="col-12">
                <label className="form-label small fw-medium">Theme</label>
                <select className="form-select form-select-sm">
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label small fw-medium">Language</label>
                <select className="form-select form-select-sm">
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="es">Spanish</option>
                </select>
              </div>
              <div className="col-12">
                <button className="btn btn-primary btn-sm w-100">
                  <i className="bi bi-check-circle me-2"></i>
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Details - Only show when no section is active */}
        {!activeSection && (
          <div className="p-3">
            <div className="mb-3">
              <div className="row g-2">
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted small">Role</span>
                    <span className="fw-medium small">{mockUser.role}</span>
                  </div>
                </div>
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted small">Member Since</span>
                    <span className="fw-medium small">{mockUser.joinDate}</span>
                  </div>
                </div>
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted small">Last Login</span>
                    <span className="fw-medium small">{mockUser.lastLogin}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-grid gap-2">
              {/* <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => {
                  console.log("Edit Profile clicked");
                  setActiveSection('edit-profile');
                }}
              >
                <i className="bi bi-pencil me-2"></i>
                Edit Profile
              </button> */}

              {/* <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  console.log("Settings clicked");
                  setActiveSection('settings');
                }}
              >
                <i className="bi bi-gear me-2"></i>
                Settings
              </button> */}

              <hr className="my-2" />

              <button
                className="btn btn-outline-danger btn-sm w-100"
                onClick={() => {
                  console.log("Logout button clicked");
                  handleLogoutClick();
                }}
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title">Confirm Logout</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleLogoutCancel}
                />
              </div>
              <div className="modal-body py-4 text-center">
                <p className="mb-0 fs-5">Are you sure you want to logout?</p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-secondary px-4"
                  onClick={handleLogoutCancel}
                >
                  No
                </button>
                <button
                  type="submit"
                  className="btn btn-danger px-4"
                  onClick={handleLogoutConfirm}
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileDropdown;
