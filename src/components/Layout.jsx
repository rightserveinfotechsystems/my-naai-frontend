import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown.jsx";

// Icons definitions (SVG)
const Icons = {
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  ),
  Scissors: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  ),
  Logout: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
  )
};

const navItems = [
  { path: "/", label: "User Management", icon: <Icons.Users /> },
  { path: "/salons", label: "Salon Management", icon: <Icons.Scissors /> },
  { path: "/bookings", label: "Booking Management", icon: <Icons.Calendar /> },
];

const Layout = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const navigate = useNavigate();


  // Profile dropdown close handler
  const handleProfileClose = () => {
    setShowProfileDropdown(false);
  };

  return (
    <div className="app-shell d-flex">
      {/* Desktop Sidebar */}
      <aside className="sidebar d-none d-md-flex flex-column p-3 gap-3 position-sticky top-0 vh-100">
        <div className="d-flex flex-column gap-2 mb-3">
          <Link  className="d-flex align-items-center gap-2 text-white fw-semibold fs-5 text-decoration-none">
            <Icons.Scissors /> Salon
          </Link>
        </div>
        <nav className="nav flex-column gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `nav-link d-flex align-items-center gap-2 ${isActive ? "active" : ""}`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto d-flex flex-column gap-2">
          {/* Profile Section */}
          <div className="d-flex align-items-center gap-3 p-2 rounded sidebar-profile">
            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                 style={{ width: '40px', height: '40px' }}>
              <span style={{ fontSize: '1.2rem' }}>👤</span>
            </div>
            <div className="flex-grow-1">
              <div className="text-white fw-medium small">Admin User</div>
              <div className="text-white-50 small">Administrator</div>
            </div>
            <button
              className="btn btn-link text-white p-0 profile-dropdown-btn"
              onClick={() => {
                console.log("Sidebar profile button clicked, current state:", showProfileDropdown);
                setShowProfileDropdown(!showProfileDropdown);
              }}
              title="Profile Options"
            >
              <i className="bi bi-chevron-down"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop Profile Dropdown - positioned outside sidebar */}
      <div className="d-none d-md-block">
        {showProfileDropdown && (
          <ProfileDropdown
            isOpen={showProfileDropdown}
            onClose={() => setShowProfileDropdown(false)}
            position="desktop"
          />
        )}
      </div>

      {/* Mobile + Desktop Main Content */}
      <div className="flex-grow-1 d-flex flex-column">
        {/* Mobile Topbar */}
        <div className="d-md-none position-relative">
          <header className="navbar bg-white shadow-sm sticky-top px-2 mobile-header-fixed">
            <div className="d-flex align-items-center justify-content-between w-100">
              <div className="d-flex align-items-center gap-2 min-w-0 flex-grow-1">
                <Link
                  to="/"
                  className="navbar-brand fw-semibold text-truncate m-0 d-flex align-items-center gap-2"
                  style={{ maxWidth: "150px", fontSize: '1rem' }}
                >
                  <Icons.Scissors /> Salon
                </Link>
              </div>

              <button
                className="btn btn-outline-secondary btn-sm flex-shrink-0 d-flex align-items-center justify-content-center profile-btn"
                onClick={() => {
                  console.log("MOBILE Profile button clicked, current state:", showProfileDropdown);
                  const newState = !showProfileDropdown;
                  console.log("Setting showProfileDropdown to:", newState);
                  setShowProfileDropdown(newState);
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  padding: '0'
                }}
                title="Profile"
              >
                <span style={{ fontSize: '1.2rem' }}>👤</span>
              </button>
            </div>
          </header>

          {/* Profile Dropdown */}
          <ProfileDropdown
            isOpen={showProfileDropdown}
            onClose={() => setShowProfileDropdown(false)}
            position="mobile"
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-grow-1">
          <div className="container-fluid">{children}</div>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="d-md-none">
          <nav className="navbar fixed-bottom bg-white border-top shadow-lg mobile-bottom-nav">
            <div className="container-fluid d-flex justify-content-around align-items-center px-2">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `nav-link text-center p-2 mobile-nav-item ${isActive ? "active" : ""}`
                }
              >
                <div className="d-flex flex-column align-items-center">
                  <Icons.Users />
                  <small className="mt-1 nav-text">Users</small>
                </div>
              </NavLink>

              <NavLink
                to="/salons"
                className={({ isActive }) =>
                  `nav-link text-center p-2 mobile-nav-item ${isActive ? "active" : ""}`
                }
              >
                <div className="d-flex flex-column align-items-center">
                  <Icons.Scissors />
                  <small className="mt-1 nav-text">Salons</small>
                </div>
              </NavLink>

              <NavLink
                to="/bookings"
                className={({ isActive }) =>
                  `nav-link text-center p-2 mobile-nav-item ${isActive ? "active" : ""}`
                }
              >
                <div className="d-flex flex-column align-items-center">
                  <Icons.Calendar />
                  <small className="mt-1 nav-text">Bookings</small>
                </div>
              </NavLink>
            </div>
          </nav>
        </div>
      </div>

    </div>
  );
};

export default Layout;