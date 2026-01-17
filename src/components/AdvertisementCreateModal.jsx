import { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { FaTimes, FaPlus } from "react-icons/fa";
import axios from "axios";
import { advertisementService } from "../services/communication";

const AdvertisementCreateModal = ({ showModal, setShowModal, onSuccess, initialAd = null }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ title: "" });
  const [images, setImages] = useState([]);
  const isEditMode = Boolean(initialAd);

  const API_BASE_URL = "https://backend.mynaai.in";

  const handleCloseModal = () => {
    images.forEach(img => {
      if (img.preview && img.preview.startsWith('blob:')) {
        URL.revokeObjectURL(img.preview);
      }
    });
    setFormData({ title: "" });
    setImages([]);
    setErrors({});
    setIsSubmitting(false);
    setShowModal(false);
  };

  const handleImageUpload = (e) => {

    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));


    setImages(prev => [...prev, ...newImages]);
    e.target.value = '';
  };


  const removeImage = (indexToRemove) => {
    setImages(prev => {
      const target = prev[indexToRemove];
      if (target.preview && target.preview.startsWith('blob:')) URL.revokeObjectURL(target.preview);
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  // --- MAIN SUBMIT LOGIC ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setErrors({ title: "Title is required" });
      return;
    }
    if (images.length === 0) {
      toast.error("Please add at least one image");
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      let finalImagePaths = [];

      for (const img of images) {
        if (img.file) {
          const uploadData = new FormData();
          uploadData.append("image", img.file);

          const uploadRes = await axios.post(`${API_BASE_URL}/api/upload/upload-image`, uploadData, {
            headers: {
              "Content-Type": "multipart/form-data",
              "Authorization": `Bearer ${token}`
            }
          });

          const path = uploadRes.data.url || uploadRes.data.url;
          if (path) finalImagePaths.push(path);
        } else {
          const existingPath = img.preview
            .replace(API_BASE_URL, "")
            .replace(/^\/getfiles/, "");

          finalImagePaths.push(existingPath);

        }
      }

      const finalPayload = {
        title: formData.title.trim(),
        images: finalImagePaths
      };


      let response;
      if (initialAd) {
        const adId = initialAd._id || initialAd.id || initialAd.advertisementId;
        if (!adId) throw new Error('Ad ID not found for update');

        if (advertisementService.updateAd) {
          response = await advertisementService.updateAd(adId, finalPayload);
        } else {
          try {
            response = await axios.post(`${API_BASE_URL}/api/advertisement/update`, { id: adId, ...finalPayload }, {
              headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
            }).then(r => r.data);
          } catch (err) {
            response = await axios.post(`${API_BASE_URL}/api/advertisement/update/${adId}`, finalPayload, {
              headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
            }).then(r => r.data);
          }
        }

        if (response.status === "SUCCESS") {
          toast.success("Advertisement Updated!");
          if (onSuccess) onSuccess(response.data || response.data?.data);
          handleCloseModal();
        }
      } else {
        if (advertisementService.createAd) {
          response = await advertisementService.createAd(finalPayload);
        } else {
          response = await axios.post(`${API_BASE_URL}/api/advertisement/create`, finalPayload, {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });
          response = response.data;
        }

        if (response.status === "SUCCESS") {
          toast.success("Advertisement Created!");
          if (onSuccess) onSuccess(response.data || response.data?.data);
          handleCloseModal();
        }
      }
    } catch (error) {
      console.error("API Error:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!showModal || !initialAd?.images?.length) return;

    setFormData({ title: initialAd.title || "" });

    setImages(
      initialAd.images.map(path => {
        const cleanPath = path.replace(/^\/getfiles/, "");

        return {
          file: null,
          preview: path.startsWith("http")
            ? path
            : `${API_BASE_URL}/getfiles${cleanPath}`
        };
      })
    );
  }, [initialAd, showModal]);



  if (!showModal) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={handleCloseModal}>
      <div className="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px' }}>

          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">
              {isEditMode ? "Update Advertisement" : "Create Advertisement"}
            </h5>



          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <div className="mb-4">
                <label className="form-label fw-bold">Title</label>
                <input
                  type="text"
                  className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter title here..."
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Images</label>
                <div className="d-flex flex-wrap gap-3">
                  {images.map((img, index) => (

                    <div key={index} className="position-relative">
                      <img
                        src={img.preview}
                        style={{ width: '100px', height: '100px', objectFit: 'fill' }}
                        className="rounded border"
                        alt="preview"
                      />

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle"
                        style={{ transform: 'translate(20%, -20%)' }}
                      >
                        <FaTimes size={10} />
                      </button>
                    </div>
                  ))}

                  <label className="border border-secondary border-dashed rounded d-flex align-items-center justify-content-center bg-light" style={{ width: '100px', height: '100px', cursor: 'pointer', borderStyle: 'dashed' }}>
                    <FaPlus className="text-muted" />
                    <input type="file" multiple accept="image/*" className="d-none" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer border-0">
              <button
                type="button"
                className="btn btn-light px-4"
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary px-4"
                style={{ backgroundColor: "#e1b378", border: "none" }}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? (isEditMode ? "Updating..." : "Uploading...")
                  : (isEditMode ? "Update Ad" : "Publish Ad")}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AdvertisementCreateModal;