import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import BusinessProfile from "../pages/BusinessProfile";
import FinancialData from "../pages/FinancialData";
import ImportData from "../pages/ImportData";
import RevenueAnalysis from "../pages/RevenueAnalysis";
import ExpenseAnalysis from "../pages/ExpenseAnalysis";
import ProfitLoss from "../pages/ProfitLoss";
import ProfitMargin from "../pages/ProfitMargin";
import CashFlow from "../pages/CashFlow";
import RatioAnalysis from "../pages/RatioAnalysis";
import BreakEven from "../pages/breakEven";
import ProductProfitability from "../pages/ProductProfitability";
import TrendAnalysis from "../pages/TrendAnalysis";
import GoalPlanning from "../pages/GoalPlanning";
import ScenarioAnalysis from "../pages/ScenarioAnalysis";
import NotFound from "../pages/NotFound";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "./ProtectedRoutes";

function AppRoutes() {
  const dashboardPages = [
    { path: "/dashboard", element: <Dashboard /> },
    { path: "/business-profile", element: <BusinessProfile /> },
    { path: "/financial-data", element: <FinancialData /> },
    { path: "/import-data", element: <ImportData /> },
    { path: "/revenue-analysis", element: <RevenueAnalysis /> },
    { path: "/expense-analysis", element: <ExpenseAnalysis /> },
    { path: "/profit-loss", element: <ProfitLoss /> },
    { path: "/profit-margin", element: <ProfitMargin /> },
    { path: "/cash-flow", element: <CashFlow /> },
    { path: "/ratio-analysis", element: <RatioAnalysis /> },
    { path: "/break-even", element: <BreakEven /> },
    { path: "/product-profitability", element: <ProductProfitability /> },
    { path: "/trend-analysis", element: <TrendAnalysis /> },
    { path: "/goal-planning", element: <GoalPlanning /> },
    { path: "/scenario-analysis", element: <ScenarioAnalysis /> },
  ];

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {dashboardPages.map((page) => (
          <Route
            key={page.path}
            path={page.path}
            element={
              <ProtectedRoute>
                <DashboardLayout>{page.element}</DashboardLayout>
              </ProtectedRoute>
            }
          />
        ))}

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
