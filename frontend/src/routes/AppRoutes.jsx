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
import BreakEven from "../pages/BreakEven";
import ProductProfitability from "../pages/ProductProfitability";
import TrendAnalysis from "../pages/TrendAnalysis";
import GoalPlanning from "../pages/GoalPlanning";
import ScenarioAnalysis from "../pages/ScenarioAnalysis";
import DashboardInsights from "../pages/DashboardInsights";
import NotFound from "../pages/NotFound";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/business-profile" element={<BusinessProfile />} />
        <Route path="/financial-data" element={<FinancialData />} />
        <Route path="/import-data" element={<ImportData />} />
        <Route path="/revenue-analysis" element={<RevenueAnalysis />} />
        <Route path="/expense-analysis" element={<ExpenseAnalysis />} />
        <Route path="/profit-loss" element={<ProfitLoss />} />
        <Route path="/profit-margin" element={<ProfitMargin />} />
        <Route path="/cash-flow" element={<CashFlow />} />
        <Route path="/ratio-analysis" element={<RatioAnalysis />} />
        <Route path="/break-even" element={<BreakEven />} />
        <Route
          path="/product-profitability"
          element={<ProductProfitability />}
        />
        <Route path="/trend-analysis" element={<TrendAnalysis />} />
        <Route path="/goal-planning" element={<GoalPlanning />} />
        <Route path="/scenario-analysis" element={<ScenarioAnalysis />} />
        <Route path="/dashboard-insights" element={<DashboardInsights />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
