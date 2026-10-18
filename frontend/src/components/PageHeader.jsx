function PageHeader({ title, description }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-900">{title}</h1>

      {description && <p className="mt-2 text-gray-600">{description}</p>}
    </div>
  );
}

export default PageHeader;
