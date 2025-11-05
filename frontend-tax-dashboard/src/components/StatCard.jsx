export default function StatCard({ label, value, change }) {
  return (
    <div className="card">
      <div className="text-text-secondary text-sm mb-2">{label}</div>
      <div className="text-3xl font-semibold mb-1">{value}</div>
      {change && (
        <div className="text-sm text-green-600">{change}</div>
      )}
    </div>
  );
}
