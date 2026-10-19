import { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import ProfileDropdown from "./ProfileDropdown.jsx";
import ChangePasswordModal from "./ChangePasswordModal.jsx";
import { useUser } from "../contexts/UserContext.jsx";
import { ClipboardList, Store, CalendarCheck, User, Users, Package, Truck, ShoppingBag, SlidersHorizontal, Menu, X } from "lucide-react";
import { salonRequestAPI } from "../services/communication.jsx";

const Icons = {
  Salon: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M20 4v16" /><path d="M15.11 14.48 20 20" /><path d="m15.11 9.52 4.89-5.48" /><circle cx="18" cy="12" r="2" /></svg>
  ),
  Users: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  Scissors: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
  ),
  Advertisement: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
  ),
  Logout: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
  ),
  Customer: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4" />
      <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
    </svg>
  ),
  Notification: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
};

const navItems = [
  { path: "/user", key: "user", label: "User Management", icon: <User size={18} /> },
  { path: "/customer", key: "customer", label: "Customer Management", icon: <Users size={18} /> },
  { path: "/salons", key: "salonManagement", label: "Salon Management", icon: <Store size={18} /> },
  { path: "/bookings", key: "bookings", label: "Booking Management", icon: <CalendarCheck size={18} /> },
  { path: "/advertisement", key: "advertisement", label: "Advertisement", icon: <Icons.Advertisement /> },
  { path: "/notifications", key: "notifications", label: "Push Notifications", icon: <Icons.Notification /> },
  { path: "/shop-products", key: "shopProducts", label: "Shop Products", icon: <Package size={18} /> },
  { path: "/distributors", key: "distributors", label: "Distributors", icon: <Truck size={18} /> },
  { path: "/shop-orders", key: "shopOrders", label: "Shop Orders", icon: <ShoppingBag size={18} /> },
  { path: "/shop-settings", key: "shopSettings", label: "Shop Settings", icon: <SlidersHorizontal size={18} /> },
];

