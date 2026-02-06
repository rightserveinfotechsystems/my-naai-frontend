import React, { useRef, useState, useEffect } from "react";

const CameraCaptureModal = ({ onUpload, onClose }) => {
  const cameraInputRef = useRef(null);

  const [capturedImage, setCapturedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  // cleanup preview URL
  useEffect(() => {
    return () => {
      if (capturedImage?.preview) {
        URL.revokeObjectURL(capturedImage.preview);
      }
    };
  }, [capturedImage]);

  // 📸 Open camera
  const openCamera = () => {
    cameraInputRef.current.click();
  };

  // 📸 Capture image
  const handleCameraCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setCapturedImage({
      file,
      preview: previewUrl,
    });

    e.target.value = ""; // allow retake
  };

  // ❌ Cancel / Retake
  const handleCancel = () => {
    if (capturedImage?.preview) {
      URL.revokeObjectURL(capturedImage.preview);
    }
    setCapturedImage(null);
  };

  // ☁ Upload image
  const handleUpload = async () => {
    if (!capturedImage?.file) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("image", capturedImage.file);

      // 🔁 replace with your API
      // await axios.post("/upload", formData);

      // simulate upload
      await new Promise((res) => setTimeout(res, 1200));

      onUpload?.(capturedImage.file);

      handleCancel();
      onClose?.();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-3">
      {/* Hidden Camera Input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleCameraCapture}
      />

      {/* Capture Button */}
      {!capturedImage && (
        <button
          className="btn btn-primary"
          onClick={openCamera}
        >
          📸 Capture Photo
        </button>
      )}

      {/* Preview */}
      {capturedImage && (
        <div className="mt-3">
          <p className="fw-semibold mb-2">Preview</p>

          <img
            src={capturedImage.preview}
            alt="Captured"
            className="rounded border"
            style={{
              width: "100%",
              maxWidth: "300px",
              height: "auto",
              objectFit: "cover",
            }}
          />

          <div className="d-flex gap-2 mt-3">
            <button
              className="btn btn-success"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={uploading}
            >
              Retake
            </button>

            <button
              className="btn btn-outline-danger"
              onClick={onClose}
              disabled={uploading}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraCaptureModal;
