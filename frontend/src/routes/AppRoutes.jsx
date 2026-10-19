import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/home";
import Login from "../pages/login";
import Register from "../pages/register";
import Dashboard from "../pages/dashboard";
import BusinessProfile from "../pages/businessProfile";
import FinancialData from "../pages/financialData";
import ImportData from "../pages/importData";
import RevenueAnalysis from "../pages/revenueAnalysis";
import ExpenseAnalysis from "../pages/expenseAnalysis";
import ProfitLoss from "../pages/profitLoss";
import ProfitMargin from "../pages/profitMargin";
import CashFlow from "../pages/cashFlow";
import RatioAnalysis from "../pages/ratioAnalysis";
import BreakEven from "../pages/breakEven";
import ProductProfitability from "../pages/productProfitability";
import TrendAnalysis from "../pages/trendAnalysis";
import GoalPlanning from "../pages/goalPlanning";
import ScenarioAnalysis from "../pages/scenarioAnalysis";
import NotFound from "../pages/notFound";
import DashboardLayout from "../layouts/dashboardLayout";
import ProtectedRoute from "./protectedRoutes";

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
