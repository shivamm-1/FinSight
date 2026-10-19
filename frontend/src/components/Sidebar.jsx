import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Database,
  Upload,
  TrendingUp,
  TrendingDown,
  ChartNoAxesCombined,
  Percent,
  Wallet,
  Scale,
  Target,
  GitCompareArrows,
  Equal,
  Package,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";

const navigationGroups = [
  {
    title: "GENERAL",
    items: [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "Business Profile", path: "/business-profile", icon: Building2 },
      { name: "Financial Data", path: "/financial-data", icon: Database },
      { name: "Import Data", path: "/import-data", icon: Upload },
    ],
  },
  {
    title: "FINANCIAL ANALYSIS",
    items: [
      { name: "Revenue Analysis", path: "/revenue-analysis", icon: TrendingUp },
      {
        name: "Expense Analysis",
        path: "/expense-analysis",
        icon: TrendingDown,
      },
      {
        name: "Profit & Loss",
        path: "/profit-loss",
        icon: ChartNoAxesCombined,
      },
      { name: "Profit Margin", path: "/profit-margin", icon: Percent },
      { name: "Cash Flow", path: "/cash-flow", icon: Wallet },
      { name: "Ratio Analysis", path: "/ratio-analysis", icon: Scale },
      { name: "Break-Even Analysis", path: "/break-even", icon: Equal },
      {
        name: "Product Profitability",
        path: "/product-profitability",
        icon: Package,
      },
      { name: "Trend Analysis", path: "/trend-analysis", icon: TrendingUp },
    ],
  },
  {
    title: "PLANNING & INSIGHTS",
    items: [
      { name: "Goal Planning", path: "/goal-planning", icon: Target },
      {
        name: "Scenario Analysis",
        path: "/scenario-analysis",
        icon: GitCompareArrows,
      },
    ],
  },
];

function Sidebar({ onClose }) {
  const navigate = useNavigate();

  function handleSignOut() {
    localStorage.removeItem("finsight_token");
    toast.success("Signed out successfully.");
    onClose?.();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="flex min-h-[calc(100vh-49px)] w-64 flex-col bg-white p-4 lg:min-h-screen">
      <NavLink to="/dashboard" onClick={onClose} className="mb-8 block">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Fin<span className="text-blue-700">Sight</span>
        </h2>

        <p className="mt-1 text-xs text-gray-500">
          Financial insights for business
        </p>
      </NavLink>

      <nav className="flex-1 space-y-6">
        {navigationGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-gray-400">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`
                    }
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-6 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
