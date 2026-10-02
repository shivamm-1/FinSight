function StatCard({ title, value, description }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>

      <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>

      {description && (
        <p className="text-sm text-gray-500 mt-2">{description}</p>
      )}
    </div>
  );
}

export default StatCard;
