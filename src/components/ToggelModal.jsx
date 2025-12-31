import { Modal, Button } from "react-bootstrap";
import { FaUserCheck, FaUserTimes } from "react-icons/fa";

const StatusConfirmModal = ({
    show,
    onHide,
    onConfirm,
    currentStatus,
    loading
}) => {
    const isDeactivate = currentStatus;

    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            backdrop="static"
            keyboard={false}
            dialogClassName="status-modal"
        >

            <Modal.Body className="text-center px-3 px-md-4 py-4">

                {/* ICON */}
                <div
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
                    style={{
                        width: 56,
                        height: 56,
                        backgroundColor: isDeactivate ? "#fdecea" : "#e7f6ee",
                        color: isDeactivate ? "#dc3545" : "#198754",
                        fontSize: 24
                    }}
                >
                    {isDeactivate ? <FaUserTimes /> : <FaUserCheck />}
                </div>

                {/* TITLE */}
                <h6 className="fw-bold mb-2 fs-6 fs-md-5">
                    {isDeactivate ? "Deactivate User?" : "Activate User?"}
                </h6>

                {/* DESCRIPTION */}
                <p
                    className="text-muted mb-4 small mx-auto"
                    style={{ maxWidth: 360 }}
                >
                    {isDeactivate
                        ? "This user will no longer be able to access the system until reactivated."
                        : "This user will regain full access to the system."}
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
                        variant={isDeactivate ? "danger" : "success"}
                        onClick={onConfirm}
                        disabled={loading}
                        className="w-80 w-md-auto px-md-4"
                    >
                        {loading
                            ? "Please wait..."
                            : isDeactivate
                                ? "Deactivate"
                                : "Activate"}
                    </Button>
                </div>

            </Modal.Body>
        </Modal>
    );
};

export default StatusConfirmModal;
