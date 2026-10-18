import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-white border-b px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-gray-900">
          FinSight
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-gray-700 hover:text-gray-900">
            Login
          </Link>

          <Link
            to="/register"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg"
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
