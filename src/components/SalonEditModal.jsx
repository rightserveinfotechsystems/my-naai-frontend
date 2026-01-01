import { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { cities } from "../data/mockData.js";
import { salonAPI, serviceAPI } from "../services/communication.jsx";

const SalonEditModal = ({ showModal, setShowModal, modalMode, editingSalonId, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Basic salon info
    name: "",
    ownerName: "",
    phoneNumber: "",
    email: "",

    // Address fields
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",

    // Additional info
    imageUrl: "",
    gender: "unisex",
    genderType: "UNISEX",
    status: "active",
    latitude: "",
    longitude: "",

    // Services
    services: [],

    // Business hours
    scheduleId: "", // Add scheduleId for updates
    openingTime: "09:00",
    closingTime: "21:00",
    breakStartTime: "13:00",
    breakEndTime: "14:00",
    day: "",
    holidayDays: [],
    originalServices: []

  });

  const [images, setImages] = useState([]);

  // Load salon data for editing or reset form for adding
  useEffect(() => {
    const loadSalonData = async () => {
      if (showModal) {
        if (modalMode === "edit" && editingSalonId) {
          try {
            // Load existing salon data for editing
            console.log("Loading salon data for editing:", editingSalonId);

            const result = await salonAPI.getSalonById(editingSalonId);
            if (result.success && result.data) {
              const salon = result.data;
              console.log("Loaded salon data:", salon);

              // Map API data to form structure
              setFormData({
                name: salon.salonName || salon.shopName || salon.name || "",
                ownerName: salon.ownerName || "",
                phoneNumber: salon.phoneNumber || "",
                email: salon.email || "",
                addressLine1: salon.addressLine1 || salon.address || "",
                addressLine2: salon.addressLine2 || "",
                city: salon.city || "",
                state: salon.state || "",
                pincode: salon.pincode || "",
                imageUrl: salon.imageUrl || salon.shopLogo || "",
                gender: (salon.genderType || "UNISEX").toLowerCase(),
                genderType: salon.genderType || "UNISEX",
                status: salon.isActive ? "active" : "inactive",
                latitude: salon.latitude || "",
                longitude: salon.longitude || "",
                services: salon.services ? salon.services.map(service => ({
                  id: service.serviceId || service.id,
                  name: service.serviceName || service.name || "",
                  price: service.price || "",
                  duration: service.durationMinutes || service.duration || "",
                  description: service.description || "No description"
                })) : [],
                scheduleId: salon.businessHours?.[0]?.scheduleId || "",
                openingTime: salon.businessHours?.[0]?.openingTime || "09:00",
                closingTime: salon.businessHours?.[0]?.closingTime || "21:00",
                breakStartTime: salon.businessHours?.[0]?.breakStartTime || "13:00",
                breakEndTime: salon.businessHours?.[0]?.breakEndTime || "14:00",
                day: salon.businessHours?.[0]?.holidayDays?.[0] !== undefined ? getDayName(salon.businessHours[0].holidayDays[0]) : "",
                holidayDays: salon.businessHours?.[0]?.holidayDays || [],
                originalServices: salon.services ? salon.services.map(service => ({
                  id: service.serviceId || service.id,
                  name: service.serviceName || service.name || "",
                  price: service.price || "",
                  duration: service.durationMinutes || service.duration || "",
                  description: service.description || "No description"
                })) : []
              });

              console.log("Salon data loaded for editing");
            } else {
              console.error("Failed to load salon data:", result.message);
              toast.error(`Failed to load salon data: ${result.message}`);
            }
          } catch (error) {
            console.error("Error loading salon data:", error);
            toast.error("Failed to load salon data for editing");
          }
        } else if (modalMode === "add") {
          // Reset form for adding new salon
          setFormData({
            // Basic salon info
            name: "",
            ownerName: "",
            phoneNumber: "",
            email: "",

            // Address fields
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            pincode: "",

            // Additional info
            imageUrl: "",
            gender: "unisex",
            genderType: "UNISEX",
            status: "active",
            latitude: "",
            longitude: "",

            // Services
            services: [],

          // Business hours
          scheduleId: "",
          openingTime: "09:00",
          closingTime: "21:00",
          breakStartTime: "13:00",
          breakEndTime: "14:00",
          day: "",
          holidayDays: [],
          originalServices: []
          });
        }
        setImages([]);
      }
    };

    loadSalonData();
  }, [showModal, modalMode, editingSalonId]);

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
      ownerName: "",
      phoneNumber: "",
      email: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      imageUrl: "",
      gender: "unisex",
      genderType: "UNISEX",
      status: "active",
      latitude: "",
      longitude: "",
      services: [],
      scheduleId: "",
      openingTime: "09:00",
      closingTime: "21:00",
      breakStartTime: "13:00",
      breakEndTime: "14:00",
      day: "",
      holidayDays: [],
      originalServices: []
    });
    setImages([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Transform form data to match API structure
      const apiData = {
        salonName: formData.name,
        ownerName: formData.ownerName || "",
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        addressLine1: formData.addressLine1 || "",
        addressLine2: formData.addressLine2 || "",
        city: formData.city,
        state: formData.state || "",
        pincode: formData.pincode || "",
        imageUrl: formData.imageUrl || "",
        genderType: (formData.gender || "unisex").toUpperCase(),
        isActive: formData.status === "active",
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,

        // Services are handled separately below based on mode

        businessHours: [{
          ...(formData.scheduleId && { scheduleId: formData.scheduleId }), // Include scheduleId if it exists (for updates)
          openingTime: formData.openingTime || "09:00",
          closingTime: formData.closingTime || "21:00",
          breakStartTime: formData.breakStartTime || "13:00",
          breakEndTime: formData.breakEndTime || "14:00",
          holidayDays: formData.day ? [getDayNumber(formData.day.toLowerCase())] : []
        }]
      };

      console.log("Submitting salon data:", apiData);
      console.log("Services in data:", apiData.services);
      console.log("Holiday day selected:", formData.day);
      console.log("Holiday day converted:", formData.day ? getDayNumber(formData.day.toLowerCase()) : 'none');
      console.log("Business hours:", apiData.businessHours);
      console.log("Modal Mode:", modalMode);
      console.log("Editing Salon ID:", editingSalonId);

      // Call appropriate API based on mode
      let result;
      if (modalMode === "edit" && editingSalonId) {
        console.log("Calling updateSalon with ID:", editingSalonId);
        // For updates, remove services as they're managed separately
        const { services, ...updateData } = apiData;
        console.log("Update data (without services):", updateData);

        // Separate existing and new services
        const originalServices = formData.originalServices || [];
        const currentServices = formData.services || [];

        console.log("📊 Service comparison:");
        console.log("Original services:", originalServices);
        console.log("Current services:", currentServices);

        // Separate services into existing and new
        const existingServices = [];
        const newServices = [];

        currentServices.forEach(service => {
          // Check if this service exists in original services (by matching properties)
          const existingService = originalServices.find(orig =>
            orig.name === service.name &&
            orig.price === service.price &&
            orig.duration === service.duration
          );

          if (existingService) {
            // This is an existing service
            existingServices.push({
              serviceId: existingService.id,
              serviceName: service.name,
              durationMinutes: parseInt(service.duration) || 30,
              price: parseFloat(service.price) || 0,
              description: service.description || "No description"
            });
          } else {
            // This is a new service
            newServices.push({
              serviceName: service.name,
              durationMinutes: parseInt(service.duration) || 30,
              price: parseFloat(service.price) || 0,
              description: service.description || "No description"
            });
          }
        });

        // Validate services before sending
        const validateService = (service, type) => {
          if (!service.serviceName || service.serviceName.trim() === "") {
            throw new Error(`${type} service name is required`);
          }
          if (!service.description || service.description.trim() === "") {
            throw new Error(`${type} service description is required`);
          }
          if (service.price === null || service.price === undefined || service.price < 0) {
            throw new Error(`${type} service price must be a valid number`);
          }
          if (!service.durationMinutes || service.durationMinutes <= 0) {
            throw new Error(`${type} service duration must be greater than 0`);
          }
        };

        // Validate all services
        existingServices.forEach(service => validateService(service, "Existing"));
        newServices.forEach(service => validateService(service, "New"));

        console.log("✅ Existing services:", existingServices);
        console.log("🆕 New services:", newServices);

        // Add services to updateData
        updateData.existingServices = existingServices;
        updateData.newServices = newServices;

        console.log("📤 Final updateData:", updateData);

        result = await salonAPI.updateSalon(editingSalonId, updateData);
        console.log("Update result:", result);
      } else {
        // Create new salon - include services
        apiData.services = formData.services.map(service => ({
          serviceName: service.name,
          durationMinutes: parseInt(service.duration) || 30,
          price: parseFloat(service.price) || 0,
          description: service.description || ""
        }));

        console.log("Create data (with services):", apiData);
        console.log("Services being sent:", apiData.services);
        console.log("Services count:", apiData.services?.length);
        result = await salonAPI.createSalon(apiData);
        console.log("Create result:", result);
      }

      if (result.success) {
        console.log(`${modalMode === "edit" ? "Salon updated" : "Salon created"} successfully:`, result.data);
        toast.success(`Salon ${modalMode === "edit" ? "updated" : "created"} successfully!`);
        handleCloseModal();

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      } else {
        console.error(`Failed to ${modalMode === "edit" ? "update" : "create"} salon:`, result.message);
        toast.error(`Failed to ${modalMode === "edit" ? "update" : "create"} salon: ${result.message}`);
      }
    } catch (error) {
      console.error("Error creating salon:", error);
      toast.error("An error occurred while creating the salon. Please try again.");
    } finally {
      setIsSubmitting(false);
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
        toast.error(`Image ${file.name} is too large. Max 5MB allowed.`);
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

  // Convert day name to number (0=Sunday, 1=Monday, etc.)
  const getDayNumber = (dayName) => {
    const dayMap = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    };
    return dayMap[dayName.toLowerCase()] ?? 0;
  };

  // Convert day number back to name
  const getDayName = (dayNumber) => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return dayNames[dayNumber] ?? 'sunday';
  };

  if (!showModal) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered modal-lg" style={{ maxWidth: '40%', margin: '1rem auto' }}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">
              <i className={`bi ${modalMode === "add" ? "bi-plus-circle text-warning" : "bi-pencil-square text-warning"} me-2`}></i>
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

                {/* 5. Address Line 1 */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Address Line 1 <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    name="addressLine1"
                    value={formData.addressLine1 || ""}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                    placeholder="Shop/Flat number, Street"
                  />
                </div>

                {/* 6. Address Line 2 */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Address Line 2</label>
                  <input
                    type="text"
                    className="form-control"
                    name="addressLine2"
                    value={formData.addressLine2 || ""}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    placeholder="Landmark, Area"
                  />
                </div>

                {/* 7. City */}
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

                {/* 8. State */}
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

                {/* 9. Latitude */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    name="latitude"
                    value={formData.latitude || ""}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    placeholder="28.6139"
                  />
                </div>

                {/* 10. Longitude */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    name="longitude"
                    value={formData.longitude || ""}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    placeholder="77.2090"
                  />
                </div>

                {/* 11. Image URL */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Image URL</label>
                  <input
                    type="url"
                    className="form-control"
                    name="imageUrl"
                    value={formData.imageUrl || ""}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    placeholder="https://example.com/salon.jpg"
                  />
                </div>

                {/* Salon Type */}
                <div className="col-12">
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

                {/* Salon Status */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold mb-2">Status <span className="text-danger">*</span></label>
                  <div className="d-flex flex-column gap-2">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="status"
                        id="active"
                        value="active"
                        checked={formData.status === "active"}
                        onChange={handleInputChange}
                        required
                        disabled={isSubmitting}
                      />
                      <label className="form-check-label fw-medium" htmlFor="active">
                        <i className="bi bi-check-circle-fill text-success me-2"></i>Active
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="status"
                        id="inactive"
                        value="inactive"
                        checked={formData.status === "inactive"}
                        onChange={handleInputChange}
                        required
                        disabled={isSubmitting}
                      />
                      <label className="form-check-label fw-medium" htmlFor="inactive">
                        <i className="bi bi-x-circle-fill text-danger me-2"></i>Inactive
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
                      <div className="mb-2 p-3 mt-2 bg-black text-white rounded-circle shadow-sm d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                        {/* <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M4.502 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
                          <path d="M14.002 13a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V5A2 2 0 0 1 2.002 3h4a2 2 0 0 1 2 2v7a2 2 0 0 0 2 2z"/>
                          <path d="M2.002 2a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 1 1-1h-3.5a.5.5 0 0 0 0 1h3a.5.5 0 0 0 .5-.5V2a.5.5 0 0 0-.5-.5h-12z"/>
                          <path d="m2.002 3a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 0-1h-9a.5.5 0 0 0-.5.5zM9.002 6.5a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 0 0 1h2a.5.5 0 0 0 .5-.5zM11.002 6.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0 0 1h1a.5.5 0 0 0 .5-.5z"/>
                        </svg> */}
                        <i className="bi bi-cloud-upload-fill fs-4"></i>
                      </div>
                      <div className="text-center">

                      </div>
                    </label>
                  </div>

                  {images.length > 0 && (
                    <div className="row g-2 mt-3">
                      {images.map((image, index) => (
                        <div key={index} className="col-4 col-sm-3 col-md-2 position-relative">
                          <img
                            src={image.preview}
                            className="img-fluid rounded shadow-sm border w-100"
                            style={{ height: '80px', objectFit: 'fill', display: 'block' }}
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
