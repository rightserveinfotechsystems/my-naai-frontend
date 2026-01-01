import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Layout from "../components/Layout.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { salonAPI } from "../services/communication.jsx";

const SalonDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Helper function to convert 24h to 12h format (AM/PM)
  const format12hr = (time) => {
    if (!time) return '';
    console.log('Input time:', time);

    // Handle both HH:MM and HH:MM:SS formats
    const timeParts = time.split(':');
    const hour = timeParts[0];
    const minute = timeParts[1] || '00';
    let h = parseInt(hour);

    console.log('Parsed - hour:', hour, 'minute:', minute, 'h:', h);

    // Handle special case where hour is 24 (should be 00)
    if (h === 24) h = 0;

    const ampm = h >= 12 ? 'PM' : 'AM';
    console.log('Before 12hr conversion - h:', h, 'ampm:', ampm);

    h = h % 12 || 12;
    console.log('After 12hr conversion - h:', h);

    const result = `${h}:${minute} ${ampm}`;
    console.log('Final result:', result);
    return result;
  };

  // Test the function (commented out for now)
  // console.log('Time conversion tests:');
  // console.log('06:09:00 ->', format12hr('06:09:00'));
  // console.log('07:03:00 ->', format12hr('07:03:00'));

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const dayNameToNumber = (dayName) => {
    const dayMap = {
      'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6,
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    return dayMap[dayName] !== undefined ? dayMap[dayName] : -1;
  };

  useEffect(() => {
    const fetchSalonDetails = async () => {
      console.log("🏪 SalonDetail useEffect triggered with id:", id);
      try {
        setLoading(true);
        setError(null);
        console.log("📞 Calling salonAPI.getSalonDetails with id:", id);
        const result = await salonAPI.getSalonDetails(id);
        console.log("📨 API result received:", result);

        if (result.success && result.data) {
          setSalon(result.data);
        } else {
          console.log("❌ API returned success=false or no data");
          setError(result.message || "Failed to load salon details");
        }
      } catch (err) {
        console.log("💥 Exception in fetchSalonDetails:", err);
        setError("Failed to load salon details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      console.log("✅ ID exists, calling fetchSalonDetails");
      fetchSalonDetails();
    } else {
      console.log("❌ No ID provided to SalonDetail");
    }
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !salon) {
    return (
      <Layout>
        <div className="text-center py-5">
          <div className="alert alert-danger mb-3">{error || "Salon not found"}</div>
          <button className="btn btn-primary" onClick={() => navigate('/salons')}>Back to Salons</button>
        </div>
      </Layout>
    );
  }

  // Backend sends holidayDays as strings ["Fri"], convert to numbers [5]
  const rawHolidayDays = salon.businessHours?.[0]?.holidayDays || [];
  const holidayDays = rawHolidayDays.map(day => dayNameToNumber(day)).filter(day => day !== -1);
  console.log("🎯 Raw holiday days from backend:", rawHolidayDays);
  console.log("🎯 Converted holiday days (numbers):", holidayDays);

  const galleryImages = [
    "/images/image2.jpeg", "/images/image1.jpeg", "/images/image3.jpeg",
    "/images/image4.jpeg", "/images/image5.jpeg", "/images/image6.jpeg", "/images/image7.jpeg",
  ];

  const PAGE_MAX_WIDTH = '1400px';

  return (
    <Layout>
      <div className="d-flex flex-column mx-0 mx-lg-3 mt-4 p-1" style={{ minHeight: 'calc(100vh - 80px)', maxWidth: PAGE_MAX_WIDTH }}>

        {/* 1. Header Section */}
        <div className="card shadow-sm mb-3 border-0" style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '15px' }}>
          <div className="card-body p-3 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <button className="btn btn-light btn-sm rounded-circle shadow-sm" onClick={() => navigate('/salons')}>
                <i className="bi bi-arrow-left"></i>
              </button>
              <div>
                <h4 className="mb-0 fw-bold">{salon.salonName}</h4>
                <small className="text-muted">
                  {salon.city}, {salon.state} • ★ {salon.ratingAverage || '5.0'}
                  {salon.totalReviews > 0 && ` (${salon.totalReviews} reviews)`}
                </small>
                <div className="d-flex gap-2 mt-1">
                  {salon.ownerName && (
                    <small className="text-muted">by {salon.ownerName}</small>
                  )}
                  {salon.createdAt && (
                    <small className="text-muted">
                      • Joined {new Date(salon.createdAt).toLocaleDateString()}
                    </small>
                  )}
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
                  <h6 className="fw-bold mb-2 small"><i className="bi bi-images me-2 text-primary"></i>Gallery</h6>
                  <div className="row g-2 overflow-auto" style={{ maxHeight: '400px' }}>
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
                <div className="card-body d-flex flex-column justify-content-center text-center p-3">
                  <h6 className="small opacity-75 text-start">
                    <i className="bi bi-clock me-2"></i>Business Hours
                  </h6>

                  <h2 className="fw-bold mb-1">
                    {console.log('Business hours data:', salon.businessHours?.[0])}
                    {console.log('Opening time:', salon.businessHours?.[0]?.openingTime)}
                    {console.log('Closing time:', salon.businessHours?.[0]?.closingTime)}
                    {format12hr(salon.businessHours?.[0]?.openingTime || '09:00:00')} -
                    {format12hr(salon.businessHours?.[0]?.closingTime || '21:00:00')}
                  </h2>

                  <div className="d-flex  flex-wrap justify-content-center gap-1 mt-2">
                    {weekDays.map((day, index) => {
                      const isHoliday = holidayDays.includes(index);

                      console.log(`📅 Day ${index} (${day}): isHoliday=${isHoliday}, in holidayDays=${holidayDays}`);

                      return (
                       <span
            key={index}
            className={`badge ${
              isHoliday
                ? 'bg-danger text-white'       // Holiday from backend -> RED background
                : 'bg-light text-dark border'  // Working Day -> White background
            }`}
            style={{
              fontSize: '10px',
              minWidth: '42px'
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
                  <div className="p-3 border-bottom bg-light"><h6 className="fw-bold mb-0 small">Services</h6></div>
                  <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: '400px' }}>
                    {console.log("Services to render:", salon.services)}
                    {salon.services?.length > 0 ? salon.services.map((s, index) => {
                      console.log("Rendering service:", index, s);
                      return (
                      <div key={s.serviceId || s.id || index} className="list-group-item p-3">
                        <div className="d-flex justify-content-between">
                          <div>
                            <div className="fw-bold small">{s.serviceName || s.name}</div>
                            <small className="text-muted">
                              {s.durationMinutes || s.duration}m{s.description ? ` • ${s.description}` : ''}
                            </small>
                          </div>
                          <div className="fw-bold text-dark">₹{s.price}</div>
                        </div>
                      </div>
                    );
                    }) : <div className="p-3 text-center text-muted small">No services available</div>}
                  </div>
                </div>
              </div>

              {/* Contact & Additional Info */}
              <div className="card shadow-sm border-0" style={{ borderRadius: '15px' }}>
                <div className="card-body p-3">
                  <h6 className="fw-bold mb-2 small border-bottom pb-1">Contact</h6>

                  {/* Address */}
                  <p className="small mb-2">
                    <i className="bi bi-geo-alt text-danger me-2"></i>
                    {[salon.addressLine1, salon.addressLine2, salon.city, salon.state, salon.pincode]
                      .filter(Boolean)
                      .join(', ')}
                  </p>

                  {/* Phone */}
                  <p className="small mb-2">
                    <i className="bi bi-phone text-success me-2"></i>
                    {salon.phoneNumber}
                  </p>

                  {/* Email */}
                  {salon.email && (
                    <p className="small mb-2">
                      <i className="bi bi-envelope text-primary me-2"></i>
                      {salon.email}
                    </p>
                  )}

                  {/* Queue Info */}
                  {salon.queueLength > 0 && (
                    <p className="small mb-2">
                      <i className="bi bi-people text-warning me-2"></i>
                      {salon.queueLength} in queue • {salon.totalWaitTime?.display || 'Wait time unknown'}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="d-flex gap-2 mt-3">
                    <button className="btn btn-outline-dark btn-sm flex-grow-1 rounded-pill">
                      <i className="bi bi-envelope me-1"></i>Email
                    </button>
                    <button className="btn btn-success btn-sm flex-grow-1 rounded-pill">
                      <i className="bi bi-whatsapp me-1"></i>WhatsApp
                    </button>
                  </div>
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