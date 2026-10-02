function Button({ children, type = "button", onClick, className = "" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;
