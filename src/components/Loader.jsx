const Loader = ({ fullScreen = true, size = "lg", text = "Loading..." }) => {
  if (fullScreen) {
    return (
      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50 z-50" style={{ minHeight: '100vh' }}>
        <div className="text-center text-white">
          <div className={`spinner-border spinner-border-${size} mb-3`} role="status">
            <span className="visually-hidden">{text}</span>
          </div>
          <div className="text-white">{text}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center py-5">
      <div className={`spinner-border spinner-border-${size} me-2`} role="status">
        <span className="visually-hidden">{text}</span>
      </div>
      <span className="text-muted">{text}</span>
    </div>
  );
};

export default Loader;

