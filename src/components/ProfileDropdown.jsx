import { useNavigate } from "react-router-dom";

const mockUser = {
  name: "Admin User",
  email: "admin@salonharmony.com",
  role: "Administrator",
  avatar: "👤", 
};

const ProfileDropdown = ({ isOpen, onClose, position = 'mobile' }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    console.log("User logged out - navigating to login");
    onClose();
    localStorage.removeItem('token');
    setTimeout(() => {
      navigate("/login");
    }, 100);
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
                top: '70px',
                right: '10px',
                width: '280px',
                height: 'calc(70vh - 70px)'
              }
            : {
                position: 'fixed',
                top: '80px', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                width: '320px', 
                height: 'calc(60vh - 80px)',
                zIndex: 9999
              }
          ),
          zIndex: 9999,
          overflowY: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}
      >
        {/* Logout Button Only */}
        <div className="p-3">
          <div className="d-grid gap-2">
            <button
              className="btn btn-outline-danger btn-sm w-100"
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
