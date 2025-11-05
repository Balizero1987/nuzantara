export default function Badge({ children, status = 'active' }) {
  const statusClasses = {
    active: 'badge-active',
    pending: 'badge-pending',
    inactive: 'badge-inactive',
    error: 'badge-error',
  };

  return (
    <span className={`badge ${statusClasses[status] || statusClasses.active}`}>
      {children}
    </span>
  );
}
