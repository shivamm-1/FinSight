const express = require("express");
const cors = require("cors");

const businessProfileRoutes = require("./routes/BusinessProfileRoutes.js");
const financialDataRoutes = require("./routes/FinancialDataRoutes.js");
const financialAnalysisRoutes = require("./routes/FinancialAnalysisRoutes.js");
const authRoutes = require("./routes/AuthRoutes.js");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.status(200).json({
    message: "FinSight backend is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/business-profile", businessProfileRoutes);
app.use("/api/financial-data", financialDataRoutes);
app.use("/api/financial-analysis", financialAnalysisRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "API endpoint not found",
  });
});

module.exports = app;
