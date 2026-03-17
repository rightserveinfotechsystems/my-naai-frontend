import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Layout from "../components/Layout.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { salonAPI } from "../services/communication.jsx";
import Loader from "../components/Loader.jsx";

const SalonDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const format12hr = (time) => {
    if (!time) return '';

    const timeParts = time.split(':');
    const hour = timeParts[0];
    const minute = timeParts[1] || '00';
    let h = parseInt(hour);


    if (h === 24) h = 0;

    const ampm = h >= 12 ? 'PM' : 'AM';

    h = h % 12 || 12;

    const result = `${h}:${minute} ${ampm}`;
    return result;
  };



  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const dayNameToNumber = (dayName) => {
    const dayMap = {
      'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6,
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    return dayMap[dayName] !== undefined ? dayMap[dayName] : -1;
  };

  useEffect(() => {
    const tab = localStorage.getItem("accessTab")
      ? JSON.parse(localStorage.getItem("accessTab"))
      : null;

    if (!(tab && tab?.includes("salonManagement"))) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const fetchSalonDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await salonAPI.getSalonDetails(id);

        if (result.success && result.data) {
          setSalon(result.data);
        } else {
          setError(result.message || "Failed to load salon details");
        }
      } catch (err) {
        setError("Failed to load salon details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSalonDetails();
    } else {
    }
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
          <Loader fullScreen={false} size="lg" text="Loading..." />
        </div>
      </Layout>
    );
  }

  if (error || !salon) {
    return (
      <Layout>
        <div className="text-center py-5">
          <div className="alert alert-danger mb-3">{error || "Salon not found"}</div>
          <button className="btn btn-primary" onClick={() => navigate('/salons', { replace: true })}>Back to Salons</button>
        </div>
      </Layout>
    );
  }

  const rawHolidayDays = salon.businessHours?.[0]?.holidayDays || [];
  const holidayDays = rawHolidayDays.map(day => dayNameToNumber(day)).filter(day => day !== -1);


  const getSalonImages = () => {
    const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

    const imageFields = ['imagesArray', 'images', 'salonImages', 'imageUrls', 'photos', 'pictures'];
    let salonImages = [];

    for (const field of imageFields) {
      if (salon[field] && Array.isArray(salon[field]) && salon[field].length > 0) {
        salonImages = salon[field].map(img => {
          if (typeof img === 'string') {
            return img.startsWith('http') ? img : `${backendURL}/getFiles${img}`;
          } else if (img && typeof img === 'object') {
            const imageUrl = img.url || img.imageUrl || img.photoUrl || img.src || img.path;
            return imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${backendURL}/getFiles${imageUrl}`) : null;
          }
          return null;
        }).filter(img => img !== null);
        break;
      }
    }

    // Note: We do NOT include the main image (imageUrl/shopLogo) in the gallery
    // The gallery should only show additional images from imagesArray

    return salonImages;
  };

  const galleryImages = getSalonImages();

  const PAGE_MAX_WIDTH = '1400px';
  // useEffect(() => {
  //   const tab = localStorage.getItem("accessTab") ? JSON.parse(localStorage.getItem("accessTab")) : null;
  //   if (!(tab && tab?.includes("salonManagement"))) {
  //     navigate("/login",{ replace: true });
  //   }
  // }, [])
  return (
    <Layout>
      <div className="d-flex flex-column mx-0 mx-lg-3 mt-4 p-1" style={{ minHeight: 'calc(100vh - 80px)', maxWidth: PAGE_MAX_WIDTH }}>

        {/* 1. Header Section */}
        <div className="card shadow-sm mb-3 border-0" style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '15px' }}>
          <div className="card-body p-3 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <button className="btn btn-light btn-sm rounded-circle shadow-sm" onClick={() => navigate('/salons', { replace: true })}>
                <i className="bi bi-arrow-left"></i>
              </button>
              <div>
                <h4 className="mb-0 fw-bold ">{salon.salonName}</h4>
                <small className="text-muted">
                  {salon.city}, {salon.state} {""}
                  {/* • ★ {salon.ratingAverage || '5.0'}
                  {salon.totalReviews > 0 && ` (${salon.totalReviews} reviews)`} */}
                  • Joined {new Date(salon.createdAt).toLocaleDateString('en-GB')}

                </small>
                <div className="d-flex gap-2 mt-1">
                  {salon.ownerName && (
                    <small className="text-muted">Owner: {salon.ownerName}</small>
                  )}
                </div>
                <div className="d-flex gap-2 mt-1">
                  <small className="text-muted">Onboarded By: {salon?.creatorAdmin?.name}</small>
                </div>
                <div className="d-flex gap-2 mt-1">
                  <small className="text-muted">Agent Mobile No.: {salon?.creatorAdmin?.mobile}</small>
                </div>
              </div>
            </div>
            <div className="d-flex flex-row align-items-center gap-1 flex-wrap">
              <StatusBadge status={salon.isActive ? "active" : "inactive"} />
              <small className={`badge ${salon.isOpen ? 'bg-success' : 'bg-warning text-dark'}`}>
                {salon.isOpen ? 'Open' : 'Closed'}
              </small>
              <small className="badge bg-secondary">
                {salon.genderType || 'Unisex'}
              </small>
              {salon.queueLength > 0 && (
                <small className="badge bg-info">
                  {salon.queueLength} in queue
                </small>
              )}
            </div>
          </div>
        </div>

        {/* 2. Main Content Area */}
        <div className="flex-grow-1">
          <div className="row g-3 h-100">

            {/* Left Column */}
            <div className="col-lg-7 d-flex flex-column">
              {/* Gallery */}
              <div className="card shadow-sm border-0 mb-3 flex-grow-1" style={{ borderRadius: '15px' }}>
                <div className="card-body">
                  <h6 className="fw-bold mb-2 small"><i className="bi bi-images me-2 text-warning"></i>Gallery</h6>
                  <div className="row g-2 overflow-auto" style={{ maxHeight: '320px' }}>
                    {galleryImages.map((img, idx) => (
                      <div key={idx} className={idx % 3 === 0 ? "col-12" : "col-6"}>
                        <img src={img} className="img-fluid rounded-3 w-100" style={{ height: '180px', objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => setSelectedImage(img)} alt="salon" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Business Hours - 12hr & Dynamic Days Logic */}
              <div className="card shadow-sm border-0 bg-dark text-white" style={{ borderRadius: '15px' }}>
                <div className="card-body d-flex flex-column justify-content-center text-center p-2 p-md-3">
                  <h6 className="small opacity-75 text-start">
                    <i className="bi bi-clock me-2"></i>Business Hours
                  </h6>

                  <h4 className="fw-bold mb-1 h2 h-md-2">
                    {format12hr(salon.businessHours?.[0]?.openingTime || '09:00:00')} -
                    {format12hr(salon.businessHours?.[0]?.closingTime || '21:00:00')}
                  </h4>

                  {/* Break Time */}
                  <p className="small mb-2 opacity-75">
                    <i className="bi bi-pause-circle me-1"></i>
                    Break: {salon.businessHours?.[0]?.breakStartTime ? format12hr(salon.businessHours[0].breakStartTime) : 'N/A'} -
                    {salon.businessHours?.[0]?.breakEndTime ? format12hr(salon.businessHours[0].breakEndTime) : 'N/A'}
                  </p>

                  <div className="d-flex  flex-wrap justify-content-center gap-1 mt-2">
                    {weekDays.map((day, index) => {
                      const isHoliday = holidayDays.includes(index);

                      return (
                        <span
                          key={index}
                          className={`badge ${isHoliday
                            ? 'bg-danger text-white'
                            : 'bg-white text-dark border'
                            }`}
                          style={{
                            fontSize: '9px',
                            minWidth: '50px',
                            minHeight: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {day}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-lg-5 d-flex flex-column">
              {/* Services */}
              <div className="card shadow-sm border-0 mb-3 flex-grow-1 overflow-hidden" style={{ borderRadius: '15px' }}>
                <div className="card-body p-0 d-flex flex-column h-100">
                  <div className="p-2 p-md-3 border-bottom bg-light"><h6 className="fw-bold mb-0 small">Services</h6></div>
                  <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: '340px' }}>
                    {salon.services?.length > 0 ? salon.services.map((s, index) => {
                      return (
                        <div key={s.serviceId || s.id || index} className="list-group-item p-2 p-md-3">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1 me-2">
                              <div className="fw-bold small">{s.serviceName || s.name}</div>
                              <small className="text-muted d-block">
                                {s.durationMinutes || s.duration}Min
                              </small>
                            </div>
                            <div className="fw-bold text-dark flex-shrink-0">₹{s.price}</div>
                            {/* <small className="text-muted d-block text-dark">
                              {s.durationMinutes || s.duration}m
                            </small> */}
                          </div>
                        </div>
                      );
                    }) : <div className="p-3 text-center text-muted small">No services available</div>}
                  </div>
                </div>
              </div>

              {/* Contact & Additional Info */}
              <div className="card shadow-sm border-0" style={{ borderRadius: '15px' }}>
                <div className="card-body p-2 p-md-3">
                  <h6 className="fw-bold mb-2 small border-bottom pb-1">Contact</h6>
                  {/* Address */}
                  <p className="small mb-2">
                    <i className="bi bi-geo-alt text-danger me-2"></i>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        [salon.addressLine1, salon.addressLine2, salon.city, salon.state, salon.pincode]
                          .filter(Boolean)
                          .join(", ")
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none text-dark"
                    >
                      {[salon.addressLine1, salon.addressLine2, salon.city, salon.state, salon.pincode]
                        .filter(Boolean)
                        .join(", ")}
                    </a>
                  </p>
                  {/* Phone */}
                  {salon.phoneNumber && (
                    <p className="small mb-2">
                      <i className="bi bi-phone text-success me-2"></i>
                      <a
                        href={`tel:${salon.phoneNumber}`}
                        className="text-decoration-none text-dark"
                      >
                        {salon.phoneNumber}
                      </a>
                    </p>
                  )}

                  {/* Email */}
                  {salon.email && (
                    <p className="small mb-2">
                      <i className="bi bi-envelope text-primary me-2"></i>
                      <a
                        href={`mailto:${salon.email}`}
                        className="text-decoration-none text-dark"
                      >
                        {salon.email}
                      </a>
                    </p>
                  )}


                  {/* Queue Info */}
                  {salon.queueLength > 0 && (
                    <p className="small mb-0">
                      <i className="bi bi-people text-warning me-2"></i>
                      {salon.queueLength} in queue • {salon.totalWaitTime?.display || 'Wait time unknown'}
                    </p>
                  )}

                  {/* Action Buttons */}
                  {/* <div className="d-flex gap-2 mt-3">
                    <button className="btn btn-outline-dark btn-sm flex-grow-1 rounded-pill">
                      <i className="bi bi-envelope me-1"></i>Email
                    </button>
                    <button className="btn btn-success btn-sm flex-grow-1 rounded-pill">
                      <i className="bi bi-whatsapp me-1"></i>WhatsApp
                    </button>
                  </div> */}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Image Viewer Modal Logic... (Optional cleanup) */}
      {selectedImage && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999 }} onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} className="img-fluid" style={{ maxHeight: '90vh' }} alt="Preview" />
        </div>
      )}
    </Layout>
  );
};

export default SalonDetail;