const colors = {
  active: "bg-success-subtle text-success border-success-subtle",
  inactive: "bg-secondary-subtle text-secondary border-secondary-subtle",
  pending: "bg-warning-subtle text-warning border-warning-subtle",
  confirmed: "bg-primary-subtle text-primary border-primary-subtle",
  completed: "bg-success-subtle text-success border-success-subtle",
  cancelled: "bg-danger-subtle text-danger border-danger-subtle",
};

const StatusBadge = ({ status }) => {
  const className = `badge rounded-pill status-badge ${colors[status] || "bg-light text-dark"}`;
  return <span className={className}>{status}</span>;
};

export default StatusBadge;