const Layout = ({ children }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [salonRequestCount, setSalonRequestCount] = useState(0);
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);
  
  const navigate = useNavigate();
  const accessTab = JSON.parse(localStorage.getItem("accessTab")) || [];
  
  const hasAnyShopTab = ["shopProducts", "distributors", "shopOrders"].some((key) => accessTab?.includes(key));
  const filteredTabs = navItems.filter((navDetails) =>
    accessTab?.includes(navDetails.key) || (navDetails.key === "shopSettings" && hasAnyShopTab)
  );

  const primaryMobileTabs = filteredTabs.slice(0, 4);
  const overflowMobileTabs = filteredTabs.slice(4);

  const { user, logout } = useUser();

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLogoutLoading(true);
    logout();
    setShowLogoutModal(false);
    localStorage.removeItem("token");
    localStorage.removeItem("accessTab");
    localStorage.removeItem("userData");
    setTimeout(() => {
      navigate("/login", { replace: true });
      setIsLogoutLoading(false);
    }, 100);
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
  };

  const displayUser = JSON.parse(localStorage.getItem("userData")) || user || {
    name: "",
    email: "",
    role: ""
  };

  return (
    <div className="app-shell d-flex" style={{ minHeight: "100vh", overflowX: "hidden" }}>
      {/* Desktop Sidebar Fixed in Viewport Height with Shrinked Padding & Internal Scroll */}
      <aside 
        className="sidebar d-none d-md-flex flex-column p-2 gap-2 position-sticky top-0" 
        style={{ height: "100vh", width: "250px", flexShrink: 0, overflowY: "auto" }}
      >
        <div className="d-flex flex-column align-items-center py-2 mb-1">
          <img
            src="/images/my_naai_logo.png"
            alt="Salon Logo"
            className="object-fit-contain"
            style={{ maxHeight: "60px" }}
          />
        </div>

        {/* Scrollable nav items list inside sidebar */}
        <nav className="nav flex-column gap-1 flex-grow-1" style={{ overflowY: "auto", minHeight: 0 }}>
          {filteredTabs?.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `nav-link d-flex align-items-center gap-2 py-2 px-3 small ${isActive ? "active" : ""}`
              }
            >
              {item.icon}
              <span className="text-truncate">{item.label}</span>
              {item.path === "/salonrequest" && salonRequestCount > 0 && (
                <span className="badge bg-danger ms-auto" style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem' }}>
                  {salonRequestCount > 99 ? '99+' : salonRequestCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Pinned Bottom Profile & Logout Section */}
        <div className="mt-auto d-flex flex-column gap-2 pt-2 border-top flex-shrink-0">
          <div
            className="d-flex align-items-center gap-2 p-2 rounded sidebar-profile"
            style={{ cursor: 'pointer' }}
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <div className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '34px', height: '34px', flexShrink: 0 }}>
              <span style={{ fontSize: '1rem' }}>👤</span>
            </div>
            <div className="flex-grow-1 text-truncate">
              <div className="text-white fw-medium small text-truncate" style={{ fontSize: "0.82rem" }}>{displayUser.name}</div>
              <div className="text-white-50 small text-truncate" style={{ fontSize: "0.72rem" }}>{displayUser.role}</div>
            </div>
          </div>

          <div>
            <button
              className="logoutbutton btn-sm w-100 py-1"
              onClick={handleLogoutClick}
              style={{ fontSize: "0.85rem" }}
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div
          className="modal fade show d-block position-fixed top-0 start-0 w-100 h-100"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title">Confirm Logout</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleLogoutCancel}
                />
              </div>
              <div className="modal-body py-4 text-center">
                <i className="bi bi-exclamation-triangle-fill text-warning mb-3" style={{ fontSize: '3rem' }}></i>
                <p className="mb-0 fs-5 fw-medium">Are you sure you want to logout?</p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4"
                  onClick={handleLogoutCancel}
                >
                  No, Stay
                </button>
                <button
                  type="button"
                  className="btn btn-danger px-4"
                  onClick={handleLogoutConfirm}
                  disabled={isLogoutLoading}
                >
                  {isLogoutLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Logging out...
                    </>
                  ) : (
                    "Yes, Logout"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        show={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />

      {/* Desktop Profile Dropdown */}
      <div className="d-none d-md-block">
        {showProfileDropdown && (
          <ProfileDropdown
            isOpen={showProfileDropdown}
            onClose={() => setShowProfileDropdown(false)}
            onChangePassword={handleChangePassword}
            position="desktop"
          />
        )}
      </div>

      {/* Mobile + Desktop Main Content */}
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0, paddingBottom: "70px" }}>
        {/* Mobile Topbar */}
        <div className="d-md-none position-relative">
          <header className="navbar bg-white shadow-sm sticky-top px-2 mobile-header-fixed">
            <div className="d-flex align-items-center justify-content-between w-100">
              <div className="d-flex align-items-center gap-2 min-w-0 flex-grow-1">
                <img
                  src="/images/my_naai_logo.png"
                  alt="Salon Logo"
                  className="object-fit-contain"
                  style={{ maxHeight: "35px" }}
                />
              </div>

              <button
                className="btn btn-outline-secondary btn-sm flex-shrink-0 d-flex align-items-center justify-content-center profile-btn"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
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

          <ProfileDropdown
            isOpen={showProfileDropdown}
            onClose={() => setShowProfileDropdown(false)}
            onChangePassword={handleChangePassword}
            position="mobile"
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-grow-1">
          <div className="container-fluid py-3">{children}</div>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="d-md-none">
          <nav className="navbar fixed-bottom bg-white border-top shadow-lg mobile-bottom-nav py-1">
            <div className="container-fluid d-flex justify-content-around align-items-center px-1">
              {primaryMobileTabs.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `nav-link text-center p-2 mobile-nav-item ${isActive ? "active" : ""}`
                  }
                >
                  <div className="d-flex flex-column align-items-center">
                    {item.icon}
                    <small className="mt-1 nav-text" style={{ fontSize: "0.68rem" }}>
                      {item.label.replace(" Management", "").replace("Customer", "Customers").replace("User", "Users")}
                    </small>
                  </div>
                </NavLink>
              ))}

              {overflowMobileTabs.length > 0 && (
                <button
                  type="button"
                  className={`btn nav-link text-center p-2 mobile-nav-item border-0 bg-transparent ${showMoreDrawer ? "active text-primary" : "text-secondary"}`}
                  onClick={() => setShowMoreDrawer(true)}
                >
                  <div className="d-flex flex-column align-items-center">
                    <Menu size={20} />
                    <small className="mt-1 nav-text" style={{ fontSize: "0.68rem" }}>More</small>
                  </div>
                </button>
              )}
            </div>
          </nav>

          {/* Mobile Overflow Menu Drawer */}
          {showMoreDrawer && (
            <div 
              className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-end" 
              style={{ backgroundColor: "rgba(0,0,0,0.4)", zIndex: 1055 }}
              onClick={() => setShowMoreDrawer(false)}
            >
              <div 
                className="bg-white rounded-top-4 p-4 shadow-lg animate-slide-up" 
                style={{ maxHeight: "70vh", overflowY: "auto" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <h6 className="fw-bold mb-0 text-dark">More Menu</h6>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-light rounded-circle p-1" 
                    onClick={() => setShowMoreDrawer(false)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="d-flex flex-column gap-2">
                  {overflowMobileTabs.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `d-flex align-items-center gap-3 p-3 rounded-3 text-decoration-none ${isActive ? "bg-primary bg-opacity-10 text-primary fw-semibold" : "text-dark bg-light"}`
                      }
                      onClick={() => setShowMoreDrawer(false)}
                    >
                      <span className="text-primary">{item.icon}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Layout;