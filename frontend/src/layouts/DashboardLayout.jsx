import { useState } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "../components/Sidebar";

function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 overflow-y-auto bg-white shadow-lg transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 lg:shadow-none ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-end border-b border-gray-200 p-2 lg:hidden">
          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Close navigation menu"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          >
            <X size={22} />
          </button>
        </div>

        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      </div>

      {/* Main content */}
      <main className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open navigation menu"
            className="rounded-lg p-2 text-gray-700 hover:bg-gray-100"
          >
            <Menu size={24} />
          </button>

          <h1 className="text-lg font-bold text-gray-900">
            Fin<span className="text-blue-700">Sight</span>
          </h1>
        </header>

        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;
