const express = require("express");
const cors = require("cors");

const businessProfileRoutes = require("./routes/BusinessProfileRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "FinSight backend is running" });
});

app.use("/api/business-profile", businessProfileRoutes);

module.exports = app;
