import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { salons } from "../data/mockData.js";

const SalonDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const salon = salons.find((s) => s.id === id);

  if (!salon) return <Layout><div className="text-center py-5"><h4>Salon not found</h4></div></Layout>;

  const galleryImages = [
    "/images/image2.jpeg",
    "/images/image1.jpeg",
    "/images/image3.jpeg",
    "/images/image4.jpeg",
    "/images/image5.jpeg",
    "/images/image6.jpeg",
    "/images/image7.jpeg",
  ];

  const PAGE_MAX_WIDTH = '1400px';

  return (
    <Layout>
      {/* Wrapper to control total height */}
      <div className="d-flex flex-column mx-0 mx-lg-3 salon-detail-wrapper mt-4 p-1" style={{ height: 'calc(100dvh - 60px)', height: 'calc(100vh - 60px)', maxWidth: PAGE_MAX_WIDTH }}>

        {/* 1. Header Section */}
        <div className="card shadow-sm mb-3 border-0 salon-detail-header"
          style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '15px' }}>
          <div className="card-body p-3 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <button className="btn btn-light btn-sm rounded-circle shadow-sm" onClick={() => navigate('/salons')}>
                <i className="bi bi-arrow-left"></i>
              </button>
              <div>
                <h4 className="mb-0 fw-bold">{salon.name}</h4>
                <small className="text-muted">{salon.city} • ★ {salon.rating}</small>
              </div>
            </div>
            <StatusBadge status={salon.status} />
          </div>
        </div>

        {/* Main Content Area - Taking remaining height */}
        <div className="flex-grow-1 overflow-hidden salon-detail-content">
          <div className="row g-3 h-100">

            {/* Left Column: Gallery & Hours */}
            <div className="col-lg-7 d-flex flex-column h-100 salon-gallery-col">
              {/* Gallery (Scrollable) */}
              <div className="card shadow-sm border-0 mb-3 flex-grow-1 overflow-hidden" style={{ borderRadius: '15px' }}>
                <div className="card-body d-flex flex-column h-100">
                  <h6 className="fw-bold mb-2 small"><i className="bi bi-images me-2 text-primary"></i>Gallery</h6>
                  <div className="overflow-auto pe-1 thin-scrollbar">
                    <div className="row g-2">
                      {galleryImages.map((img, idx) => (
                        <div key={idx} className={idx % 3 === 0 ? "col-12" : "col-6"}>
                          <img src={img} className="img-fluid rounded-3 w-100" style={{ height: '180px', objectFit: 'cover' }} alt="salon" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Hours (Fixed height at bottom of left column) */}
              <div className="card shadow-sm border-0 bg text-white" style={{ borderRadius: '15px', minHeight: '120px' }}>
                <div className="card-body d-flex flex-column justify-content-center text-center p-3">
                  <h6 className="small opacity-75 text-start"><i className="bi bi-clock me-2"></i>Business Hours</h6>
                  <h2 className="fw-bold mb-1">{salon.openingTime} - {salon.closingTime}</h2>
                  <div className="d-flex flex-wrap justify-content-center gap-1 mt-2">
                    {['Mon', 'Tue', 'Wed', 'Thr', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                      <span
                        key={i}
                        className={`badge ${day === 'Sun' ? 'bg-danger' : 'bg-white bg-opacity-25'}`}
                        style={{ fontSize: '10px' }}
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Services & Contact */}
            <div className="col-lg-5 d-flex flex-column h-100 salon-services-col">
              {/* Services (Scrollable) */}
              <div className="card shadow-sm border-0 mb-3 flex-grow-1 overflow-hidden" style={{ borderRadius: '15px' }}>
                <div className="card-body p-0 d-flex flex-column h-100">
                  <div className="p-3 border-bottom bg-light">
                    <h6 className="fw-bold mb-0 small">Services</h6>
                  </div>
                  <div className="list-group list-group-flush overflow-auto thin-scrollbar">
                    {salon.services.map((s) => (
                      <div key={s.id} className="list-group-item p-3">
                        <div className="d-flex justify-content-between flex-column flex-md-row gap-2 gap-md-0">
                          <div>
                            <div className="fw-bold small">{s.name}</div>
                            <small className="text-muted">{s.duration}m</small><br />
                            <small className="text-muted">{s.description}</small>
                          </div>
                          <div className="fw-bold text-$dark">₹{s.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>


              {/* Contact (Fixed height at bottom of right column) */}
              <div className="card shadow-sm border-0 " style={{ borderRadius: '15px', height: '220px' }}>
                <div className="card-body d-flex flex-column p-3">
                  <h6 className="fw-bold mb-2 small border-bottom pb-1">Contact</h6>
                  <div className="flex-grow-1">
                    <p className="x-small mb-1 text-muted"><i className="bi bi-geo-alt text-danger me-2"></i>{salon.address}</p>
                    <p className="x-small mb-1 text-muted"><i className="bi bi-phone text-success me-2"></i>{salon.phone}</p>
                  </div>
                  <div className="d-flex gap-2 mt-2">
                    <button className="btn btn-dark btn-sm flex-grow-1 rounded-pill">Email</button>
                    <button className=" bg flex-grow-1 rounded-pill">WhatsApp</button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SalonDetail;