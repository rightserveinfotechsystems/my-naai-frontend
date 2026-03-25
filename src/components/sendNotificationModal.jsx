import React from "react";
import { Modal, Button } from "react-bootstrap";

const SendNotificationModal = ({ show, onHide, onConfirm, loading }) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      backdrop="static"
      keyboard={false}
      dialogClassName="send-notification-modal"
    >
      <Modal.Body className="text-center px-3 px-md-4 py-4">
        {/* ICON */}
        <div
          className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
          style={{
            width: 56,
            height: 56,
            backgroundColor: "#f0f8ff",
            color: "#0d6efd",
            fontSize: 24,
          }}
        >
          <span>📢</span> {/* or your own icon */}
        </div>

        {/* TITLE */}
        <h6 className="fw-bold mb-2">Send Push Notification?</h6>

        {/* DESCRIPTION */}
        <p className="text-muted mb-4 small mx-auto" style={{ maxWidth: 360 }}>
          Are you sure you want to send this notification to everyone? This action cannot be undone.
        </p>

        {/* ACTION BUTTONS */}
        <div className="d-flex flex-column flex-md-row justify-content-center gap-2">
          <Button
            variant="outline-secondary"
            onClick={onHide}
            disabled={loading}
            className="w-80 w-md-auto px-md-4"
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={loading}
            className="btn btn-sm buttoncolor w-80 w-md-auto px-md-4"
          >
            {loading ? "Sending..." : "Send Notification"}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default SendNotificationModal;