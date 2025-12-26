import { useState, useEffect } from "react";
import { cities } from "../data/mockData.js";

const SalonEditModal = ({ showModal, setShowModal, modalMode, editingSalonId, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    address: "",
    rating: 4.5,
    status: "active",
    services: [],

  });

  const [images, setImages] = useState([]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (showModal) {
      if (modalMode === "add") {
        setFormData({
          name: "",
          city: "",
          address: "",
          rating: 4.5,
          status: "active",
          services: [],
          openingTime: "9:00 AM - 9:00 PM",
          images: []
        });
      }
      setImages([]);
    }
  }, [showModal, modalMode]);

  const handleServiceChange = (index, field, value) => {
    const newServices = [...formData.services];
    if (!newServices[index]) {
      newServices[index] = { name: "", price: "", duration: "", description: "" };
    }
    newServices[index][field] = value;
    setFormData({ ...formData, services: newServices });
  };

  const addService = () => {
    setFormData({
      ...formData,
      services: [...formData.services, { name: "", price: "", duration: "", description: "" }]
    });
  };

  const removeService = (index) => {
    const newServices = formData.services.filter((_, i) => i !== index);
    setFormData({ ...formData, services: newServices });
  };

  const handleCloseModal = () => {
    // Clean up image previews
    images.forEach(image => {
      if (image.preview) URL.revokeObjectURL(image.preview);
    });

    setShowModal(false);
    setIsSubmitting(false);
    setFormData({
      name: "",
      city: "",
      address: "",
      rating: 4.5,
      status: "active",
      services: [],
      openingTime: "9:00 AM - 9:00 PM",
      images: []
    });
    setImages([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    const submitData = {
      ...(modalMode === "edit" && { id: editingSalonId }),
      ...formData,
      images: images.map(img => img.file)
    };

    console.log(`${modalMode === "add" ? "New" : "Updated"} salon:`, submitData);
    handleCloseModal();

    // Show success message
    alert(`${modalMode === "add" ? "Salon added" : "Salon updated"} successfully with ${images.length} images!`);

    // Call success callback
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Image ${file.name} is too large. Max 5MB allowed.`);
        return null;
      }
      return {
        file,
        preview: URL.createObjectURL(file)
      };
    }).filter(Boolean);

    setImages(prev => [...prev, ...newImages]);
    e.target.value = '';
  };

  const removeImage = (index) => {
    const image = images[index];
    if (image.preview) URL.revokeObjectURL(image.preview);

    setImages(prev => prev.filter((_, i) => i !== index));
  };

  if (!showModal) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: '40%', margin: '1rem auto' }}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">
              <i className={`bi ${modalMode === "add" ? "bi-plus-circle text-primary" : "bi-pencil-square text-warning"} me-2`}></i>
              {modalMode === "add" ? "Add New Salon" : "Edit Salon"}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="row g-3 g-md-4" style={{ minHeight: 0 }}>

                {/* 1. Salon Name */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Salon Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    placeholder="Enter salon name"
                  />
                </div>

                {/* 2. Owner Name */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Owner Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="ownerName"
                    value={formData.ownerName || ""}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    placeholder="Enter owner name"
                  />
                </div>

                {/* 3. Phone Number */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Phone Number <span className="text-danger">*</span></label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phoneNumber"
                    value={formData.phoneNumber || ""}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    placeholder="Enter Phone Number"
                  />
                </div>

                {/* 4. Email ID */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Email ID</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    placeholder="owner@example.com"
                  />
                </div>

                {/* 5. Address Line */}
                <div className="col-12">
                  <label className="form-label fw-semibold">Address Line <span className="text-danger">*</span></label>
                  <textarea
                    className="form-control"
                    name="address"
                    rows="2"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    placeholder="Enter complete address"
                  />
                </div>

                {/* 6. City */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">City <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">Select City</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* 7. State */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">State <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    name="state"
                    value={formData.state || ""}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">Select State</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Rajasthan">Rajasthan</option>
                  </select>
                </div>

                {/* 8. Pincode */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">Pincode <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className="form-control"
                    name="pincode"
                    value={formData.pincode || ""}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    placeholder="124001"
                    maxLength="6"
                  />
                </div>

                {/* Salon Type */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold mb-2">Salon Type : <span className="text-danger">*</span></label>
                  <div className="d-flex flex-column gap-2">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="gender"
                        id="male"
                        value="male"
                        checked={formData.gender === "male"}
                        onChange={handleInputChange}
                        required
                        disabled={isSubmitting}
                      />
                      <label className="form-check-label fw-medium" htmlFor="male">
                        <i className="bi bi-person-fill text-primary me-2"></i>Male
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="gender"
                        id="female"
                        value="female"
                        checked={formData.gender === "female"}
                        onChange={handleInputChange}
                        required
                        disabled={isSubmitting}
                      />
                      <label className="form-check-label fw-medium" htmlFor="female">
                        <i className="bi bi-person-heart text-danger me-2"></i>Female
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="gender"
                        id="unisex"
                        value="unisex"
                        checked={formData.gender === "unisex"}
                        onChange={handleInputChange}
                        required
                        disabled={isSubmitting}
                      />
                      <label className="form-check-label fw-medium" htmlFor="unisex">
                        <i className="bi bi-gender-trans text-success me-2"></i>Unisex
                      </label>
                    </div>
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Services <span className="text-danger">*</span></label>
                  {formData.services.map((service, index) => (
                    <div key={index} className="card mb-3 p-3">
                      <div className="mb-2">
                        <div className="row g-2">
                          <div className="col-12 col-md-4">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Service Name"
                              value={service.name || ""}
                              onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                              required
                            />
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="input-group">
                              <span className="input-group-text"><i className="bi bi-currency-rupee"></i></span>
                              <input
                                type="number"
                                className="form-control"
                                placeholder="Price"
                                value={service.price || ""}
                                onChange={(e) => handleServiceChange(index, 'price', e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="input-group">
                              <input
                                type="number"
                                className="form-control"
                                placeholder="Duration"
                                value={service.duration || ""}
                                onChange={(e) => handleServiceChange(index, 'duration', e.target.value)}
                                required
                              />
                              <span className="input-group-text">min</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <textarea
                            className="form-control"
                            placeholder="Description"
                            value={service.description || ""}
                            onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm px-1"
                        onClick={() => removeService(index)}
                        disabled={formData.services.length === 1}
                      >
                        <i className="bi bi-trash"></i>
                      </button>

                    </div>
                  ))}
                  <button
                    type="button"
                    className="bg"
                    onClick={addService}
                  >
                    Add Service
                  </button>
                </div>

                {/* Opening Time */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">
                    Opening Time <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type="time"
                      className="form-control rounded-start"
                      name="openingTime"
                      value={formData.openingTime || ""}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                    />
                    <select
                      className="form-select rounded-end"
                      style={{ maxWidth: "100px" }}
                      name="openingPeriod"
                      value={formData.openingPeriod || "AM"}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>

                {/* Closing Time */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">
                    Closing Time <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type="time"
                      className="form-control rounded-start"
                      name="closingTime"
                      value={formData.closingTime || ""}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitting}
                    />
                    <select
                      className="form-select rounded-end"
                      style={{ maxWidth: "100px" }}
                      name="closingPeriod"
                      value={formData.closingPeriod || "PM"}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>

                {/* Working Day */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">
                    Holiday <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="day"
                    value={formData.day || ""}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">Select Day</option>
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>

                {/* Images */}
                <div className="col-12">
                  <label className="form-label fw-semibold">Salon Images</label>
                  <div className="position-relative">
                    <input
                      type="file"
                      id="file-upload-box"
                      className="d-none"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor="file-upload-box"
                      className="d-flex bg2 flex-column align-items-center justify-content-center p-4 border rounded bg-light text-secondary cursor-pointer"
                      style={{ borderStyle: 'dashed !important', borderWidth: '2px', cursor: 'pointer' }}
                    >
                      <div className="mb-2 p-3 bg3 rounded-circle bg-white shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                          <path fillRule="evenodd" d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773 16 9.614 14.118 11.002 12.244 11.002h-2.026a.5.5 0 0 1-.5-.5V7.854l1.646 1.647a.5.5 0 0 0 .708-.708l-2.5-2.5a.5.5 0 0 0-.708 0l-2.5 2.5a.5.5 0 0 1-.708-.708L7.5 7.854V10.5a.5.5 0 0 1-.5.5h-1.793c-2.112 0-3.518-1.559-3.518-3.468C1.696 5.996 2.825 4.515 4.406 1.342z" />
                        </svg>
                      </div>
                      <span className="fw-medium text-dark bg1">Click to upload images</span>
                    </label>
                  </div>

                  {images.length > 0 && (
                    <div className="row g-2 mt-3">
                      {images.map((image, index) => (
                        <div key={index} className="col-4 col-sm-3 col-md-2 position-relative">
                          <img
                            src={image.preview}
                            className="img-fluid rounded shadow-sm border w-100"
                            style={{ height: '80px', objectFit: 'cover', display: 'block' }}
                            alt={`Preview ${index + 1}`}
                          />
                          <button
                            type="button"
                            className="position-absolute top-0 end-0 m-1 btn btn-danger btn-sm p-0 rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                            style={{ width: '20px', height: '20px', lineHeight: 1 }}
                            onClick={() => removeImage(index)}
                            disabled={isSubmitting}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            <div className="modal-footer d-flex flex-sm-row gap-2 gap-sm-0">
              <button
                type="button"
                className="btn btn-secondary order-2 order-sm-1"
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="buttoncolor position-relative order-1 order-sm-2"
                disabled={isSubmitting}
              >
                <span className="d-flex align-items-center">
                  <i className={`bi ${isSubmitting ? 'bi-hourglass-split' : 'bi-check-circle'} me-1`}></i>
                  {isSubmitting ? (modalMode === "add" ? 'Adding...' : 'Updating...') : (modalMode === "add" ? 'Add Salon' : 'Update Salon')}
                </span>
                {isSubmitting && (
                  <div className="spinner-border spinner-border-sm ms-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SalonEditModal;
