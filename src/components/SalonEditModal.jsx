import { useState, useEffect, useId } from "react";
import { toast } from 'react-toastify';
import { salonAPI, serviceAPI, salonRequestAPI } from "../services/communication.jsx";
import DeleteConfirmModal from "./DeleteConfirmModal.jsx";

// Cities list for dropdown
const cities = [
  "Katol",
  "Warud"
];
const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const SalonEditModal = ({ showModal, setShowModal, modalMode, editingSalonId, onSuccess }) => {
  const maleRadioId = useId();
  const femaleRadioId = useId();
  const unisexRadioId = useId();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
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
    rating: "",
    numberOfReviews: "",
    latitude: "",
    longitude: "",
    // isPopular: false,
    // isFeatured: false,
    // isVerified: false,

    // Services
    services: [],

    // Business hours
    scheduleId: "",
    openingTime: "09:00",
    closingTime: "21:00",
    breakStartTime: "13:00",
    breakEndTime: "14:00",
    breakStartPeriod: "PM",
    breakEndPeriod: "PM",
    day: "",
    holidayDays: [],
    originalServices: []

  });

  const [images, setImages] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    serviceIndex: null,
    loading: false
  });

  useEffect(() => {
    const loadSalonData = async () => {
      if (showModal) {
        if (modalMode === "edit" && editingSalonId) {
          try {

            const result = await salonAPI.getSalonById(editingSalonId);
            if (result.success && result.data) {
              const salon = result.data;

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
                gender: (salon.genderType || "").toLowerCase(),
                genderType: salon.genderType || "",
                rating: salon.ratingAverage || salon.rating || "",
                numberOfReviews: salon.numberOfReviews || salon.reviewCount || salon.totalReviews || "",
                latitude: salon.latitude || "",
                longitude: salon.longitude || "",
                // isPopular: salon.isPopular || false,
                // isFeatured: salon.isFeatured || false,
                // isVerified: salon.isVerified || false,
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
                day: (() => {
                  const holidayDays = salon.businessHours?.[0]?.holidayDays;
                  if (holidayDays && holidayDays.length > 0) {
                    const firstHoliday = holidayDays[0];
                    const normalizedDay = normalizeDayName(firstHoliday);
                    return normalizedDay;
                  }
                  return "";
                })(),
                holidayDays: salon.businessHours?.[0]?.holidayDays || [],
                originalServices: salon.services ? salon.services.map(service => ({
                  id: service.serviceId || service.id,
                  name: service.serviceName || service.name || "",
                  price: service.price || "",
                  duration: service.durationMinutes || service.duration || "",
                  description: service.description || "No description"
                })) : []
              });

             
              let loadedImages = [];

              const imageFields = ['imagesArray'];

              for (const field of imageFields) {
                if (salon[field] && Array.isArray(salon[field]) && salon[field].length > 0) {
                  console.log(`Found gallery images in ${field}:`, salon[field]);
                  loadedImages = salon[field].map(img => {
                    if (typeof img === 'string') {
                      console.log(`Processing string image: ${img}`);
                      return img;
                    } else if (img && typeof img === 'object') {
                      const imageUrl = img.url || img.imageUrl || img.photoUrl || img.src || img.path;
                      console.log(`Processing object image:`, img, `-> extracted URL: ${imageUrl}`);
                      return imageUrl;
                    }
                    console.log(`Invalid image format:`, img);
                    return null;
                  }).filter(img => img !== null);
                  break;
                }
              }

              // Note: We do NOT load the main image (imageUrl/shopLogo) into the gallery images array
              // The main image is handled separately in the form data

              console.log("Gallery images loaded:", loadedImages);
              console.log("Setting images state with:", loadedImages);
              setImages(loadedImages);

            } else {
              console.error("Failed to load salon data:", result.message);
              toast.error(`Failed to load salon data: ${result.message}`);
            }
          } catch (error) {
            console.error("Error loading salon data:", error);
            toast.error("Failed to load salon data for editing");
          }
        } else if (modalMode === "add") {
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
            rating: "",
            numberOfReviews: "",
            latitude: "",
            longitude: "",
            // isPopular: false,
            // isFeatured: false,
            // isVerified: false,

            // Services
            services: [],

            // Business hours
            scheduleId: "",
            openingTime: "09:00",
            closingTime: "21:00",
            breakStartTime: "13:00",
            breakEndTime: "14:00",
            breakStartPeriod: "PM",
            breakEndPeriod: "PM",
            day: "",
            holidayDays: [],
            originalServices: []
          });
          setImages([]);
        }
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

    // Clear error for this service field
    const errorKey = `service_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: undefined }));
    }

    // Clear general services error if exists
    if (errors.services) {
      setErrors(prev => ({ ...prev, services: undefined }));
    }
  };

  const addService = () => {
    setFormData({
      ...formData,
      services: [...formData.services, { name: "", price: "", duration: "", description: "" }]
    });

    // Clear services error when adding a service
    if (errors.services) {
      setErrors(prev => ({ ...prev, services: undefined }));
    }
  };

  const removeService = (index) => {
    // Show confirmation modal instead of directly deleting
    setDeleteModal({
      show: true,
      serviceIndex: index,
      loading: false
    });
  };

  const handleConfirmDelete = async () => {
    const { serviceIndex } = deleteModal;
    const serviceToRemove = formData.services[serviceIndex];

    console.log("🔍 Service to delete:", serviceToRemove);
    console.log("🆔 Service ID:", serviceToRemove?.id || serviceToRemove?.serviceId);

    setDeleteModal(prev => ({ ...prev, loading: true }));

    try {
      // If service has an ID, it exists in database - call delete API
      if (serviceToRemove && (serviceToRemove.id || serviceToRemove.serviceId)) {
        console.log("🗑️ Making API call to delete service from database");
        toast.info("Deleting service from database...");
        const result = await salonAPI.deleteService(serviceToRemove.id || serviceToRemove.serviceId);

        if (result.success) {
          toast.success("Service deleted successfully!");
          // Remove from local state after successful API call
          const newServices = formData.services.filter((_, i) => i !== serviceIndex);
          setFormData({ ...formData, services: newServices });
          setDeleteModal({ show: false, serviceIndex: null, loading: false });
        } else {
          console.error("Failed to delete service:", result.message);
          toast.error(`Failed to delete service: ${result.message}`);
          setDeleteModal({ show: false, serviceIndex: null, loading: false });
        }
      } else {
        console.log("📝 New service (no ID) - removing from local state only");
        toast.info("Removing unsaved service...");
        // New service (no ID) - just remove from local state
        const newServices = formData.services.filter((_, i) => i !== serviceIndex);
        setFormData({ ...formData, services: newServices });
        setDeleteModal({ show: false, serviceIndex: null, loading: false });
        toast.success("Service removed!");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("An error occurred while deleting the service. Please try again.");
      setDeleteModal({ show: false, serviceIndex: null, loading: false });
    }
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    // Salon Name validation
    if (!formData.name || formData.name.trim() === "") {
      newErrors.name = "Please enter salon name";
    }

    // Phone Number validation
    if (!formData.phoneNumber || formData.phoneNumber.trim() === "") {
      newErrors.phoneNumber = "Please enter phone number";
    } else if (!/^[6-9]\d{9}$/.test(formData.phoneNumber.replace(/\s+/g, ''))) {
      newErrors.phoneNumber = "Please enter a valid 10-digit phone number";
    }

    // Email validation
    if (!formData.email || formData.email.trim() === "") {
      newErrors.email = "Please enter email address";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Address Line 1 validation
    if (!formData.addressLine1 || formData.addressLine1.trim() === "") {
      newErrors.addressLine1 = "Please enter address line 1";
    }

    // City validation
    if (!formData.city || formData.city.trim() === "") {
      newErrors.city = "Please select a city";
    }

    // State validation
    if (!formData.state || formData.state.trim() === "") {
      newErrors.state = "Please select a state";
    }

    // Pincode validation
    if (!formData.pincode || formData.pincode.trim() === "") {
      newErrors.pincode = "Please enter pincode";
    } else if (!/^[1-9]\d{5}$/.test(formData.pincode.replace(/\s+/g, ''))) {
      newErrors.pincode = "Please enter a valid 6-digit pincode";
    }

    // Salon Type validation
    if (!formData.gender || formData.gender.trim() === "") {
      newErrors.gender = "Please select salon type";
    }


    // Services validation
    if (!formData.services || formData.services.length === 0) {
      newErrors.services = "Please add at least one service";
    } else {
      formData.services.forEach((service, index) => {
        if (!service.name || service.name.trim() === "") {
          newErrors[`service_${index}_name`] = "Please enter service name";
        }
        if (!service.price || service.price === "" || service.price < 0) {
          newErrors[`service_${index}_price`] = "Please enter valid price";
        }
        if (!service.duration || service.duration === "" || service.duration <= 0) {
          newErrors[`service_${index}_duration`] = "Please enter valid duration";
        }
        if (!service.description || service.description.trim() === "") {
          newErrors[`service_${index}_description`] = "Please enter service description";
        }
      });
    }

    // Opening Time validation
    if (!formData.openingTime || formData.openingTime.trim() === "") {
      newErrors.openingTime = "Please enter opening time";
    }

    // Closing Time validation
    if (!formData.closingTime || formData.closingTime.trim() === "") {
      newErrors.closingTime = "Please enter closing time";
    }

    // Holiday validation
    if (!formData.day || formData.day.trim() === "") {
      newErrors.day = "Please select a holiday";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCloseModal = () => {
    // Clean up image previews
    images.forEach(image => {
      if (image.preview) URL.revokeObjectURL(image.preview);
    });

    setShowModal(false);
    setIsSubmitting(false);
    setErrors({});
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
      rating: "",
      numberOfReviews: "",
      latitude: "",
      longitude: "",
      // isPopular: false,
      // isFeatured: false,
      // isVerified: false,
      services: [],
      scheduleId: "",
      openingTime: "09:00",
      closingTime: "21:00",
      breakStartTime: "13:00",
      breakEndTime: "14:00",
      breakStartPeriod: "PM",
      breakEndPeriod: "PM",
      day: "",
      holidayDays: [],
      originalServices: []
    });
    setImages([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

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
        ratingAverage: formData.rating ? parseInt(formData.rating) : 5,
        totalReviews: formData.numberOfReviews ? parseInt(formData.numberOfReviews) : 0,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        // isPopular: formData.isPopular || true,
        // isFeatured: formData.isFeatured || false,
        // isVerified: formData.isVerified || false,
        imagesArray: images.length > 0 ? images : [],

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



      let result;
      if (modalMode === "edit" && editingSalonId) {
        const { services, ...updateData } = apiData;

        const originalServices = formData.originalServices || [];
        const currentServices = formData.services || [];

        const existingServices = [];
        const newServices = [];

        currentServices.forEach(service => {
          if (service.id) {
            existingServices.push({
              serviceId: service.id,
              serviceName: service.name,
              durationMinutes: parseInt(service.duration) || 30,
              price: parseFloat(service.price) || 0,
              description: service.description || "No description"
            });
          } else {
            newServices.push({
              serviceName: service.name,
              durationMinutes: parseInt(service.duration) || 30,
              price: parseFloat(service.price) || 0,
              description: service.description || "No description"
            });
          }
        });

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
        updateData.existingServices = existingServices;
        updateData.newServices = newServices;



        result = await salonAPI.updateSalon(editingSalonId, updateData);
      } else {
        apiData.services = formData.services.map(service => ({
          serviceName: service.name,
          durationMinutes: parseInt(service.duration) || 30,
          price: parseFloat(service.price) || 0,
          description: service.description || ""
        }));
        console.log("apiData", apiData);

        result = await salonAPI.createSalon(apiData);
        console.log("response", result);

      }

      if (result.success) {
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

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    // Clear HTML5 validation message
    e.target.setCustomValidity('');
  };

  const handleInvalid = (e) => {
    const { name } = e.target;
    const customMessages = {
      name: "Please enter salon name",
      phoneNumber: "Please enter phone number",
      email: "Please enter email address",
      addressLine1: "Please enter address",
      city: "Please select a city",
      state: "Please select a state",
      pincode: "Please enter pincode",
      gender: "Please select salon type",
      openingTime: "Please enter opening time",
      closingTime: "Please enter closing time",
      day: "Please select a holiday"
    };

    if (customMessages[name]) {
      e.target.setCustomValidity(customMessages[name]);
    }
  };

  const handleImageUpload = async (e) => {
    try {
      const files = Array.from(e.target.files);
      const formData = new FormData();
      formData.append('image', files[0]);
      const imagesResponse = await salonRequestAPI.uploadImages(formData);

      if (imagesResponse?.data?.success) {
        setImages(prev => [...prev, imagesResponse?.data?.url]);
        e.target.value = '';
      } else {
        toast.info(imagesResponse?.data?.message || "Image upload failed. Please try again.");
      }
    } catch (error) {
      toast.info(error.message || "Image upload failed. Please try again.");
    }


  };

  console.log("Images state:", images, "Length:", images.length);

  // Debug: Check if images change
  useEffect(() => {
    console.log("Images state updated:", images);
  }, [images]);


  const removeImage = (index) => {
    const image = images[index];
    if (image.preview) URL.revokeObjectURL(image.preview);

    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Drag and drop functionality for images
  const handleDragStart = (e, dragIndex) => {
    setDraggedIndex(dragIndex);
    e.dataTransfer.setData('text/plain', dragIndex);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    setDraggedIndex(null);

    if (dragIndex === dropIndex) return;

    const newImages = [...images];
    const draggedImage = newImages[dragIndex];

    // Remove dragged item
    newImages.splice(dragIndex, 1);

    // Insert at new position
    newImages.splice(dropIndex, 0, draggedImage);

    setImages(newImages);
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

  const normalizeDayName = (dayValue) => {
    if (typeof dayValue === 'string') {
      const dayMap = {
        'sunday': 'sunday', 'monday': 'monday', 'tuesday': 'tuesday', 'wednesday': 'wednesday',
        'thursday': 'thursday', 'friday': 'friday', 'saturday': 'saturday',
        'sun': 'sunday', 'mon': 'monday', 'tue': 'tuesday', 'wed': 'wednesday',
        'thu': 'thursday', 'fri': 'friday', 'sat': 'saturday'
      };
      return dayMap[dayValue.toLowerCase()] || '';
    }
    if (typeof dayValue === 'number') {
      return getDayName(dayValue);
    }
    return '';
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
                  <label className="form-label fw-semibold required-field">Salon Name</label>
                  <input
                    type="text"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onInvalid={handleInvalid}
                    required
                    disabled={isSubmitting}
                    placeholder="Enter salon name"
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
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
                  <label className="form-label fw-semibold required-field">Phone Number</label>
                  <input
                    type="tel"
                    className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                    name="phoneNumber"
                    value={formData.phoneNumber || ""}
                    onChange={handleInputChange}
                    onInvalid={handleInvalid}
                    required
                    disabled={isSubmitting}
                    placeholder="Enter Phone Number"
                  />
                  {errors.phoneNumber && <div className="invalid-feedback">{errors.phoneNumber}</div>}
                </div>

                {/* 4. Email ID */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Email ID</label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    name="email"
                    value={formData.email || ""}
                    onChange={handleInputChange}
                    onInvalid={handleInvalid}
                    disabled={isSubmitting}
                    placeholder="owner@example.com"
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                {/* 5. Address Line 1 */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold required-field">Address Line 1</label>
                  <input
                    type="text"
                    className={`form-control ${errors.addressLine1 ? 'is-invalid' : ''}`}
                    name="addressLine1"
                    value={formData.addressLine1 || ""}
                    onChange={handleInputChange}
                    onInvalid={handleInvalid}
                    required
                    disabled={isSubmitting}
                    placeholder="Shop/Flat number, Street"
                  />
                  {errors.addressLine1 && <div className="invalid-feedback">{errors.addressLine1}</div>}
                </div>

                {/* 6. Address Line 2 */}
                {/* <div className="col-12 col-md-6">
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
                </div> */}

                {/* 7. City */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold required-field">City</label>
                  <select
                    className={`form-select ${errors.city ? 'is-invalid' : ''}`}
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    onInvalid={handleInvalid}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">Select City</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {errors.city && <div className="invalid-feedback">{errors.city}</div>}
                </div>

                {/* 8. State */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold required-field">State</label>
                  <select
                    className={`form-select ${errors.state ? 'is-invalid' : ''}`}
                    name="state"
                    value={formData.state || ""}
                    onChange={handleInputChange}
                    onInvalid={handleInvalid}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">Select State</option>
                    <option value="Maharashtra">Maharashtra</option>

                  </select>
                  {errors.state && <div className="invalid-feedback">{errors.state}</div>}
                </div>

                {/* 9. Pincode */}
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold required-field">Pincode</label>

                  <input
                    type="number"
                    className={`form-control ${errors.pincode ? 'is-invalid' : ''}`}
                    name="pincode"
                    value={formData.pincode || ""}
                    onChange={handleInputChange}
                    onInvalid={handleInvalid}
                    required
                    disabled={isSubmitting}
                    placeholder="124001"
                    maxLength="6"
                  />
                  {errors.pincode && <div className="invalid-feedback">{errors.pincode}</div>}
                </div>



                {/* 10. Latitude */}
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

                {/* 11. Longitude */}
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


                {/* 12. Rating */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Rating</label>
                  <input
                    type="number"
                    className="form-control"
                    name="rating"
                    value={formData.rating || ""}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    placeholder="5"
                    step="1"
                    min="1"
                    max="5"
                    title="Initial rating (1-5 stars)"
                  />
                </div>

                {/* 13. Number of Reviews */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Number of Reviews</label>
                  <input
                    type="number"
                    className="form-control"
                    name="numberOfReviews"
                    value={formData.numberOfReviews || ""}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    placeholder="0"
                    min="0"
                    title="Total number of reviews"
                  />
                </div>

                {/* 11. Image URL */}
                {/* <div className="col-12 col-md-6">
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
                </div> */}

                <div className="row p-3">
                  {/* Salon Type */}
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold mb-2">
                      <span className="required-field">Salon Type</span>
                    </label>

                    <div className="d-flex flex-column gap-2">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="gender"
                          id={maleRadioId}
                          value="male"
                          checked={formData.gender === "male"}
                          onChange={handleInputChange}
                          onInvalid={handleInvalid}
                          disabled={isSubmitting}
                          required
                        />
                        <label className="form-check-label fw-medium" htmlFor={maleRadioId}>
                          <i className="bi bi-person-fill text-primary me-2"></i>Male
                        </label>
                      </div>

                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="gender"
                          id={femaleRadioId}
                          value="female"
                          checked={formData.gender === "female"}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                          required
                        />
                        <label className="form-check-label fw-medium" htmlFor={femaleRadioId}>
                          <i className="bi bi-person-heart text-danger me-2"></i>Female
                        </label>
                      </div>

                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="gender"
                          id={unisexRadioId}
                          value="unisex"
                          checked={formData.gender === "unisex"}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                          required
                        />
                        <label className="form-check-label fw-medium" htmlFor={unisexRadioId}>
                          <i className="bi bi-gender-trans text-success me-2"></i>Unisex
                        </label>
                      </div>
                    </div>
                    {errors.gender && <div className="invalid-feedback d-block">{errors.gender}</div>}
                  </div>

                  {/* Holiday */}
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">
                      <span className="required-field"> Holiday</span>
                    </label>
                    <select
                      className={`form-select ${errors.day ? 'is-invalid' : ''}`}
                      name="day"
                      value={formData.day || ""}
                      onChange={handleInputChange}
                      onInvalid={handleInvalid}
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
                    {errors.day && <div className="invalid-feedback">{errors.day}</div>}
                  </div>

                </div>




                <div className="col-12">
                  <label className="form-label fw-semibold required-field">Services</label>
                  {formData.services.map((service, index) => (
                    <div key={index} className="card mb-3 position-relative" style={{ padding: '16px', paddingTop: '50px' }}>
                      {/* Delete button positioned at top right */}
                      <button
                        type="button"
                        className="btn position-absolute top-0 end-0 mt-2 me-2"
                        onClick={() => removeService(index)}
                        disabled={formData.services.length === 1}
                        style={{
                          zIndex: 100,
                          borderRadius: '50%',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #dc3545, #c82333)',
                          border: 'none',
                          color: 'white',
                          boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)',
                          fontSize: '16px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!e.target.disabled) {
                            e.target.style.transform = 'scale(1.1)';
                            e.target.style.boxShadow = '0 6px 16px rgba(220, 53, 69, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!e.target.disabled) {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.3)';
                          }
                        }}
                        title="Remove Service"
                      >
                        <i className="bi bi-trash"></i>
                      </button>

                      <div className="mb-2">
                        <div className="row g-2">
                          <div className="col-12 col-md-4">
                            <input
                              type="text"
                              className={`form-control ${errors[`service_${index}_name`] ? 'is-invalid' : ''}`}
                              placeholder="Service Name"
                              value={service.name || ""}
                              onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                              required
                            />
                            {errors[`service_${index}_name`] && <div className="invalid-feedback">{errors[`service_${index}_name`]}</div>}
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="input-group">
                              <span className="input-group-text"><i className="bi bi-currency-rupee"></i></span>
                              <input
                                type="number"
                                className={`form-control ${errors[`service_${index}_price`] ? 'is-invalid' : ''}`}
                                placeholder="Price"
                                value={service.price || ""}
                                onChange={(e) => handleServiceChange(index, 'price', e.target.value)}
                                required
                              />
                            </div>
                            {errors[`service_${index}_price`] && <div className="invalid-feedback">{errors[`service_${index}_price`]}</div>}
                          </div>
                          <div className="col-12 col-md-4">
                            <div className="input-group">
                              <input
                                type="number"
                                className={`form-control ${errors[`service_${index}_duration`] ? 'is-invalid' : ''}`}
                                placeholder="Duration"
                                value={service.duration || ""}
                                onChange={(e) => handleServiceChange(index, 'duration', e.target.value)}
                                required
                              />
                              <span className="input-group-text">min</span>
                            </div>
                            {errors[`service_${index}_duration`] && <div className="invalid-feedback">{errors[`service_${index}_duration`]}</div>}
                          </div>
                        </div>
                        <div className="mt-2">
                          <textarea
                            className={`form-control ${errors[`service_${index}_description`] ? 'is-invalid' : ''}`}
                            placeholder="Description"
                            value={service.description || ""}
                            onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                          />
                          {errors[`service_${index}_description`] && <div className="invalid-feedback">{errors[`service_${index}_description`]}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="bg"
                    onClick={addService}
                  >
                    Add Service
                  </button>
                  {errors.services && <div className="invalid-feedback d-block">{errors.services}</div>}
                </div>

                {/* Opening Time */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">
                    <span className="required-field">Opening Time</span>
                  </label>
                  <div className="input-group">
                    <input
                      type="time"
                      className={`form-control rounded-start ${errors.openingTime ? 'is-invalid' : ''}`}
                      name="openingTime"
                      value={formData.openingTime || ""}
                      onChange={handleInputChange}
                      onInvalid={handleInvalid}
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
                  {errors.openingTime && <div className="invalid-feedback d-block">{errors.openingTime}</div>}
                </div>

                {/* Closing Time */}
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold ">
                    <span className="required-field"> Closing Time</span>
                  </label>
                  <div className="input-group">
                    <input
                      type="time"
                      className={`form-control rounded-start ${errors.closingTime ? 'is-invalid' : ''}`}
                      name="closingTime"
                      value={formData.closingTime || ""}
                      onChange={handleInputChange}
                      onInvalid={handleInvalid}
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
                  {errors.closingTime && <div className="invalid-feedback d-block">{errors.closingTime}</div>}
                </div>

                {/* Break Start Time */}
                {/* <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">
                    Break Start Time
                  </label>
                  <div className="input-group">
                    <input
                      type="time"
                      className="form-control rounded-start"
                      name="breakStartTime"
                      value={formData.breakStartTime || ""}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      placeholder="13:00"
                    />
                    <select
                      className="form-select rounded-end"
                      style={{ maxWidth: "100px" }}
                      name="breakStartPeriod"
                      value={formData.breakStartPeriod || "PM"}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div> */}

                {/* Break End Time */}
                {/* <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">
                    Break End Time
                  </label>
                  <div className="input-group">
                    <input
                      type="time"
                      className="form-control rounded-start"
                      name="breakEndTime"
                      value={formData.breakEndTime || ""}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      placeholder="14:00"
                    />
                    <select
                      className="form-select rounded-end"
                      style={{ maxWidth: "100px" }}
                      name="breakEndPeriod"
                      value={formData.breakEndPeriod || "PM"}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div> */}


                {/* Images */}
                <div className="col-12">
                  <label className="form-label fw-semibold">
                    Salon Images
                    <span className="text-muted small ms-2">(Drag to reorder)</span>
                  </label>

                  <div className="d-flex flex-wrap gap-3">
                    {images.length > 0 && images.map((image, index) => (
                      <div
                        key={index}
                        className={`position-relative ${draggedIndex === index ? 'opacity-50' : ''}`}
                        draggable={!isSubmitting}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e)}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, index)}
                        style={{
                          cursor: isSubmitting ? 'not-allowed' : 'move',
                          transform: draggedIndex === index ? 'scale(0.95)' : 'scale(1)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {/* Image Number Badge */}
                        <div
                          className="position-absolute top-0 start-0 m-1 badge bg-black text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                          style={{
                            width: '24px',
                            height: '24px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            zIndex: 10
                          }}
                        >
                          {index + 1}
                        </div>

                        <img
                          src={`${backendURL}/getFiles${image}`}
                          className="rounded border"
                          style={{
                            width: '112px',
                            height: '112px',
                            objectFit: 'fill',
                            display: 'block',
                            filter: isSubmitting ? 'grayscale(50%)' : 'none',
                            opacity: isSubmitting ? 0.7 : 1
                          }}
                          alt={`Preview ${index + 1}`}
                        />

                        <button
                          type="button"
                          className="position-absolute top-0 end-0 m-1 btn btn-danger btn-sm p-0 rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                          style={{ width: '20px', height: '20px', lineHeight: 1, zIndex: 15 }}
                          onClick={() => removeImage(index)}
                          disabled={isSubmitting}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    {/* Add Image Button */}
                    <label
                      className="d-flex align-items-center justify-content-center border border-2 border-dotted 1px solid border-secondary rounded cursor-pointer hover-bg-light transition-all"
                      style={{
                        width: '112px',
                        height: '112px',
                        cursor: 'pointer',
                        backgroundColor: 'transparent'
                      }}
                    >
                      <span className="text-secondary fw-medium">+ Add</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple={false}
                        className="d-none"
                        onChange={handleImageUpload}
                        disabled={isSubmitting}
                      />
                    </label>
                  </div>

                  {images.length > 0 && (
                    <div className="mt-2">

                    </div>
                  )}
                </div>

                {/* Salon Features/Status Checkboxes */}
                {/* <div className="col-12 mt-3">
                  <div className="d-flex flex-wrap gap-4">
                    <label className="d-inline-flex align-items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        style={{ width: '16px', height: '16px' }}
                        checked={formData.isPopular || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            isPopular: e.target.checked,
                          }))
                        }
                        disabled={isSubmitting}
                      />
                      <span className="fw-medium">Popular Salon</span>
                    </label>

                    <label className="d-inline-flex align-items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        style={{ width: '16px', height: '16px' }}
                        checked={formData.isFeatured || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            isFeatured: e.target.checked,
                          }))
                        }
                        disabled={isSubmitting}
                      />
                      <span className="fw-medium">Featured</span>
                    </label>

                    <label className="d-inline-flex align-items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        style={{ width: '16px', height: '16px' }}
                        checked={formData.isVerified || false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            isVerified: e.target.checked,
                          }))
                        }
                        disabled={isSubmitting}
                      />
                      <span className="fw-medium">Verified</span>
                    </label>
                  </div>
                </div> */}

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
                  <i className={`bi ${isSubmitting ? '' : ''} me-1`}></i>
                  {isSubmitting ? (modalMode === "add" ? 'Adding...' : 'Updating...') : (modalMode === "add" ? 'Add Salon' : 'Update Salon')}
                </span>
                {isSubmitting && (
                  <div className=" spinner-border-sm ms-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        show={deleteModal.show}
        onHide={() => setDeleteModal({ show: false, serviceIndex: null, loading: false })}
        onConfirm={handleConfirmDelete}
        loading={deleteModal.loading}
        count={1}
      />
    </div>
  );
};

export default SalonEditModal;
