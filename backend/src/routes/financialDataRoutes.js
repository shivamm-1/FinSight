const express = require("express");

const {
  getFinancialData,
  createFinancialData,
  updateFinancialData,
  deleteFinancialData,
} = require("../controllers/FinancialDataController.js");

const validate = require("../middleware/Validate.js");
const authenticate = require("../middleware/Authenticate.js");
const authorizeRoles = require("../middleware/AuthorizeRoles.js");

const {
  financialDataSchema,
} = require("../validators/FinancialDataValidator.js");

const {
  financialDataUpdateSchema,
} = require("../validators/FinancialDataUpdateValidator.js");

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles("business_owner"));

router.get("/", getFinancialData);

router.post("/", validate(financialDataSchema), createFinancialData);

router.put("/:id", validate(financialDataUpdateSchema), updateFinancialData);

router.delete("/:id", deleteFinancialData);

module.exports = router;
