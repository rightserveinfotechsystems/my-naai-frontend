import { Modal, Button } from "react-bootstrap";
import { FaTrash } from "react-icons/fa";

const DeleteConfirmModal = ({ show, onHide, onConfirm, loading, count = 1 }) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      backdrop="static"
      keyboard={false}
      size="sm"
    >
      <Modal.Body className="text-center px-3 px-md-4 py-4">

        <div
          className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
          style={{
            width: 56,
            height: 56,
            backgroundColor: "#fdecea",
            color: "#dc3545",
            fontSize: 24
          }}
        >
          <FaTrash />
        </div>

        <h6 className="fw-bold mb-2 fs-6 fs-md-5">
          Delete {count > 1 ? `${count} Users?` : "User?"}
        </h6>

        <p className="text-muted mb-4 small mx-auto" style={{ maxWidth: 360 }}>
          Are you sure you want to delete {count > 1 ? "these users" : "this user"}? This action cannot be undone.
        </p>

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
            variant="danger"
            onClick={onConfirm}
            disabled={loading}
            className="w-80 w-md-auto px-md-4"
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>

      </Modal.Body>
    </Modal>
  );
};

export default DeleteConfirmModal;
