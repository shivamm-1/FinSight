import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-white border-r p-4">
      <h2 className="text-xl font-bold text-gray-900 mb-6">FinSight</h2>

      <nav className="space-y-2">
        <NavLink
          to="/dashboard"
          className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/business-profile"
          className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
        >
          Business Profile
        </NavLink>

        <NavLink
          to="/financial-data"
          className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
        >
          Financial Data
        </NavLink>

        <NavLink
          to="/import-data"
          className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
        >
          Import Data
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;
