const express = require("express");

const {
  getFinancialAnalysisController,
} = require("../controllers/financialAnalysisController.js");

const authenticate = require("../middleware/authenticate.js");
const authorizeRoles = require("../middleware/authorizeRoles.js");

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("business_owner"));

router.get("/", getFinancialAnalysisController);

module.exports = router;
