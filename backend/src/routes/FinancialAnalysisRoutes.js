const express = require("express");

const {
  getFinancialAnalysisController,
} = require("../controllers/FinancialAnalysisController.js");

const authenticate = require("../middleware/Authenticate.js");
const authorizeRoles = require("../middleware/AuthorizeRoles.js");

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("business_owner"));

router.get("/", getFinancialAnalysisController);

module.exports = router;
