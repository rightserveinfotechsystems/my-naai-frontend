const PageHeader = ({ title, description, actions }) => {
  return (
    <div 
      className="page-header-fixed px-4 px-md-5 pt-4 pb-3 mb-0 shadow-sm"
      style={{ 
        position: 'sticky',
        top: 0,
        background: 'linear-gradient(135deg, #0f1c1a 0%, #0f1c1a 50%, #0f1c1a 100%)',
        color: 'white',
        zIndex: 1060, // Increased for mobile sticky
        backdropFilter: 'blur(10px)'
      }}
    >
      <div className="container-fluid container-xl position-relative" style={{ zIndex: 1065 }}>
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 gap-md-4">
          <div className="flex-grow-1 min-w-0">
            <h1 className="h3 fw-bold mb-2 mb-md-1 text-white lh-base lh-md-sm">{title}</h1>
            {description && (
              <p className="lead mb-0 mb-md-2 opacity-90 small lh-sm">{description}</p>
            )}
          </div>
          {actions && (
            <div 
              className="d-flex flex-wrap gap-2 ms-md-3 flex-shrink-0 position-relative"
              style={{ zIndex: 1070 }} // Highest for dropdowns
            >
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
